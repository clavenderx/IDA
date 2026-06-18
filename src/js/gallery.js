/* ─── Floating Gallery Images ───────────────────────────────────────────────── */
const FG = 'src/img/Floating _Gallery/';
const FG_IMAGES = {
  'albína thordarson':            ['albina_thordarson_1.png','albina_thordarson_2.png','albina_thordarson_3.png','albina_thordarson_4.png','albina_thordarson_5.png','albina_thordarson_6.png'],
  's.ap architects':              ['sap_architects_1.png','sap_architects_2.png','sap_architects_3.png','sap_architects_4.png'],
  'studio granda':                ['studio_granda_1.png','studio_granda_2.png','studio_granda_3.png'],
  'fischersund':                  ['fischersund_1.png','fischersund_2.png','fischersund_3.png','fischersund_4.png','fischersund_5.png','fischersund_6.png','fischersund_7.png'],
  'dýpi':                         ['DYPI_1.png','DYPI_2.png','DYPI_3.png','DYPI_4.png','DYPI_5.png'],
  'johanna seelemann':            ['johanna_seelemann_1.png','johanna_seelemann_2.png','johanna_seelemann_3.png'],
  'lauf cycles':                  ['lauf_cycling_1.png','lauf_cycling_2.png','lauf_cycling_3.png','lauf_cycling_4.png','lauf_cycling_5.png','lauf_cycling_6.png','lauf_cycling_7.png'],
  'eldjárn & jón helgi hólmsson': ['eldjan_jon_helgi_1.png','eldjan_jon_helgi_2.png','eldjan_jon_helgi_3.png'],
  'nature conservation agency':   ['nature_conservation_agency_1.png','nature_conservation_agency_2.png','nature_conservation_agency_3.png'],
  'ranra':                        ['ranra_1.png','ranra_2.png','ranra_3.png','ranra_4.png','ranra_5.png','ranra_6.png','ranra_7.png','ranra_8.png','ranra_9.png','ranra_10.png'],
  'gísli b. björnsson':           ['gisli_bjornsson_1.png','gisli_bjornsson_2.png','gisli_bjornsson_3.png','gisli_bjornsson_4.png','gisli_bjornsson_5.png','gisli_bjornsson_6.png'],
  'helga lilja':                  ['helga_lilja_1.png','helga_lilja_2.png','helga_lilja_3.png'],
  'krónan':                       ['kronan_1.png','kronan_2.png','kronan_3.png'],
  'landslag and harry jóhannsson': ['landslag_harry_1.png','landslag_harry_2.png','landslag_harry_3.png'],
  'þykjó':                        ['pykjo_1.png','pykjo_2.png','pykjo_3.png','pykjo_4.png','pykjo_5.jpg','pykjo_6.jpg','pykjo_7.jpg'],
  'rán flygenring':               ['ran_flygenring_1.png','ran_flygenring_2.png','ran_flygenring_3.png','ran_flygenring_4.png','ran_flygenring_5.png','ran_flygenring_6.png'],
  'sp(r)int studio':              ['sprint_studio_1.png','sprint_studio_2.png','sprint_studio_3.png'],
  'studio frindrekar':            ['studio_frindrekar_1.png','studio_frindrekar_2.png','studio_frindrekar_3.png'],
  'tetra':                        ['tetra_1.png','tetra_2.png','tetra_3.png','tetra_4.png','tetra_5.png'],
  'the blue lagoon':              ['blue_lagoon_1.png','blue_lagoon_2.png','blue_lagoon_3.png','blue_lagoon_4.png'],
};

/* pool index is stored per-item and advanced each time the item wraps */

/* ─── Gallery ────────────────────────────────────────────────────────────────── */
const Z_FAR   = -800;
const Z_NEAR  =  650;
const Z_RANGE = Z_NEAR - Z_FAR;

const CONFIG = [
  { dur: 17, delay:  3 },
  { dur: 13, delay:  6 },
  { dur: 19, delay: 10 },
  { dur: 11, delay:  4 },
  { dur: 21, delay: 14 },
  { dur: 15, delay:  7 },
  { dur: 18, delay:  2 },
  { dur: 12, delay:  8 },
  { dur: 16, delay:  1 },
  { dur: 20, delay: 11 },
  { dur: 14, delay:  5 },
];

const items = Array.from(document.querySelectorAll('.item')).map((el, i) => {
  const { dur, delay } = CONFIG[i];
  const pool = FG_IMAGES[el.dataset.creator] || [];
  const imgEl = el.querySelector('.frame img');
  let fgIdx = 0;
  if (pool.length) imgEl.src = FG + pool[0];

  const tag = document.createElement('div');
  tag.className = 'category-tag';
  tag.textContent = `[ ${el.dataset.category || ''} ]`;
  el.insertBefore(tag, el.querySelector('.frame'));


  return {
    el, imgEl, pool, fgIdx, tag,
    z:         Z_FAR + (delay / dur) * Z_RANGE,
    speed:     Z_RANGE / dur,
    dim:       1,
    dimTarget: 1,
  };
});

/* ─── Pixel-square reveal (same effect as the landing page transition) ─────────
   Fires once on initial load, then re-fires every time an item fades back
   in after having faded out (the gallery loops items endlessly). ──────────── */
const TILE = 20;
// one reveal slot per side — keeps animations spread across the gallery
const revealSlots = { left: false, right: false };
// charcoal appears ~70% of the time; green, blue, orange share the rest
const PIXEL_COLORS = [
  'var(--color-charcoal)',
  'var(--color-charcoal)',
  'var(--color-charcoal)',
  'var(--color-charcoal)',
  'var(--color-charcoal)',
  'var(--color-charcoal)',
  'var(--color-charcoal)',
  'var(--color-light-green)',
  'var(--color-blue)',
  'var(--color-light-orange)',
];

function spawnPixelReveal(item, delay = 0) {
  const frame = item.el.querySelector('.frame');
  if (!frame) return;
  const leftPct = parseFloat(item.el.style.left) || 0;
  const side = leftPct < 50 ? 'left' : 'right';
  if (revealSlots[side]) return;
  revealSlots[side] = true;

  const cols = Math.ceil(frame.offsetWidth / TILE);
  const rows = Math.ceil(frame.offsetHeight / TILE);

  const cover = document.createElement('div');
  cover.className = 'pixel-cover';

  const tiles = [];
  for (let t = 0; t < cols * rows; t++) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.style.width      = (100 / cols) + '%';
    tile.style.height     = (100 / rows) + '%';
    tile.style.background = PIXEL_COLORS[Math.floor(Math.random() * PIXEL_COLORS.length)];
    cover.appendChild(tile);
    tiles.push(tile);
  }
  frame.appendChild(cover);

  gsap.set(tiles, { opacity: 1 });

  const tag = item.el.querySelector('.category-tag');
  if (tag) {
    gsap.set(tag, { opacity: 0, y: 5 });
    gsap.to(tag, { opacity: 1, y: 0, duration: 0.4, delay: delay + 0.3, ease: 'power2.out' });
  }

  gsap.to(tiles, {
    opacity: 0,
    delay,
    duration: 0.0005,
    stagger: { each: 0.004, from: 'random' },
    onComplete: () => { cover.remove(); revealSlots[side] = false; },
  });
}

items.forEach((item, i) => {
  item.wasVisible = true;
  spawnPixelReveal(item, 0.3 + i * 0.05);
});

/* ─── Randomize position & timing each time an item cycles out of view ─────────
   Reposition while fully transparent so the jump is invisible, and vary the
   cycle speed so items stop reappearing in the same fixed order. ───────────── */
function randomizeSpawn(item) {
  const w = item.el.offsetWidth;
  const h = item.el.offsetHeight;
  const maxLeft = Math.max(2, 100 - (w / scene.clientWidth)  * 100 - 2);
  const maxTop  = Math.max(2, 100 - (h / scene.clientHeight) * 100 - 2);

  item.el.style.left = (2 + Math.random() * maxLeft) + '%';
  item.el.style.top  = (2 + Math.random() * maxTop)  + '%';

  const dur = 10 + Math.random() * 14;
  item.speed = Z_RANGE / dur;
}

const scene = document.querySelector('.scene');
let hoveredItem = null;

/* ─── Scroll / Touch ─────────────────────────────────────────────────────────── */
// scrollVel: 1 = normal, >1 = faster forward, <0 = reverse
let scrollVel = 1;
let isScrolling = false;
let scrollStopTimer = null;

function markScrolling() {
  isScrolling = true;
  if (hoveredItem) {
    hoveredItem.el.classList.remove('hovered');
    hoveredItem.el.style.zIndex = '';
    hoveredItem = null;
    scene.classList.remove('has-hover');
  }
  clearTimeout(scrollStopTimer);
  scrollStopTimer = setTimeout(() => { isScrolling = false; }, 150);
}

/* ─── Cursor Trail ───────────────────────────────────────────────────────────── */
const galleryCursor = document.createElement('div');
galleryCursor.id = 'gallery-cursor';
galleryCursor.textContent = '[ View ]';
document.body.appendChild(galleryCursor);

let cursorX = 0, cursorY = 0;
let trailX = 0, trailY = 0;

document.addEventListener('mousemove', e => {
  cursorX = e.clientX;
  cursorY = e.clientY;
});

(function animateCursor() {
  trailX += (cursorX - trailX) * 0.18;
  trailY += (cursorY - trailY) * 0.18;
  galleryCursor.style.transform = `translate(calc(${trailX}px + 10px), calc(${trailY}px + 10px))`;
  requestAnimationFrame(animateCursor);
})();

items.forEach(item => {
  item.el.addEventListener('mouseenter', () => {
    if (isScrolling || item.dimTarget === 0) return;
    hoveredItem = item;
    item.el.classList.add('hovered');
    item.el.style.zIndex = '1000';
    scene.classList.add('has-hover');
    galleryCursor.classList.add('visible');
  });
  item.el.addEventListener('mouseleave', () => {
    hoveredItem = null;
    item.el.classList.remove('hovered');
    item.el.style.zIndex = '';
    scene.classList.remove('has-hover');
    galleryCursor.classList.remove('visible');
  });
});

window.addEventListener('wheel', e => {
  markScrolling();
  scrollVel += e.deltaY * 0.06;
  scrollVel = Math.max(-18, Math.min(18, scrollVel));
}, { passive: true });

let lastTouchY = null;

window.addEventListener('touchstart', e => {
  if (e.touches.length === 1) lastTouchY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchmove', e => {
  if (e.touches.length === 1 && lastTouchY !== null) {
    markScrolling();
    const dy = lastTouchY - e.touches[0].clientY;
    scrollVel += dy * 0.12;
    scrollVel = Math.max(-18, Math.min(18, scrollVel));
    lastTouchY = e.touches[0].clientY;
  }
}, { passive: true });

/* ─── Animation Loop ─────────────────────────────────────────────────────────── */
let lastTime = null;

function tick(now) {
  if (lastTime === null) lastTime = now;
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (!hoveredItem) {
    items.forEach(item => {
      const effectiveSpeed = item.speed * scrollVel * 1.6;
      item.z += effectiveSpeed * dt;

      if (item.z >= Z_NEAR) {
        item.z = Z_FAR;
        if (item.pool.length > 1) {
          item.fgIdx = (item.fgIdx + 1) % item.pool.length;
          item.imgEl.src = FG + item.pool[item.fgIdx];
        }
      } else if (item.z < Z_FAR) {
        item.z = Z_NEAR;
      }

      const p = (item.z - Z_FAR) / Z_RANGE;
      let opacity;
      if      (p < 0.07) opacity = p / 0.07;
      else if (p > 0.82) opacity = 1 - (p - 0.82) / 0.18;
      else               opacity = 1;

      item.dim += (item.dimTarget - item.dim) * 0.05;
      item.el.style.transform = `translateZ(${item.z}px)`;
      const finalOpacity = Math.max(0, Math.min(1, opacity)) * item.dim;
      item.el.style.opacity = finalOpacity;

      const isVisible = finalOpacity > 0.05;
      if (isVisible && !item.wasVisible) spawnPixelReveal(item);
      if (!isVisible && item.wasVisible) {
        randomizeSpawn(item);
        gsap.set(item.tag, { opacity: 0, y: 5 });
      }
      item.wasVisible = isVisible;
    });
  }

  scrollVel += (1 - scrollVel) * 0.08;
  if (Math.abs(scrollVel - 1) < 0.005) scrollVel = 1;

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

/* ─── Image Previews ─────────────────────────────────────────────────────────── */
const MAX_PREVIEWS = 4;
const GAP = 16;
let previewPool = [];

function randomPreviewStyle(naturalW, naturalH) {
  const startX  = document.getElementById('filterOverlay').getBoundingClientRect().right + GAP;
  const availW  = window.innerWidth - startX - GAP;
  const ratio   = naturalH / naturalW;
  const w       = Math.round(availW * (0.28 + Math.random() * 0.38));
  const h       = Math.min(Math.round(w * ratio), window.innerHeight - GAP * 2);
  const finalW  = Math.round(h / ratio);
  const x       = startX + Math.random() * Math.max(0, window.innerWidth  - startX - finalW - GAP);
  const y       = GAP    + Math.random() * Math.max(0, window.innerHeight - h - GAP * 2);
  const rot     = (Math.random() - 0.5) * 12;
  return { w: finalW, h, transform: `translate(${Math.round(x)}px,${Math.round(y)}px) rotate(${rot.toFixed(1)}deg)` };
}

function showPreview(src) {
  if (previewPool.length >= MAX_PREVIEWS) {
    const oldest = previewPool.shift();
    oldest.classList.remove('visible');
    setTimeout(() => oldest.remove(), 250);
  }
  const probe = new Image();
  probe.onload = () => {
    const { w, h, transform } = randomPreviewStyle(probe.naturalWidth, probe.naturalHeight);
    const el = document.createElement('div');
    el.className       = 'img-preview';
    el.style.width     = w + 'px';
    el.style.height    = h + 'px';
    el.style.transform = transform;
    el.style.zIndex    = 3500 + previewPool.length;
    el.innerHTML       = `<img src="${src}" alt="">`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    previewPool.push(el);
  };
  probe.src = src;
}

function hidePreviews() {
  previewPool.forEach(el => {
    el.classList.remove('visible');
    setTimeout(() => el.remove(), 250);
  });
  previewPool = [];
}

/* ─── Filter Data ────────────────────────────────────────────────────────────── */
const I = 'src/img/Floating _Gallery/';
const FILTER_DATA = {
  creator: [
    { name: 'Albína Thordarson',            imgs: [I+'albina_thordarson_1.png',I+'albina_thordarson_2.png',I+'albina_thordarson_3.png',I+'albina_thordarson_4.png',I+'albina_thordarson_5.png',I+'albina_thordarson_6.png'] },
    { name: 'Dýpi',                          imgs: [I+'DYPI_1.png',I+'DYPI_2.png',I+'DYPI_3.png',I+'DYPI_4.png',I+'DYPI_5.png'] },
    { name: 'Fischersund',                   imgs: [I+'fischersund_1.png',I+'fischersund_2.png',I+'fischersund_3.png',I+'fischersund_4.png',I+'fischersund_5.png',I+'fischersund_6.png',I+'fischersund_7.png'] },
    { name: 'Johanna Seelemann',             imgs: [I+'johanna_seelemann_1.png',I+'johanna_seelemann_2.png',I+'johanna_seelemann_3.png'] },
    { name: 'Lauf Cycles',                   imgs: [I+'lauf_cycling_1.png',I+'lauf_cycling_2.png',I+'lauf_cycling_3.png',I+'lauf_cycling_4.png',I+'lauf_cycling_5.png',I+'lauf_cycling_6.png',I+'lauf_cycling_7.png'] },
    { name: 'Nature Conservation Agency',    imgs: [I+'nature_conservation_agency_1.png',I+'nature_conservation_agency_2.png',I+'nature_conservation_agency_3.png'] },
    { name: 'Ranra',                         imgs: [I+'ranra_1.png',I+'ranra_2.png',I+'ranra_3.png',I+'ranra_4.png',I+'ranra_5.png',I+'ranra_6.png',I+'ranra_7.png',I+'ranra_8.png',I+'ranra_9.png',I+'ranra_10.png'] },
    { name: 'S.AP Architects',               imgs: [I+'sap_architects_1.png',I+'sap_architects_2.png',I+'sap_architects_3.png',I+'sap_architects_4.png'] },
    { name: 'Sp(r)int Studio',               imgs: [I+'sprint_studio_1.png',I+'sprint_studio_2.png',I+'sprint_studio_3.png'] },
    { name: 'Tetra',                         imgs: [I+'tetra_1.png',I+'tetra_2.png',I+'tetra_3.png',I+'tetra_4.png',I+'tetra_5.png'] },
    { name: 'Helga Lilja',                   imgs: [I+'helga_lilja_1.png',I+'helga_lilja_2.png',I+'helga_lilja_3.png'] },
    { name: 'Studio Granda',                 imgs: [I+'studio_granda_1.png',I+'studio_granda_2.png',I+'studio_granda_3.png'] },
    { name: 'Þykjó',                         imgs: [I+'pykjo_1.png',I+'pykjo_2.png',I+'pykjo_3.png',I+'pykjo_4.png',I+'pykjo_5.jpg',I+'pykjo_6.jpg',I+'pykjo_7.jpg'] },
    { name: 'Krónan',                        imgs: [I+'kronan_1.png',I+'kronan_2.png',I+'kronan_3.png'] },
    { name: 'Gísli B. Björnsson',            imgs: [I+'gisli_bjornsson_1.png',I+'gisli_bjornsson_2.png',I+'gisli_bjornsson_3.png',I+'gisli_bjornsson_4.png',I+'gisli_bjornsson_5.png',I+'gisli_bjornsson_6.png'] },
    { name: 'Rán Flygenring',                imgs: [I+'ran_flygenring_1.png',I+'ran_flygenring_2.png',I+'ran_flygenring_3.png',I+'ran_flygenring_4.png',I+'ran_flygenring_5.png',I+'ran_flygenring_6.png'] },
    { name: 'Eldjárn & Jón Helgi Hólmsson', imgs: [I+'eldjan_jon_helgi_1.png',I+'eldjan_jon_helgi_2.png',I+'eldjan_jon_helgi_3.png'] },
    { name: 'Landslag and Harry Jóhannsson', imgs: [I+'landslag_harry_1.png',I+'landslag_harry_2.png',I+'landslag_harry_3.png'] },
    { name: 'The Blue Lagoon',               imgs: [I+'blue_lagoon_1.png',I+'blue_lagoon_2.png',I+'blue_lagoon_3.png',I+'blue_lagoon_4.png'] },
    { name: 'Studio Frindrekar',             imgs: [I+'studio_frindrekar_1.png',I+'studio_frindrekar_2.png',I+'studio_frindrekar_3.png'] },
  ],
  category: [
    { name: 'Best Investment in Design', imgs: [I+'kronan_1.png',I+'kronan_2.png',I+'kronan_3.png',I+'nature_conservation_agency_1.png',I+'nature_conservation_agency_2.png',I+'nature_conservation_agency_3.png'] },
    { name: 'Honorary Award',            imgs: [I+'gisli_bjornsson_1.png'] },
    { name: 'Place',                     imgs: [I+'studio_granda_1.png', I+'studio_granda_2.png', I+'sap_architects_1.png'] },
    { name: 'Product',                   imgs: [I+'lauf_cycling_1.png', I+'lauf_cycling_2.png', I+'DYPI_1.png'] },
    { name: 'Project',                   imgs: [I+'ranra_1.png', I+'ranra_2.png', I+'fischersund_1.png', I+'johanna_seelemann_1.png'] },
  ],
};

/* ─── Filter Overlay ─────────────────────────────────────────────────────────── */
const filterToggle        = document.getElementById('filterToggle');
const filterOverlay       = document.getElementById('filterOverlay');
const filterBackdrop      = document.getElementById('filterBackdrop');
const filterClose         = document.getElementById('filterClose');
const filterRight         = document.getElementById('filterRight');
const filterOptions       = document.querySelectorAll('.filter-option');
const activeFilterDisplay = document.getElementById('activeFilterDisplay');
const afdType             = document.getElementById('afdType');
const afdValue            = document.getElementById('afdValue');

let activeFilter    = null;
let filterInteracted = false;

function makeTickerContent(text) {
  const upper      = text.toUpperCase();
  const approxCharW = 13;
  const textW      = upper.length * approxCharW;
  const sepW       = approxCharW * 3;
  const reps       = Math.max(3, Math.ceil(500 / (textW + sepW)) + 1);
  const half       = Array(reps).fill(upper).join(' / ') + ' / ';
  const dur        = (half.length * approxCharW / 120).toFixed(1);
  return { half, dur };
}

function showSubOptions(filter) {
  filterRight.innerHTML = FILTER_DATA[filter].map(({ name, imgs }) => {
    const { half, dur } = makeTickerContent(name);
    return `<button class="filter-sub-option" style="--tick-dur:${dur}s" data-value="${name.toLowerCase()}">
      <span class="sub-label">${name.toUpperCase()}</span>
      <div class="sub-scroll"><span>${half}</span><span>${half}</span></div>
    </button>`;
  }).join('');
  filterRight.classList.add('visible');

  const dataMap = (() => {
    if (filter === 'creator') {
      return Object.fromEntries(
        FILTER_DATA.creator.map(({ name }) => {
          const key = name.toLowerCase();
          const imgs = (FG_IMAGES[key] || []).map(f => FG + f);
          return [key, imgs];
        })
      );
    }
    // category: seed from manually specified imgs, then add matching gallery items
    const map = {};
    FILTER_DATA.category.forEach(({ name, imgs }) => {
      map[name.toLowerCase()] = [...imgs];
    });
    items.forEach(item => {
      const cat = (item.el.dataset.category || '').toLowerCase();
      if (map[cat]) map[cat].push(...item.pool.map(f => FG + f));
    });
    return map;
  })();

  let previewDripTimer = null;

  function startDrip(imgs) {
    if (!imgs.length) return;
    const shuffled = [...imgs].sort(() => Math.random() - 0.5);
    let idx = 0;
    function drip() {
      if (idx >= shuffled.length) return;
      showPreview(shuffled[idx++]);
      if (idx < shuffled.length) previewDripTimer = setTimeout(drip, 900);
    }
    drip();
  }

  function stopDrip() {
    clearTimeout(previewDripTimer);
    previewDripTimer = null;
  }

  filterRight.querySelectorAll('.filter-sub-option').forEach(btn => {
    btn.addEventListener('click', () => {
      stopDrip();
      hidePreviews();
      filterInteracted = true;
      const isActive = btn.classList.contains('active');
      filterRight.querySelectorAll('.filter-sub-option').forEach(b => b.classList.remove('active'));
      if (!isActive) btn.classList.add('active');
      closeFilter();
    });
    btn.addEventListener('mouseenter', () => {
      stopDrip();
      hidePreviews();
      const imgs = dataMap[btn.dataset.value] || [];
      startDrip(imgs);
    });
    btn.addEventListener('mouseleave', () => {
      stopDrip();
      hidePreviews();
    });
  });
}

function hideSubOptions() {
  filterRight.innerHTML = '';
  filterRight.classList.remove('visible');
  hidePreviews();
}

function applyGalleryFilter() {
  items.forEach(item => {
    if (!activeFilter) {
      item.dimTarget = 1;
      return;
    }
    const attr = (item.el.dataset[activeFilter.type] || '').toLowerCase();
    item.dimTarget = attr === activeFilter.value ? 1 : 0;
  });

  if (activeFilter) {
    afdType.textContent  = `[ ${activeFilter.type} ]`;
    afdValue.textContent = '';
    const txt = document.createElement('span');
    txt.textContent = activeFilter.value.toUpperCase();
    const x = document.createElement('span');
    x.className = 'afd-x';
    x.innerHTML = '<svg viewBox="0 0 14 14" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/></svg>';
    afdValue.appendChild(txt);
    afdValue.appendChild(x);
  }

  activeFilterDisplay.classList.toggle('visible', activeFilter !== null);
}

function openFilter() {
  filterInteracted = false;
  filterOverlay.classList.add('open');
  filterBackdrop.classList.add('open');
  filterClose.classList.add('open');
  filterToggle.classList.add('open');
  PixelTransition.fillIn({
    container: filterBackdrop,
    duration: 0.5,
    colors: [
      'var(--color-charcoal)',
      'var(--color-charcoal)',
      'var(--color-charcoal)',
      'var(--color-charcoal)',
      'var(--color-charcoal)',
      'var(--color-charcoal)',
      'var(--color-charcoal)',
      'var(--color-charcoal)',
      'var(--color-light-green)',
      'var(--color-blue)',
    ],
    tileOpacityFn: (color) => color === 'var(--color-charcoal)' ? 0.97 : 0.85,
  });
}

function closeFilter() {
  if (filterInteracted) {
    const activeSubBtn  = filterRight.querySelector('.filter-sub-option.active');
    const activeLeftBtn = document.querySelector('.filter-option.active');
    if (activeSubBtn && activeLeftBtn) {
      activeFilter = { type: activeLeftBtn.dataset.filter, value: activeSubBtn.dataset.value };
    } else {
      activeFilter = null;
    }
  }

  PixelTransition.fillOut({
    container: filterBackdrop,
    duration: 0.4,
    rebuild: false,
    onComplete: () => filterBackdrop.classList.remove('open'),
  });

  filterOverlay.classList.remove('open');
  filterClose.classList.remove('open');
  filterToggle.classList.remove('open');
  filterOptions.forEach(b => b.classList.remove('active'));
  hideSubOptions();
  hidePreviews();

  applyGalleryFilter();
}

filterToggle.addEventListener('click', () => {
  filterOverlay.classList.contains('open') ? closeFilter() : openFilter();
});

filterBackdrop.addEventListener('click', closeFilter);
filterClose.addEventListener('click', closeFilter);

afdValue.addEventListener('click', () => {
  activeFilter = null;
  applyGalleryFilter();
});

filterOptions.forEach(btn => {
  btn.addEventListener('click', () => {
    const isActive = btn.classList.contains('active');
    filterOptions.forEach(b => b.classList.remove('active'));
    hideSubOptions();
    if (!isActive) {
      btn.classList.add('active');
      showSubOptions(btn.dataset.filter);
    }
  });
});

items.forEach(item => {
  if (item.el.dataset.creator === 'lauf cycles') {
    item.el.addEventListener('click', () => {
      if (isScrolling || item.dimTarget === 0) return;
      window.location.href = 'projectLaufElja.html';
    });
  }
});

/* ─── Pre-apply filter from URL param ───────────────────────────────────── */
(function applyURLFilter() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category');
  if (!category) return;

  const match = FILTER_DATA.category.find(
    d => d.name.toLowerCase() === category.toLowerCase()
  );
  if (!match) return;

  activeFilter = { type: 'category', value: match.name.toLowerCase() };
  applyGalleryFilter();
})();
