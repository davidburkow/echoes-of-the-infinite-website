/* =============================================================
   ECHOES OF THE INFINITE — Main JavaScript
   Three.js particle nebula · GSAP scroll · Custom cursor ·
   3D album tilt · Magnetic buttons · Waveform · Reveal system
============================================================= */

(function () {
  'use strict';

  // ── Brand colors as normalized RGB ──────────────────────────
  const C = {
    blue:   { r: 0.443, g: 0.439, b: 0.953 },
    uv:     { r: 0.333, g: 0.333, b: 0.624 },
    white:  { r: 0.957, g: 0.961, b: 0.925 },
    magenta:{ r: 0.608, g: 0.173, b: 0.431 },
    purple: { r: 0.35,  g: 0.2,   b: 0.8   },
    indigo: { r: 0.2,   g: 0.1,   b: 0.6   },
  };

  // ── Hero WebGL bridge — lets the easter egg pause/resume the
  //    hero animation loop and borrow the same shader source.
  const _hero = {
    pause:   null,   // () => void  — set by initWebGL
    resume:  null,   // () => void  — set by initWebGL
    getTime: null,   // () => float — returns current uTime
    vertSrc: null,   // GLSL vertex shader string
    fragSrc: null,   // GLSL fragment shader string
  };

  // ── iOS/touch detection ───────────────────────────────────────
  // Also catches iPadOS 13+ which reports as desktop Mac but is touch-only
  const isIOS = (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  ) && !window.MSStream;
  if (isIOS) document.documentElement.classList.add('ios');

  // ── Wait for DOM ─────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initHeroReveal();
    if (isIOS) {
      initIOSHero();   // CSS animated background — no WebGL
    } else {
      initWebGL();
      initGrain();     // extra canvas grain layer
    }
    initCursor();
    initNav();
    initScrollReveal();
    initScrollProgress();
    initAlbumTilt();
    initMagneticButtons();
    initForm();
    initMobileMenu();
    initEasterEgg();
    // Skip canvas/animation-heavy features on iOS
    if (!isIOS) {
      initWaveform();
      initReleaseParticles();
      initParallax();
      initBurkoImprint();
    }
  });

  /* ===========================================================
     HERO — initial reveal timeline
  =========================================================== */
  function initHeroReveal() {
    const logo    = document.getElementById('heroLogo');
    const tagline = document.getElementById('heroTagline');
    const cta     = document.getElementById('heroCta');
    const scroll  = document.getElementById('scrollIndicator');

    requestAnimationFrame(() => {
      setTimeout(() => {
        logo    && logo.classList.add('revealed');
        tagline && tagline.classList.add('revealed');
      }, 200);
      setTimeout(() => {
        cta    && cta.classList.add('revealed');
        scroll && scroll.classList.add('revealed');
      }, 1200);
    });
  }

  /* ===========================================================
     BURKO IMPRINT — appears, holds, then spirals into the black hole
     Physics modelled on what an outside observer actually sees:
       1. Orbital decay — slow inspiral begins
       2. Accelerating infall — spiral tightens
       3. Time dilation — motion FREEZES near event horizon
       4. Gravitational redshift — object dims toward red, then black
       5. Spaghettification — stretched thin along radial direction
       6. Disappears — absorbed at the horizon, never truly crosses
  =========================================================== */
  function initBurkoImprint() {
    const el = document.getElementById('burkoImprint');
    if (!el) return;

    // Kill the CSS transition immediately and permanently —
    // GSAP owns every state change on this element.
    el.style.transition = 'none';

    if (typeof gsap === 'undefined') {
      // Plain CSS fallback (no GSAP)
      setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'none'; }, 1000);
      return;
    }

    // Lock in a definite initial state so GSAP has an unambiguous baseline.
    // filter functions must stay in the same order (brightness → sepia → blur)
    // for every tween so GSAP can interpolate smoothly rather than snap.
    gsap.set(el, {
      opacity:  0,
      x:        -52,   // starts left of centre, slides right on reveal
      y:        0,
      rotation: 0,
      scale:    1,
      filter:   'brightness(1) sepia(0) blur(0px)',
    });

    gsap.timeline()

      // ── Reveal: slide from left, fade in ─────────────────────
      .to(el, {
        opacity:  1,
        x:        0,
        duration: 1.0,
        delay:    1.0,           // appears 1 s after page load
        ease:     'power2.out',
      })

      // ── Hold for 2 s ──────────────────────────────────────────
      .to(el, { duration: 2.0 })

      // ── Compute infall vector, then launch physics sequence ───
      // We snapshot the element's centre at this moment (after it has
      // settled into its final resting position) to accurately target
      // the black hole centre (= viewport centre).
      .call(() => {
        const r   = el.getBoundingClientRect();
        const toX = window.innerWidth  / 2 - (r.left + r.width  / 2);
        const toY = window.innerHeight / 2 - (r.top  + r.height / 2);

        gsap.timeline()

          // Phase 1 — Orbital decay (1.2 s)
          // Gravity begins to tug; object drifts inward and starts rotating.
          // power2.in has enough initial velocity to feel immediate — no lag.
          .to(el, {
            x:        toX * 0.14,
            y:        toY * 0.14,
            rotation: 28,
            duration: 1.2,
            ease:     'power2.in',
          })

          // Phase 2 — Accelerating inspiral (2.0 s)
          // Angular momentum bleeds away. Accretion-disk light warms the hue.
          // NOTE: filter order matches initial baseline → smooth interpolation.
          .to(el, {
            x:        toX * 0.50,
            y:        toY * 0.50,
            rotation: 210,
            scale:    0.70,
            filter:   'brightness(1.15) sepia(0.4) blur(0px)',
            duration: 2.0,
            ease:     'power2.in',
          })

          // Phase 3 — Near event horizon: time dilation + spaghettification (2.5 s)
          // GRAVITATIONAL TIME DILATION → power4.out easing = near-zero velocity.
          // SPAGHETTIFICATION → scaleX compresses, scaleY elongates radially.
          // GRAVITATIONAL REDSHIFT → brightness drops, sepia warms toward red.
          .to(el, {
            x:        toX * 0.84,
            y:        toY * 0.84,
            rotation: 480,
            scaleX:   0.18,
            scaleY:   0.55,
            opacity:  0.50,
            filter:   'brightness(0.6) sepia(0.8) blur(0.8px)',
            duration: 2.5,
            ease:     'power4.out',
          })

          // Phase 4 — Frozen at the horizon, absorbed into darkness (1.5 s)
          // From our reference frame the object never crosses — it dims,
          // redshifts to invisibility, and appears to freeze before vanishing.
          .to(el, {
            x:        toX * 0.96,
            y:        toY * 0.96,
            rotation: 495,
            scaleX:   0.04,
            scaleY:   0.16,
            opacity:  0,
            filter:   'brightness(0) sepia(1) blur(3px)',
            duration: 1.5,
            ease:     'power4.out',
          });
      });
  }

  /* ===========================================================
     THREE.JS — Hyperrealistic Black Hole / Portal
     Face-on view: event horizon shadow, photon ring,
     Keplerian accretion disk with Doppler beaming,
     gravitational lensing of background stars.
  =========================================================== */
  /* ===========================================================
     iOS HERO — CSS-only animated background (no WebGL)
  =========================================================== */
  function initIOSHero() {
    var hero = document.getElementById('hero');
    if (!hero) return;
    // Hide the WebGL canvas — not needed on iOS
    var canvas = document.getElementById('webgl-canvas');
    if (canvas) canvas.style.display = 'none';
    // Add iOS bg div
    var bg = document.createElement('div');
    bg.id = 'hero-ios-bg';
    hero.insertBefore(bg, hero.firstChild);
  }

  function initWebGL() {
    if (typeof THREE === 'undefined') return;

    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) return;

    // ── Renderer ──────────────────────────────────────────────
    // Cap DPR at 1.0 globally — the shader is complex enough that rendering
    // at native retina resolution (2x) is 4x the pixel work for minimal gain.
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance',
    });
    // Render at 50% resolution — browser upscales via CSS.
    // Cuts pixel shader work by 75% (quarter the pixels). The black hole
    // is an abstract effect so the slight softness is imperceptible.
    const RENDER_SCALE = 0.5;
    const DPR = 1.0;
    renderer.setPixelRatio(DPR);
    renderer.setSize(
      Math.floor(canvas.clientWidth  * RENDER_SCALE),
      Math.floor(canvas.clientHeight * RENDER_SCALE),
      false   // don't overwrite CSS — canvas CSS stays 100%/100%
    );
    renderer.setClearColor(0x000003, 1);

    // ── Scene & Camera (fullscreen orthographic quad) ─────────
    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    // ── Vertex Shader (pass-through) ──────────────────────────
    const vertexShader = /* glsl */`
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    _hero.vertSrc = vertexShader;  // share with easter egg

    // ── Fragment Shader — Black Hole ──────────────────────────
    const fragmentShader = /* glsl */`
      precision highp float;

      uniform float uTime;
      uniform vec2  uMouse;
      uniform vec2  uResolution;

      /* ─── Hash / Value Noise ───────────────────────────────── */
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i),                   hash(i + vec2(1.0, 0.0)), f.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }

      /* 4-octave FBM — good quality, meaningfully cheaper than 6 */
      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p  = p * 2.13 + vec2(1.7, 9.2);
          a *= 0.5;
        }
        return v;
      }

      /* ─── Single-cell star field ───────────────────────────── */
      float starField(vec2 uv, float scale) {
        vec2  p    = uv * scale;
        vec2  cell = floor(p);
        vec2  f    = fract(p);
        float h    = hash(cell);
        vec2  off  = vec2(hash(cell * 2.71), hash(cell * 3.97));
        float d    = length(f - off);
        float t    = max(0.0, (h - 0.92) / 0.08);
        return smoothstep(0.13, 0.0, d) * t * t * step(0.92, h);
      }

      void main() {
        /* ── Centered UV (normalized by viewport height) ─────── */
        vec2 uv = (gl_FragCoord.xy - uResolution * 0.5) / uResolution.y;
        uv -= uMouse * 0.045;   /* subtle mouse parallax */

        float r     = length(uv);
        float theta = atan(uv.y, uv.x);

        /* ── Black hole physical radii (UV space) ─────────────
           All normalized by viewport half-height so sizing is
           resolution-independent.
             R_EH   = event horizon (Schwarzschild radius)
             R_PS   = photon sphere  (~1.5 × R_s in GR)
             R_ISCO = innermost stable circular orbit (~3 × R_s)
             R_OUT  = outer accretion disk             (~4.5 × R_s)
        ─────────────────────────────────────────────────────── */
        float R_EH   = 0.200;
        float R_PS   = 0.256;
        float R_ISCO = 0.340;
        float R_OUT  = 0.920;

        /* ── Gravitational lensing deflection ─────────────────
           Deflects background UV ∝ (R_EH/r)^2 toward horizon.
        ─────────────────────────────────────────────────────── */
        vec2 uvDir    = normalize(uv + 0.00001);
        float lensMag = (r > R_EH) ? R_EH * R_EH / (r * r + 0.0001) : 0.0;
        vec2 lensedUV = uv + uvDir * lensMag * 0.55;

        /* ── Deep-space background ────────────────────────────
           Two star scales + faint nebula. Lensed mirror pass
           removed — saves 2 starField() calls in the hot zone.
        ─────────────────────────────────────────────────────── */
        vec3 col = vec3(0.0);

        float s1 = starField(lensedUV, 18.0);
        float s2 = starField(lensedUV + vec2(7.3, 2.1), 38.0);

        col += vec3(0.78, 0.86, 1.00) * s1 * 0.70;
        col += vec3(1.00, 0.93, 0.80) * s2 * 0.60;

        /* Faint Milky-Way nebula glow */
        float neb = fbm(lensedUV * 2.0 + vec2(4.3, 1.7));
        col += vec3(0.04, 0.03, 0.10) * neb * neb;

        /* ── Accretion disk ───────────────────────────────────
           Keplerian orbit: omega ∝ r^(-3/2).
           FBM turbulence co-rotates with the plasma.
           Relativistic Doppler beaming: approaching side brighter.
           Temperature gradient: hot inner → cool magenta outer.
        ─────────────────────────────────────────────────────── */
        if (r > R_ISCO * 0.88 && r < R_OUT * 1.06) {
          /* Angular velocity (normalised to ISCO) */
          float norm_r  = r / R_ISCO;
          float omega   = 0.90 / max(norm_r * sqrt(norm_r), 0.08);

          /* Corotating coordinates for FBM sampling */
          float swTheta = theta - omega * uTime;
          vec2  diskXY  = vec2(cos(swTheta), sin(swTheta)) * r;

          /* Multi-scale plasma turbulence */
          float d1      = fbm(diskXY * 4.8 + vec2(uTime * 0.10));
          float d2      = fbm(diskXY * 10.5 + vec2(uTime * 0.07, uTime * 0.045));
          float density = pow(d1 * 0.62 + d2 * 0.38, 0.72);

          /* Radial falloff: peaks at ISCO, fades outward */
          float iFade = smoothstep(R_ISCO * 0.88, R_ISCO,        r);
          float oFade = smoothstep(R_OUT * 1.06,  R_OUT * 0.52,  r);
          float radial = pow(iFade * oFade, 0.75);

          /* Relativistic Doppler: intensity ∝ δ³, δ = 1 ± β·sin(φ) */
          float vLOS   = sin(swTheta);
          float doppler = pow(max(0.04, 1.0 + 0.95 * vLOS), 3.0);

          /* Temperature → colour gradient */
          float tempT  = smoothstep(R_ISCO, R_OUT * 0.62, r);
          vec3 c_hot   = vec3(1.00, 0.96, 0.88);   /* near-white inner plasma */
          vec3 c_blue  = vec3(0.50, 0.50, 1.00);   /* #7170F3 (boosted)       */
          vec3 c_uv    = vec3(0.333, 0.333, 0.624);/* #55559F ultraviolet     */
          vec3 c_mag   = vec3(0.608, 0.173, 0.431);/* #9B2C6E magenta         */
          vec3 c_dark  = vec3(0.15, 0.03, 0.09);   /* dark outer rim          */

          vec3 diskColor;
          if      (tempT < 0.25) diskColor = mix(c_hot,  c_blue, tempT / 0.25);
          else if (tempT < 0.55) diskColor = mix(c_blue, c_uv,   (tempT - 0.25) / 0.30);
          else if (tempT < 0.80) diskColor = mix(c_uv,   c_mag,  (tempT - 0.55) / 0.25);
          else                   diskColor = mix(c_mag,  c_dark, (tempT - 0.80) / 0.20);

          /* Boost inner-edge brightness via density peak — no extra FBM call */
          float innerBoost = smoothstep(R_ISCO * 1.6, R_ISCO, r) * doppler * 1.8;
          col += diskColor * (density * radial * doppler * 4.5);
          col += vec3(1.00, 0.97, 0.90) * density * innerBoost * radial;
        }

        /* ── Photon ring ──────────────────────────────────────
           Two thin rings: primary at R_PS, secondary slightly
           outside. Sharp Gaussian profile + angular modulation.
        ─────────────────────────────────────────────────────── */
        {
          float rd1   = r - R_PS;
          float rd2   = r - R_PS * 1.058;
          float ring1 = exp(-rd1 * rd1 * 13500.0);
          float ring2 = exp(-rd2 * rd2 * 38000.0);
          float rMod  = 0.76 + 0.24 * sin(theta * 2.0 + uTime * 0.40);

          col += ring1 * rMod * vec3(1.00, 0.97, 0.90) * 9.0;
          col += ring2 * rMod * vec3(0.86, 0.84, 1.00) * 4.5;

          /* Soft photon-sphere glow (captured light) */
          float pGlow = smoothstep(R_ISCO, R_PS, r) * smoothstep(R_EH, R_PS * 0.96, r);
          col += pGlow * vec3(0.443, 0.439, 0.953) * 0.30;
        }

        /* ── Event horizon — absolute darkness ────────────────
           Inside R_EH: complete blackness.
           Outside: exponential darkening toward horizon.
        ─────────────────────────────────────────────────────── */
        if (r < R_EH) {
          col = vec3(0.0);
        } else {
          col *= smoothstep(R_EH, R_PS, r);
        }

        /* ── Outer corona / ambient halo ──────────────────────
           Aggressive wide glow — makes the whole hero feel lit
           by the singularity.
        ─────────────────────────────────────────────────────── */
        col += exp(-r * 1.2) * vec3(0.22, 0.10, 0.50) * 0.28;
        /* Deep magenta pulse bleeding into outer edges */
        col += exp(-r * 0.6) * vec3(0.35, 0.05, 0.20) * 0.10;

        /* ── Tone-map (Reinhard) + gamma ──────────────────────
           Slightly more contrast / punch than before.
        ─────────────────────────────────────────────────────── */
        col  = col / (vec3(0.85) + col);
        col  = pow(max(col, vec3(0.0)), vec3(0.82));

        gl_FragColor = vec4(col, 1.0);
      }
    `;
    _hero.fragSrc = fragmentShader;  // share with easter egg

    // ── Uniforms ──────────────────────────────────────────────
    // gl_FragCoord is in physical pixel space; uResolution must match.
    const uniforms = {
      uTime:       { value: 8.5 },   // pre-seed: starts in a developed state
      uMouse:      { value: new THREE.Vector2(0, 0) },
      uResolution: { value: new THREE.Vector2(
        Math.floor(canvas.clientWidth  * RENDER_SCALE),
        Math.floor(canvas.clientHeight * RENDER_SCALE)
      ) },
    };

    // ── Fullscreen quad ───────────────────────────────────────
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // ── Mouse tracking ────────────────────────────────────────
    const mouse       = { x: 0, y: 0 };
    const targetMouse = { x: 0, y: 0 };
    window.addEventListener('mousemove', (e) => {
      mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    });

    // ── Resize ────────────────────────────────────────────────
    window.addEventListener('resize', () => {
      const rw = Math.floor(canvas.clientWidth  * RENDER_SCALE);
      const rh = Math.floor(canvas.clientHeight * RENDER_SCALE);
      renderer.setSize(rw, rh, false);
      uniforms.uResolution.value.set(rw, rh);
    });

    // ── Animation loop ────────────────────────────────────────
    // Cap hero render to 20 fps — the black hole moves slowly enough
    // that 20fps is visually indistinguishable from 60fps.
    const HERO_FPS   = 20;
    const HERO_FRAME = 1000 / HERO_FPS;
    let lastHeroTime = 0;
    let frameId;
    function animate(now) {
      frameId = requestAnimationFrame(animate);
      if (now - lastHeroTime < HERO_FRAME) return;
      lastHeroTime = now;

      targetMouse.x += (mouse.x - targetMouse.x) * 0.03;
      targetMouse.y += (mouse.y - targetMouse.y) * 0.03;

      uniforms.uTime.value += 0.008;
      uniforms.uMouse.value.set(targetMouse.x, targetMouse.y);

      renderer.render(scene, camera);
    }
    animate(0);

    // Pause when tab is hidden — stops GPU work entirely when user switches tabs
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(frameId); frameId = null;
      } else {
        if (!frameId) animate(0);
      }
    });

    // Pause when hero leaves viewport (user has scrolled past it)
    const heroEl = document.getElementById('hero');
    if (heroEl && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { if (!frameId) animate(0); }
          else { cancelAnimationFrame(frameId); frameId = null; }
        });
      }, { threshold: 0 });
      io.observe(heroEl);
    }

    // ── Expose controls for easter egg ────────────────────────
    _hero.pause   = () => { cancelAnimationFrame(frameId); frameId = null; };
    _hero.resume  = () => { if (!frameId) animate(); };
    _hero.getTime = () => uniforms.uTime.value;
  }

  /* ===========================================================
     CANVAS GRAIN — extra noise layer on the hero
  =========================================================== */
  function initGrain() {
    // Lightweight extra grain drawn on a canvas every few frames
    const c = document.createElement('canvas');
    c.id = 'hero-grain';
    Object.assign(c.style, {
      position: 'absolute', inset: 0,
      width: '100%', height: '100%',
      zIndex: 5, opacity: '0.035',
      pointerEvents: 'none',
      mixBlendMode: 'overlay',
    });
    const hero = document.getElementById('hero');
    if (!hero) return;
    hero.appendChild(c);
    const ctx = c.getContext('2d');
    let w, h;

    function resize() {
      w = c.width  = hero.offsetWidth;
      h = c.height = hero.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    let frame = 0;
    function drawNoise() {
      requestAnimationFrame(drawNoise);
      if (++frame % 3 !== 0) return; // only redraw every 3rd frame
      const img = ctx.createImageData(w, h);
      const data = img.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        data[i]   = v;
        data[i+1] = v;
        data[i+2] = v;
        data[i+3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    }
    drawNoise();
  }

  /* ===========================================================
     CUSTOM CURSOR
  =========================================================== */
  function initCursor() {
    const cursor = document.getElementById('cursor');
    const ring   = document.getElementById('cursor-ring');
    const dot    = document.getElementById('cursor-dot');
    if (!cursor || !ring || !dot) return;

    let mx = -100, my = -100;
    let rx = -100, ry = -100;

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      cursor.style.left = mx + 'px';
      cursor.style.top  = my + 'px';
      dot.style.left    = mx + 'px';
      dot.style.top     = my + 'px';
    });

    // Ring lags behind for dreamy effect
    function animateRing() {
      rx += (mx - rx) * 0.1;
      ry += (my - ry) * 0.1;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(animateRing);
    }
    animateRing();

    // Hover state
    const hoverEls = document.querySelectorAll(
      'a, button, .magnetic-btn, .artwork-frame, .glass-panel'
    );
    hoverEls.forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    // Hide when leaving window
    document.addEventListener('mouseleave', () => {
      cursor.style.opacity = '0';
      ring.style.opacity   = '0';
      dot.style.opacity    = '0';
    });
    document.addEventListener('mouseenter', () => {
      cursor.style.opacity = '1';
      ring.style.opacity   = '1';
      dot.style.opacity    = '1';
    });
  }

  /* ===========================================================
     NAVIGATION — scroll state
  =========================================================== */
  function initNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    let lastY = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > 60) nav.classList.add('scrolled');
      else        nav.classList.remove('scrolled');
      lastY = y;
    }, { passive: true });
  }

  /* ===========================================================
     SCROLL REVEAL — IntersectionObserver
  =========================================================== */
  function initScrollReveal() {
    const targets = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
    if (!targets.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, idx) => {
        if (entry.isIntersecting) {
          // Stagger siblings
          const siblings = entry.target.parentElement
            ? [...entry.target.parentElement.querySelectorAll('.reveal-up, .reveal-left, .reveal-right')]
            : [];
          const order = siblings.indexOf(entry.target);
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, Math.min(order * 80, 300));
          io.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    });

    targets.forEach(el => io.observe(el));
  }

  /* ===========================================================
     SCROLL PROGRESS — thin line at top
  =========================================================== */
  function initScrollProgress() {
    const bar = document.createElement('div');
    Object.assign(bar.style, {
      position: 'fixed',
      top: 0, left: 0,
      height: '2px',
      width: '0%',
      background: 'linear-gradient(90deg, #55559F, #7170F3, #9B2C6E)',
      zIndex: '9999',
      pointerEvents: 'none',
      transition: 'width 0.1s',
    });
    document.body.appendChild(bar);

    window.addEventListener('scroll', () => {
      const max = document.body.scrollHeight - window.innerHeight;
      bar.style.width = (window.scrollY / max * 100) + '%';
    }, { passive: true });
  }

  /* ===========================================================
     ALBUM ART — 3D perspective tilt
  =========================================================== */
  function initAlbumTilt() {
    const frame = document.getElementById('artworkTilt');
    if (!frame) return;

    const parent = frame.closest('.artwork-frame');

    parent.addEventListener('mousemove', (e) => {
      const rect = parent.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;

      frame.style.transform = `
        perspective(800px)
        rotateY(${x * 22}deg)
        rotateX(${-y * 18}deg)
        scale(1.04)
        translateZ(10px)
      `;
      frame.style.transition = 'transform 0.08s';

      // Move shine with mouse
      const shine = frame.querySelector('.artwork-shine');
      if (shine) {
        shine.style.background = `
          linear-gradient(
            ${135 + x * 30}deg,
            rgba(255,255,255,${0.06 + Math.abs(y) * 0.08}) 0%,
            transparent 60%
          )
        `;
      }
    });

    parent.addEventListener('mouseleave', () => {
      frame.style.transform  = 'perspective(800px) rotateY(0) rotateX(0) scale(1)';
      frame.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
    });

    // Idle floating rotation
    let t = 0;
    let hovered = false;
    parent.addEventListener('mouseenter', () => hovered = true);
    parent.addEventListener('mouseleave', () => hovered = false);

    function idleFloat() {
      if (!hovered) {
        t += 0.005;
        frame.style.transform = `
          perspective(800px)
          rotateY(${Math.sin(t) * 4}deg)
          rotateX(${Math.cos(t * 0.7) * 3}deg)
        `;
        frame.style.transition = 'transform 0.3s';
      }
      requestAnimationFrame(idleFloat);
    }
    idleFloat();
  }

  /* ===========================================================
     MAGNETIC BUTTONS
  =========================================================== */
  function initMagneticButtons() {
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width  / 2) * 0.35;
        const y = (e.clientY - rect.top  - rect.height / 2) * 0.35;
        btn.style.transform = `translate(${x}px, ${y}px)`;
        btn.style.transition = 'transform 0.1s';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform  = 'translate(0, 0)';
        btn.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
      });
    });

    // Magnetic nav links
    document.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width  / 2) * 0.2;
        const y = (e.clientY - rect.top  - rect.height / 2) * 0.2;
        el.style.transform  = `translate(${x}px, ${y}px)`;
        el.style.transition = 'transform 0.1s';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform  = 'translate(0, 0)';
        el.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
      });
    });
  }

  /* ===========================================================
     WAVEFORM — animated bars
  =========================================================== */
  function initWaveform() {
    const container = document.getElementById('waveformBars');
    if (!container) return;

    const BAR_COUNT = 48;
    const durations = [
      0.4,0.6,0.5,0.8,0.7,0.9,0.5,0.6,
      1.0,0.7,0.8,0.5,0.6,0.9,0.7,0.4,
    ];
    const heights = [
      30,60,45,80,50,90,40,70,
      55,85,35,65,75,45,55,30,
    ];

    for (let i = 0; i < BAR_COUNT; i++) {
      const bar = document.createElement('div');
      bar.className = 'waveform-bar';
      const h   = heights[i % heights.length] + Math.random() * 20;
      const dur = durations[i % durations.length] + Math.random() * 0.4;
      const del = (i / BAR_COUNT) * 1.2;
      bar.style.setProperty('--dur', dur + 's');
      bar.style.height = h + '%';
      bar.style.animationDelay = del + 's';
      container.appendChild(bar);
    }
  }

  /* ===========================================================
     RELEASE SECTION — floating sparkle particles (CSS only)
  =========================================================== */
  function initReleaseParticles() {
    const container = document.getElementById('releaseParticles');
    if (!container) return;

    const COUNT = 35;
    for (let i = 0; i < COUNT; i++) {
      const p = document.createElement('div');
      const size = 1 + Math.random() * 3;
      const isBlue = Math.random() > 0.4;
      Object.assign(p.style, {
        position: 'absolute',
        width:  size + 'px',
        height: size + 'px',
        borderRadius: '50%',
        background: isBlue
          ? 'rgba(113,112,243,0.7)'
          : 'rgba(155,44,110,0.5)',
        boxShadow: isBlue
          ? `0 0 ${size*4}px rgba(113,112,243,0.4)`
          : `0 0 ${size*4}px rgba(155,44,110,0.3)`,
        left: Math.random() * 100 + '%',
        top:  Math.random() * 100 + '%',
        animation: `float-particle ${3 + Math.random() * 6}s ease-in-out infinite`,
        animationDelay: Math.random() * 5 + 's',
      });
      container.appendChild(p);
    }

    // Inject keyframes for particles
    if (!document.getElementById('particle-keyframes')) {
      const style = document.createElement('style');
      style.id = 'particle-keyframes';
      style.textContent = `
        @keyframes float-particle {
          0%, 100% { transform: translate(0,0) scale(1); opacity: 0.4; }
          25%       { transform: translate(${rnd(20)}px,${rnd(30)}px) scale(1.2); opacity: 0.8; }
          50%       { transform: translate(${rnd(15)}px,${rnd(20)}px) scale(0.8); opacity: 0.6; }
          75%       { transform: translate(${rnd(25)}px,${rnd(10)}px) scale(1.1); opacity: 0.7; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  function rnd(n) { return (Math.random() - 0.5) * n * 2; }

  /* ===========================================================
     CONTACT FORM — formsubmit.co (same integration as burkomusic.com)
  =========================================================== */
  function initForm() {
    const form    = document.getElementById('notifyForm');
    const success = document.getElementById('formSuccess');
    const submitBtn = form ? form.querySelector('.form-submit') : null;
    if (!form || !success || !submitBtn) return;

    const ENDPOINT = 'https://formsubmit.co/ajax/echoesoftheinfinite.ofc@gmail.com';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameVal  = (form.querySelector('input[name="name"]')  || {}).value || '';
      const emailVal = (form.querySelector('input[name="email"]') || {}).value || '';

      if (!emailVal || !emailVal.includes('@')) {
        shakeField(form.querySelector('input[name="email"]'));
        return;
      }

      // Loading state
      const btnText = submitBtn.querySelector('.btn-text');
      const origText = btnText.textContent;
      btnText.textContent = 'Transmitting...';
      submitBtn.disabled = true;

      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            name:      nameVal,
            email:     emailVal,
            _subject:  'New Signal — Echoes of the Infinite',
            _template: 'table',
            _captcha:  'false',
            _replyto:  emailVal,
          }),
        });

        if (res.ok) {
          form.style.transition = 'opacity 0.4s, transform 0.4s';
          form.style.opacity    = '0';
          form.style.transform  = 'translateY(-10px)';
          setTimeout(() => {
            form.style.display = 'none';
            success.classList.add('visible');
          }, 400);
        } else {
          throw new Error('Server error');
        }
      } catch {
        btnText.textContent = 'Try Again';
        submitBtn.disabled  = false;
        submitBtn.style.background = '#9B2C6E';
        setTimeout(() => {
          btnText.textContent        = origText;
          submitBtn.style.background = '';
        }, 3000);
      }
    });
  }

  function shakeField(el) {
    if (!el) return;
    el.style.transition = 'transform 0.08s';
    const shakes = [6, -6, 5, -5, 3, -3, 0];
    shakes.forEach((x, i) => {
      setTimeout(() => { el.style.transform = `translateX(${x}px)`; }, i * 60);
    });
  }

  /* ===========================================================
     MOBILE MENU
  =========================================================== */
  function initMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const menu   = document.getElementById('mobile-menu');
    if (!toggle || !menu) return;

    let open = false;

    toggle.addEventListener('click', () => {
      open = !open;
      menu.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';

      // Animate burger → X
      const spans = toggle.querySelectorAll('span');
      if (open) {
        spans[0].style.transform = 'rotate(45deg) translateY(8px)';
        spans[1].style.opacity   = '0';
        spans[2].style.transform = 'rotate(-45deg) translateY(-8px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity   = '';
        spans[2].style.transform = '';
      }
    });

    // Close on link click
    menu.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', () => {
        open = false;
        menu.classList.remove('open');
        document.body.style.overflow = '';
        toggle.querySelectorAll('span').forEach(s => {
          s.style.transform = '';
          s.style.opacity   = '';
        });
      });
    });
  }

  /* ===========================================================
     PARALLAX — subtle section elements
  =========================================================== */
  function initParallax() {
    const hero = document.getElementById('hero');
    if (!hero) return;

    const heroContent = hero.querySelector('.hero-content');
    const orbs = hero.querySelectorAll('.orb');

    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;

          // Hero content moves up faster on scroll (parallax)
          if (heroContent) {
            heroContent.style.transform = `translateY(${y * 0.4}px)`;
            heroContent.style.opacity   = Math.max(0, 1 - y / 500) + '';
          }

          // Orbs drift at different rates
          orbs.forEach((orb, i) => {
            const rate = 0.15 + i * 0.08;
            orb.style.transform = `translateY(${y * rate}px)`;
          });

          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ===========================================================
     GSAP ScrollTrigger integration (if loaded)
  =========================================================== */
  window.addEventListener('load', () => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // ── About section letters ──────────────────────────────────
    const letters = document.querySelectorAll('.large-letter');
    if (letters.length) {
      gsap.from(letters, {
        scrollTrigger: {
          trigger: '#about',
          start:   'top 80%',
          end:     'top 30%',
          scrub:   1,
        },
        opacity: 0,
        x: -60,
        stagger: 0.05,
        ease: 'power3.out',
      });
    }

    // ── Album artwork parallax ─────────────────────────────────
    const artworkCol = document.querySelector('.release-artwork-col');
    if (artworkCol) {
      gsap.to(artworkCol, {
        scrollTrigger: {
          trigger: '.section-release',
          start:   'top bottom',
          end:     'bottom top',
          scrub:   true,
        },
        y: -40,
        ease: 'none',
      });
    }

    // ── Catalog badge count-up feel ────────────────────────────
    const badge = document.querySelector('.catalog-badge');
    if (badge) {
      ScrollTrigger.create({
        trigger: badge,
        start:   'top 80%',
        onEnter: () => {
          badge.style.transition = 'filter 0.5s, opacity 0.5s';
          badge.style.filter     = 'drop-shadow(0 0 20px rgba(155,44,110,0.8))';
          setTimeout(() => {
            badge.style.filter = '';
          }, 600);
        },
      });
    }

    // ── Release title scramble effect ──────────────────────────
    const releaseTitle = document.querySelector('.release-title');
    if (releaseTitle) {
      ScrollTrigger.create({
        trigger: releaseTitle,
        start:   'top 80%',
        onEnter: () => scrambleText(releaseTitle),
      });
    }

    // ── Artist symbol scale ────────────────────────────────────
    const artistSymbol = document.querySelector('.artist-symbol');
    if (artistSymbol) {
      gsap.from(artistSymbol, {
        scrollTrigger: {
          trigger: '#artist',
          start:   'top 70%',
          toggleActions: 'play none none reverse',
        },
        scale: 0.5,
        opacity: 0,
        duration: 1.5,
        ease: 'elastic.out(1, 0.5)',
      });
    }

    // ── Section background parallax ───────────────────────────
    const bgVideo = document.querySelector('.about-bg-video video');
    if (bgVideo) {
      gsap.to(bgVideo, {
        scrollTrigger: {
          trigger: '.section-about',
          start:   'top bottom',
          end:     'bottom top',
          scrub:   true,
        },
        y: 80,
        ease: 'none',
      });
    }

    // ── Footer logo reveal ─────────────────────────────────────
    const footerLogo = document.querySelector('.footer-logo');
    if (footerLogo) {
      gsap.from(footerLogo, {
        scrollTrigger: {
          trigger: 'footer',
          start:   'top 85%',
        },
        opacity: 0,
        scale: 0.9,
        duration: 1.2,
        ease: 'power3.out',
      });
    }
  });

  /* ===========================================================
     TEXT SCRAMBLE — Matrix-style character reveal
  =========================================================== */
  function scrambleText(el) {
    const original = el.innerText;
    const chars    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789∞◊△○';
    let frame      = 0;
    const FRAMES   = 18;

    const interval = setInterval(() => {
      el.innerText = original
        .split('')
        .map((ch, i) => {
          if (i < frame / FRAMES * original.length) return ch;
          if (ch === ' ') return ' ';
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');

      if (++frame > FRAMES) {
        el.innerText = original;
        clearInterval(interval);
      }
    }, 50);
  }

  /* ===========================================================
     EASTER EGG v2 — Cryptic discovery sequence
     Type "unreleased" anywhere (not in a form field):
       0ms    Hero pauses. Overlay appears. .aif sound plays.
              Green CRT static erupts on top of the hero BH shader.
       0ms    Same GLSL black hole renders in overlay at 7x speed.
       600ms  Green static fades.
       3000ms BH slows to normal speed. Text spit out (reverse physics).
       5500ms Text fully readable.
       2500ms Download fires silently.
       10000ms Auto-dismiss. Hero resumes.
  =========================================================== */
  function initEasterEgg() {
    const SECRET   = 'unreleased';
    const FILE_URL = '/assets/audio/eoti-signal-001.wav';
    const DL_NAME  = 'BURKO - Delusion [Echoes of the Infinite].wav';
    let   buf      = '';
    let   active   = false;
    let   noiseRafId      = null;
    let   eeRafId         = null;
    let   eeThreeRenderer = null;
    let   autoDismissTimer = null;

    // isIOS is declared at module level (top of IIFE)

    // ── Pre-fetch audio bytes on page load so playback is instant ─
    // Use WAV — universally supported by Web Audio API in all browsers.
    // (The original .aif is Safari-only; WAV works everywhere.)
    // slice(0) on playback gives decodeAudioData a fresh copy each time.
    let eeAudioData = null;
    fetch('/assets/audio/ee-trigger.wav')
      .then(function(r) { return r.arrayBuffer(); })
      .then(function(buf) { eeAudioData = buf; })
      .catch(function() {});

    // ── Keyboard listener ─────────────────────────────────────
    document.addEventListener('keydown', function(e) {
      var tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key.length === 1) {
        if (active) return;
        buf += e.key.toLowerCase();
        if (buf.length > SECRET.length) buf = buf.slice(-SECRET.length);
        if (buf === SECRET) { buf = ''; fireEasterEgg(); }
      } else if (e.key === 'Escape') {
        buf = '';
        if (active) dismissOverlay();
      }
    });

    // ── Touch trigger (mobile / iOS) ──────────────────────────
    // 5 taps anywhere on the screen within 3 seconds
    var tapCount = 0;
    var tapTimer = null;
    document.addEventListener('touchend', function(e) {
      if (active) return;
      // Ignore taps on the easter egg overlay itself
      if (document.getElementById('easter-egg-overlay') &&
          document.getElementById('easter-egg-overlay').classList.contains('ee-active')) return;
      tapCount++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(function() { tapCount = 0; }, 3000);
      if (tapCount >= 5) {
        tapCount = 0;
        clearTimeout(tapTimer);
        fireEasterEgg();
      }
    }, { passive: true });

    // ── Play the .aif sound file ──────────────────────────────
    function playEEAudio() {
      if (!eeAudioData) return;
      try {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        var ac = new AudioCtx();
        // slice(0) copies the buffer — decodeAudioData detaches the original
        ac.decodeAudioData(eeAudioData.slice(0), function(decoded) {
          var src = ac.createBufferSource();
          src.buffer = decoded;
          src.connect(ac.destination);
          src.start(0);
          src.onended = function() { ac.close(); };
        });
      } catch(e2) { /* fail silently */ }
    }

    // ── Build overlay DOM (once, lazily) ──────────────────────
    function buildOverlay() {
      if (document.getElementById('easter-egg-overlay')) return;

      var overlay = document.createElement('div');
      overlay.id = 'easter-egg-overlay';
      overlay.setAttribute('aria-live', 'polite');

      // WebGL canvas — same GLSL BH shader as hero
      var glCanvas = document.createElement('canvas');
      glCanvas.id = 'ee-webgl';

      // CRT static — brief green flash on top of the BH
      var noiseCanvas = document.createElement('canvas');
      noiseCanvas.id = 'ee-noise';

      // Text content — emerges with reverse-physics from BH centre
      var content = document.createElement('div');
      content.className = 'ee-content';
      content.style.transition = 'none';
      content.innerHTML =
        '<p class="ee-unlock">You\'ve unlocked…</p>' +
        '<p class="ee-artist">BURKO</p>' +
        '<p class="ee-track">Delusion</p>' +
        '<p class="ee-coming">coming soon on Echoes of the Infinite.</p>' +
        (isIOS ? '<button class="ee-save-btn">[ save file ]</button>' : '') +
        '<button class="ee-dismiss">[ dismiss ]</button>';

      overlay.appendChild(glCanvas);
      overlay.appendChild(noiseCanvas);
      overlay.appendChild(content);
      document.body.appendChild(overlay);

      content.querySelector('.ee-dismiss').addEventListener('click', dismissOverlay);

      // iOS save button — must call share directly from tap (gesture context)
      if (isIOS) {
        content.querySelector('.ee-save-btn').addEventListener('touchend', function(e) {
          e.stopPropagation();
          iosShareFile(FILE_URL, DL_NAME);
        }, { passive: true });
      }

      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) dismissOverlay();
      });
    }

    // ── GLSL black hole renderer — same shader as the hero ────
    // Canvas starts at scale(0) and expands to scale(1) in 0.65 s.
    // uTime runs at 7x speed for 1.5 s (fast swirl), then normal.
    // uScale animates 0.12 -> 1.0 over 1 s, growing the BH from
    // coin-size to fullscreen entirely inside the GLSL shader.
    function startEERenderer() {
      var canvas = document.getElementById('ee-webgl');
      if (!canvas || typeof THREE === 'undefined') return;
      if (!_hero.vertSrc || !_hero.fragSrc) return;

      var DPR = 1.0;

      eeThreeRenderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: false,
        antialias: false,
        powerPreference: 'high-performance',
      });
      eeThreeRenderer.setPixelRatio(DPR);
      eeThreeRenderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      eeThreeRenderer.setClearColor(0x000003, 1);

      var scene  = new THREE.Scene();
      var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      camera.position.z = 1;

      // Patch the hero fragment shader to add a uScale uniform.
      // uScale divides the UV space: small value = tiny BH, 1.0 = normal.
      // We replace exactly two known strings so the hero shader is unaffected.
      var eeFragSrc = _hero.fragSrc
        .replace(
          'uniform vec2  uResolution;',
          'uniform vec2  uResolution;\nuniform float uScale;'
        )
        .replace(
          'vec2 uv = (gl_FragCoord.xy - uResolution * 0.5) / uResolution.y;',
          'vec2 uv = (gl_FragCoord.xy - uResolution * 0.5) / (uResolution.y * uScale);'
        );

      var uniforms = {
        uTime:       { value: _hero.getTime ? _hero.getTime() : 8.5 },
        uMouse:      { value: new THREE.Vector2(0, 0) },
        uResolution: { value: new THREE.Vector2(
          canvas.clientWidth * DPR,
          canvas.clientHeight * DPR
        )},
        uScale:      { value: 0.12 },  // start at ~coin size
      };

      var material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: _hero.vertSrc,
        fragmentShader: eeFragSrc,
      });

      var mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
      scene.add(mesh);

      var fastPhase  = true;
      setTimeout(function() { fastPhase = false; }, 1500);

      // Expand: uScale 0.12 -> 1.0 over 1000 ms with power3.out easing
      var expandStart = performance.now();
      var EXPAND_MS   = 1000;

      function eeLoop(now) {
        eeRafId = requestAnimationFrame(eeLoop);

        // Drive uScale expansion
        var elapsed = (now || performance.now()) - expandStart;
        if (elapsed < EXPAND_MS) {
          var t = elapsed / EXPAND_MS;
          var ease = 1 - Math.pow(1 - t, 3);       // power3.out
          uniforms.uScale.value = 0.12 + 0.88 * ease;
        } else {
          uniforms.uScale.value = 1.0;
        }

        uniforms.uTime.value += fastPhase ? 0.07 : 0.008;
        eeThreeRenderer.render(scene, camera);
      }
      eeLoop(performance.now());
    }

    function stopEERenderer() {
      if (eeRafId) { cancelAnimationFrame(eeRafId); eeRafId = null; }
      if (eeThreeRenderer) {
        eeThreeRenderer.dispose();
        eeThreeRenderer = null;
      }
    }

    // ── Neon green CRT static — chromatic aberration + tears ──
    function startNoise() {
      var canvas = document.getElementById('ee-noise');
      if (!canvas) return;
      var W = 120, H = 75;
      canvas.width  = W;
      canvas.height = H;
      var ctx = canvas.getContext('2d');

      function tick() {
        noiseRafId = requestAnimationFrame(tick);
        var lum = new Float32Array(W * H);
        for (var i = 0; i < lum.length; i++) lum[i] = Math.random();

        var flashFrame = Math.random() < 0.06;
        var rgbAber    = Math.floor((Math.random() - 0.5) * 14);
        var numBands   = 4 + Math.floor(Math.random() * 7);
        var bands = [];
        for (var b = 0; b < numBands; b++) {
          var by = Math.floor(Math.random() * H);
          bands.push({ y0: by, y1: by + 1 + Math.floor(Math.random() * 8),
            shift: Math.floor((Math.random() - 0.5) * W * 0.6),
            bright: 0.4 + Math.random() * 0.6, invert: Math.random() < 0.15 });
        }
        var tearActive = Math.random() < 0.12;
        var tearY  = Math.floor(Math.random() * H * 0.7);
        var tearH2 = 6 + Math.floor(Math.random() * 20);
        var tearDX = Math.floor((Math.random() - 0.5) * W * 0.5);
        var phosphorY = Math.floor(Math.random() * H);

        var img  = ctx.createImageData(W, H);
        var data = img.data;

        for (var y = 0; y < H; y++) {
          var inBand = null;
          for (var bb = 0; bb < bands.length; bb++) {
            if (y >= bands[bb].y0 && y < bands[bb].y1) { inBand = bands[bb]; break; }
          }
          var inTear    = tearActive && y >= tearY && y < tearY + tearH2;
          var scanDim   = (y % 2 === 0) ? 0.48 : 1.0;
          var isPhosphor = (y === phosphorY);

          for (var x = 0; x < W; x++) {
            var idx = (y * W + x) * 4;
            var rx  = Math.min(W - 1, Math.max(0, x + rgbAber));
            var bx2 = Math.min(W - 1, Math.max(0, x - rgbAber));
            var srcG = y * W + x;
            var srcR = y * W + rx;
            var srcB = y * W + bx2;

            if (inBand) {
              var sx = ((x + inBand.shift) % W + W) % W;
              srcG = srcR = srcB = y * W + sx;
            }
            if (inTear) {
              var sx2 = ((x + tearDX) % W + W) % W;
              srcG = srcR = srcB = y * W + sx2;
            }

            var gVal = flashFrame ? (0.8 + Math.random() * 0.2) : lum[srcG];
            var rVal = flashFrame ? gVal : lum[srcR];
            var bVal = flashFrame ? gVal : lum[srcB];

            if (inBand && !flashFrame) {
              gVal = inBand.invert ? (1 - gVal) : (gVal * inBand.bright);
              rVal = inBand.invert ? (1 - rVal) : (rVal * inBand.bright * 0.5);
              bVal = inBand.invert ? (1 - bVal) : (bVal * inBand.bright * 0.7);
              if (inBand.bright > 0.7) { gVal = Math.max(gVal, 0.65); }
            }
            if (isPhosphor) { gVal = 0.85 + Math.random() * 0.15; rVal *= 0.3; bVal *= 0.5; }

            gVal *= scanDim; rVal *= scanDim; bVal *= scanDim;
            var vx2 = (x / W - 0.5) * 2, vy2 = (y / H - 0.5) * 2;
            var vig = Math.max(0, 1 - (vx2 * vx2 + vy2 * vy2) * 0.45);
            gVal *= vig; rVal *= vig; bVal *= vig;

            data[idx]   = Math.min(255, Math.floor(rVal * 90));
            data[idx+1] = Math.min(255, Math.floor(gVal * 255));
            data[idx+2] = Math.min(255, Math.floor(bVal * 160));
            data[idx+3] = 255;
          }
        }
        ctx.putImageData(img, 0, 0);
      }
      tick();
    }

    function stopNoise() {
      if (noiseRafId) { cancelAnimationFrame(noiseRafId); noiseRafId = null; }
    }

    // ── Reverse-physics text emergence ───────────────────────
    // Mirrors the infall animation exactly but in reverse:
    //   starts compressed/spinning at event horizon, emerges,
    //   despaghettifies, decelerates as gravity releases hold.
    function spitOutText(content) {
      content.classList.add('revealed');

      if (typeof gsap === 'undefined') {
        content.style.opacity = '1';
        content.style.transform = 'none';
        // Also override individual child CSS opacity: 0
        var kids = content.querySelectorAll('.ee-unlock,.ee-artist,.ee-track,.ee-coming,.ee-save-btn,.ee-dismiss');
        kids.forEach(function(k) { k.style.opacity = '1'; });
        return;
      }

      // Each child element has opacity:0 in CSS — override so the parent
      // animation controls overall visibility (children must be fully opaque).
      var kids = content.querySelectorAll('.ee-unlock,.ee-artist,.ee-track,.ee-coming,.ee-save-btn,.ee-dismiss');
      gsap.set(kids, { opacity: 1 });

      // iOS: simple fade-in — no filters/rotation/extreme scale (too heavy for mobile GPU)
      if (isIOS) {
        gsap.set(content, { opacity: 0, scale: 1, rotation: 0 });
        gsap.to(content, { opacity: 1, duration: 0.7, ease: 'power2.out' });
        return;
      }

      // Removed blur() — most expensive filter, causes lag on mid-range GPUs.
      // brightness + sepia preserved for the color/energy effect.
      gsap.set(content, {
        opacity:  0,
        scaleX:   0.04,
        scaleY:   0.16,
        rotation: 480,
        filter:   'brightness(0) sepia(1)',
      });

      gsap.timeline()
        // Phase 1 — Burst from event horizon
        .to(content, {
          opacity:  0.38,
          scaleX:   0.16,
          scaleY:   0.50,
          rotation: 360,
          filter:   'brightness(0.45) sepia(0.88)',
          duration: 0.75,
          ease:     'power4.in',
        })
        // Phase 2 — Despaghettification + orbital release
        .to(content, {
          opacity:  0.80,
          scaleX:   0.60,
          scaleY:   0.88,
          rotation: 140,
          filter:   'brightness(0.80) sepia(0.45)',
          duration: 1.1,
          ease:     'power2.out',
        })
        // Phase 3 — Gravity releases its hold
        .to(content, {
          opacity:  1,
          scaleX:   1,
          scaleY:   1,
          rotation: 0,
          filter:   'brightness(1) sepia(0)',
          duration: 1.0,
          ease:     'power3.out',
        });
    }

    // ── Main firing sequence ──────────────────────────────────
    // ── iOS Share Sheet — triggers native "Save to Files" ────────
    function iosShareFile(url, filename) {
      fetch(url)
        .then(function(r) { return r.blob(); })
        .then(function(blob) {
          var file = new File([blob], filename, { type: blob.type || 'audio/wav' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], title: filename });
          } else {
            // Fallback: open file in new tab so user can long-press to save
            window.open(url, '_blank');
          }
        })
        .catch(function() {
          window.open(url, '_blank');
        });
    }

    function fireEasterEgg() {
      active = true;
      buildOverlay();

      var overlay  = document.getElementById('easter-egg-overlay');
      var content  = overlay.querySelector('.ee-content');
      var noiseEl  = document.getElementById('ee-noise');

      // Reset content state — simple hidden start on iOS, full extreme on desktop
      content.classList.remove('revealed');
      if (typeof gsap !== 'undefined') {
        if (isIOS) {
          gsap.set(content, { opacity: 0, scale: 1, rotation: 0, filter: 'none' });
        } else {
          gsap.set(content, { opacity: 0, scaleX: 0.04, scaleY: 0.16,
            rotation: 480, filter: 'brightness(0) sepia(1)' });
        }
      } else {
        content.style.opacity = '0';
      }
      if (isIOS) {
        // ── iOS lightweight path — no WebGL, no canvas noise ────
        overlay.classList.add('ee-active', 'ee-ios');
        playEEAudio();
        setTimeout(function() { spitOutText(content); }, 600);
        // Transition to party screen after reading time — no auto-dismiss after
        autoDismissTimer = setTimeout(function() { showPartyScreen(content); }, 7000);
        return;
      }

      noiseEl.style.opacity = '1';

      // ── 0ms: hero pauses, overlay appears, BH starts, sound fires
      _hero.pause && _hero.pause();
      overlay.classList.add('ee-active');
      // Wait one rAF so the browser paints display:flex and the canvas
      // gets real clientWidth/Height before the WebGL renderer reads them.
      requestAnimationFrame(function() {
        startEERenderer();
        startNoise();
      });
      playEEAudio();

      // ── 600ms: green static starts fading ────────────────────
      setTimeout(function() { noiseEl.style.opacity = '0'; }, 600);

      // ── 950ms: stop the noise draw loop ──────────────────────
      setTimeout(stopNoise, 950);

      // ── 2500ms: silent download ───────────────────────────────
      setTimeout(function() {
        var a = document.createElement('a');
        a.href = FILE_URL; a.download = DL_NAME;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, 2500);

      // ── 1600ms: BH already slowing, text spit out begins
      setTimeout(function() { spitOutText(content); }, 1600);

      // ── 9000ms: transition to party screen (no auto-dismiss after that)
      autoDismissTimer = setTimeout(function() { showPartyScreen(content); }, 9000);
    }

    // ── Party screen — replaces unlock screen, no auto-dismiss ──
    function showPartyScreen(content) {
      if (!content) return;
      // Fade out Screen 1
      gsap.to(content, { opacity: 0, duration: 0.7, ease: 'power2.in',
        onComplete: function() {
          // Swap content to party screen
          content.innerHTML =
            '<p class="ee-party-eyebrow">You are invited.</p>' +
            '<p class="ee-party-title">Label Launch<br>Party</p>' +
            '<p class="ee-party-sub">BURKO presents: EOTI 001</p>' +
            '<p class="ee-party-date">June 13 &nbsp;·&nbsp; San Diego<br><span class="ee-party-tba">Location TBA</span></p>' +
            '<a class="ee-tickets-btn" href="https://shotgun.live/en/events/burko-presents-eoti1"' +
            ' target="_blank" rel="noopener noreferrer">Get Tickets</a>' +
            '<button class="ee-back">[ back to site ]</button>';

          // Wire up back button
          content.querySelector('.ee-back').addEventListener('click', dismissOverlay);

          // Override child opacity:0 from CSS
          var kids = content.querySelectorAll(
            '.ee-party-eyebrow,.ee-party-title,.ee-party-sub,.ee-party-date,.ee-tickets-btn,.ee-back'
          );
          gsap.set(kids, { opacity: 1 });

          // Fade Screen 2 in
          gsap.set(content, { opacity: 0 });
          gsap.to(content, { opacity: 1, duration: 0.9, ease: 'power2.out' });
        }
      });
    }

    // ── Dismiss ───────────────────────────────────────────────
    function dismissOverlay() {
      var overlay = document.getElementById('easter-egg-overlay');
      if (!overlay || !active) return;

      clearTimeout(autoDismissTimer);
      stopNoise();

      var content  = overlay.querySelector('.ee-content');

      if (typeof gsap !== 'undefined' && content) {
        var cleanUp = function() {
          content.classList.remove('revealed');
          overlay.classList.remove('ee-active', 'ee-ios');
          stopEERenderer();
          _hero.resume && _hero.resume();
          active = false;
        };
        if (isIOS) {
          // Simple fade out on iOS — no heavy filter/rotation animation
          gsap.to(content, { opacity: 0, duration: 0.4, ease: 'power2.in',
            onComplete: cleanUp });
        } else {
          // Suck text back into the black hole (desktop)
          gsap.to(content, {
            opacity: 0, scaleX: 0.04, scaleY: 0.16,
            rotation: 495, filter: 'brightness(0) sepia(1)',
            duration: 0.55, ease: 'power3.in',
            onComplete: cleanUp,
          });
        }
      } else {
        overlay.classList.remove('ee-active', 'ee-ios');
        stopEERenderer();
        _hero.resume && _hero.resume();
        active = false;
      }
    }
  }

  /* ===========================================================
     GLOBAL — page-load entrance animation for body
  =========================================================== */
  (function pageEntrance() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.7s ease';

    function reveal() {
      setTimeout(() => { document.body.style.opacity = '1'; }, 80);
    }

    if (document.readyState === 'complete') {
      reveal();
    } else {
      window.addEventListener('load', reveal, { once: true });
    }
  })();

})();
