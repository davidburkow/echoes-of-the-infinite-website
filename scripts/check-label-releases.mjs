#!/usr/bin/env node
// Detects whether the label has a release this site doesn't show yet.
//
//   node scripts/check-label-releases.mjs          # human-readable
//   node scripts/check-label-releases.mjs --json   # machine-readable
//
// Exit codes: 0 = site is current, 10 = new release found, 1 = error.
//
// This site represents the imprint, not one artist, so it has to see records by
// everyone on the roster. Apple offers no way to query a label directly, and
// searching the label name by text returns unrelated records that merely share
// the words. So the roster is enumerated: ask each artist's feed, then keep only
// the rows whose copyright names Echoes of the Infinite. An artist's releases on
// other labels are ignored here, which is the point.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LABEL = /echoes\s*of\s*the\s*infinite/i;
const jsonOut = process.argv.includes('--json');

const fail = (msg) => {
  console.error(`error: ${msg}`);
  process.exit(1);
};

const cleanTitle = (s) => s.replace(/\s+-\s+(Single|EP|Album)$/i, '').trim();
const cleanLabel = (s) => (s ? s.replace(/^[℗©]\s*\d{4}\s*/, '').trim() : null);
const hiResArt = (u) => (u ? u.replace(/\/\d+x\d+bb\.jpg$/, '/3000x3000bb.jpg') : null);

const norm = (s) =>
  cleanTitle(s)
    .toLowerCase()
    .replace(/\s*[-–(\[].*$/, '')
    .replace(/[^a-z0-9]/g, '');

async function releasesFor(artist) {
  const url = new URL('https://itunes.apple.com/lookup');
  url.searchParams.set('id', artist.appleArtistId);
  url.searchParams.set('entity', 'album');
  url.searchParams.set('limit', '200');
  url.searchParams.set('sort', 'recent');

  const res = await fetch(url);
  if (!res.ok) {
    // One artist failing should not hide every other artist's new record.
    console.error(`warning: lookup failed for ${artist.name} (${res.status})`);
    return [];
  }

  return (await res.json()).results
    .filter((r) => r.wrapperType === 'collection')
    .filter((r) => LABEL.test(cleanLabel(r.copyright) ?? ''))
    .map((r) => ({ ...r, rosterName: artist.name }));
}

// What the site currently features, read from release.json so there is no
// second source of truth to drift.
function current() {
  const r = JSON.parse(readFileSync(join(ROOT, 'release.json'), 'utf8'));
  return { title: r.title, catalog: r.catalog };
}

const { artists } = JSON.parse(readFileSync(join(ROOT, 'roster.json'), 'utf8'));
if (!artists?.length) fail('roster.json lists no artists');

// Sequential, not Promise.all: iTunes throttles aggressively and a roster is
// small enough that the wall-clock cost is irrelevant.
const found = [];
for (const a of artists) found.push(...(await releasesFor(a)));

if (!found.length) fail('no Echoes of the Infinite releases found for any roster artist');

const seen = new Set();
const all = found
  .filter((r) => {
    const k = norm(r.collectionName);
    return seen.has(k) ? false : seen.add(k);
  })
  .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));

const newest = all[0];
const onSite = current();
const isNew = norm(newest.collectionName) !== norm(onSite.title);

const result = {
  isNew,
  onSite: onSite.title,
  onSiteCatalog: onSite.catalog,
  release: {
    artist: newest.artistName,
    rosterName: newest.rosterName,
    title: cleanTitle(newest.collectionName),
    releaseDate: newest.releaseDate.slice(0, 10),
    url: newest.collectionViewUrl,
    artwork: hiResArt(newest.artworkUrl100),
    trackCount: newest.trackCount,
    label: cleanLabel(newest.copyright),
  },
  isBurko: /^burko$/i.test(newest.artistName ?? ''),
  rosterSize: artists.length,
};

if (jsonOut) {
  console.log(JSON.stringify(result, null, 2));
} else if (isNew) {
  console.log(`NEW LABEL RELEASE: ${result.release.artist} "${result.release.title}" (${result.release.releaseDate})`);
  console.log(`site shows:        "${onSite.title}" (${onSite.catalog})`);
  console.log(result.release.url);
  if (!result.isBurko) console.log('not a BURKO record, so this site only; leave burkomusic.com alone');
} else {
  console.log(`up to date: "${onSite.title}" (${onSite.catalog}), ${artists.length} roster artists checked`);
}

process.exit(isNew ? 10 : 0);
