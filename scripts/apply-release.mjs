#!/usr/bin/env node
// Regenerates the release-specific parts of public/index.html from release.json.
//
//   node scripts/apply-release.mjs           # write
//   node scripts/apply-release.mjs --check   # exit 1 if the file is stale
//
// The release appears in two places that must agree: the social-share meta
// tags and the #release section. Editing them by hand means ~11 edits per
// release and the meta tags are easy to forget, so they are generated here
// from one source instead.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HTML = join(ROOT, 'public/index.html');
const SITE = 'https://echoesoftheinfinite.live';
const check = process.argv.includes('--check');

const r = JSON.parse(readFileSync(join(ROOT, 'release.json'), 'utf8'));

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const shareTitle = `${r.artist} — ${r.title} | ${r.label}`;
const imageUrl = `${SITE}${r.artwork}`;

const meta = `
  <meta property="og:title"       content="${esc(shareTitle)}" />
  <meta property="og:description" content="${esc(r.shareDescription)}" />
  <meta property="og:image"       content="${esc(imageUrl)}" />
  <meta property="og:image:width"  content="${r.artworkSize}" />
  <meta property="og:image:height" content="${r.artworkSize}" />
  <meta property="og:image:alt"    content="${esc(`${r.artist} — ${r.title} (${r.label})`)}" />

  <!-- Twitter / X card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${esc(shareTitle)}" />
  <meta name="twitter:description" content="${esc(r.shareDescription)}" />
  <meta name="twitter:image"       content="${esc(imageUrl)}" />`;

const statusCls = r.status === 'out' ? 'status-out' : 'status-coming';
const statusTxt = r.status === 'out' ? 'Out Now' : 'Coming Soon';

const titleWords = r.titleWords
  .map(
    (w, i) =>
      `              <span class="release-title-word${
        i === r.titleWords.length - 1 ? ' accent-text' : ''
      }">${esc(w)}</span>`,
  )
  .join('\n');

const body = r.body
  .map((p) => `          <p class="body-text release-desc">\n            ${esc(p)}\n          </p>`)
  .join('\n');

const section = `
      <div class="release-header reveal-up">
        <span class="catalog-badge">${esc(r.catalog)}</span>
        <p class="section-eyebrow">${esc(r.eyebrow)}</p>
      </div>

      <div class="release-grid">
        <div class="release-artwork-col reveal-left">
          <div class="artwork-frame" id="artworkFrame">
            <div class="artwork-glow-ring"></div>
            <div class="artwork-inner" id="artworkTilt">
              <img
                src="${esc(r.artwork)}"
                alt="${esc(`${r.artist} — ${r.title}`)}"
                class="artwork-img"
              />
              <div class="artwork-overlay"></div>
              <div class="artwork-shine"></div>
            </div>
            <div class="artwork-reflection"></div>
          </div>
        </div>

        <div class="release-info-col reveal-right">
          <div class="release-meta">
            <span class="release-artist">${esc(r.artist)}</span>
            <h2 class="release-title">
${titleWords}
            </h2>
            <div class="release-divider">
              <span class="divider-line"></span>
              <img src="/assets/images/logo-icon-blue.svg" alt="" class="divider-icon" aria-hidden="true" />
              <span class="divider-line"></span>
            </div>
          </div>

${body}

          <div class="release-details">
            <div class="detail-item">
              <span class="detail-label">Label</span>
              <span class="detail-value">${esc(r.label)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Catalog</span>
              <span class="detail-value">${esc(r.catalog)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Genre</span>
              <span class="detail-value">${esc(r.genre)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="detail-value ${statusCls}">${statusTxt}</span>
            </div>
          </div>

          <div class="release-ctas">
            <a href="${esc(r.links.primary.href)}" target="_blank" rel="noopener" class="btn-primary magnetic-btn">
              <span class="btn-text">${esc(r.links.primary.label)}</span>
              <span class="btn-glow"></span>
            </a>
            <a href="${esc(r.links.secondary.href)}" target="_blank" rel="noopener" class="btn-platform magnetic-btn">
              <span class="btn-text">${esc(r.links.secondary.label)}</span>
            </a>
          </div>

          <div class="waveform" aria-hidden="true">
            <div class="waveform-bars" id="waveformBars"></div>
          </div>
        </div>
      </div>
`;

const replaceRegion = (src, name, content) => {
  // The opening marker may carry a trailing "— generated ..." note. Capture the
  // indentation in front of it so the closing marker lines up with it.
  const re = new RegExp(
    `([ \\t]*)(<!-- release:${name}[^>]*-->)[\\s\\S]*?(<!-- /release:${name} -->)`,
  );
  const m = src.match(re);
  if (!m) {
    console.error(`error: missing <!-- release:${name} --> markers in public/index.html`);
    process.exit(1);
  }
  // Normalise trailing newlines so the closing marker always lands on its own
  // line, whichever block is being written.
  return src.replace(re, `$1$2${content.replace(/\n+$/, '')}\n${m[1]}$3`);
};

const before = readFileSync(HTML, 'utf8');
let after = replaceRegion(before, 'meta', meta);
after = replaceRegion(after, 'section', section);

if (check) {
  if (before !== after) {
    console.error('index.html is stale — run: node scripts/apply-release.mjs');
    process.exit(1);
  }
  console.log('index.html matches release.json');
} else if (before === after) {
  console.log(`index.html already current — ${r.catalog} "${r.title}"`);
} else {
  writeFileSync(HTML, after);
  console.log(`index.html updated — ${r.catalog} "${r.title}"`);
}
