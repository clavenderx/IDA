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
  return {
    el,
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

function spawnPixelReveal(item, delay = 0) {
  const frame = item.el.querySelector('.frame');
  if (!frame) return;

  const cols = Math.ceil(frame.offsetWidth / TILE);
  const rows = Math.ceil(frame.offsetHeight / TILE);

  const cover = document.createElement('div');
  cover.className = 'pixel-cover';

  const tiles = [];
  for (let t = 0; t < cols * rows; t++) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.style.width  = (100 / cols) + '%';
    tile.style.height = (100 / rows) + '%';
    cover.appendChild(tile);
    tiles.push(tile);
  }
  frame.appendChild(cover);

  gsap.set(tiles, { opacity: 1 });

  gsap.to(tiles, {
    opacity: 0,
    delay,
    duration: 0.0005,
    stagger: { each: 0.004, from: 'random' },
    onComplete: () => cover.remove(),
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

items.forEach(item => {
  item.el.addEventListener('mouseenter', () => {
    if (isScrolling || item.dimTarget === 0) return;
    hoveredItem = item;
    item.el.classList.add('hovered');
    item.el.style.zIndex = '1000';
    scene.classList.add('has-hover');
  });
  item.el.addEventListener('mouseleave', () => {
    hoveredItem = null;
    item.el.classList.remove('hovered');
    item.el.style.zIndex = '';
    scene.classList.remove('has-hover');
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

      if      (item.z >= Z_NEAR) item.z = Z_FAR;
      else if (item.z <  Z_FAR)  item.z = Z_NEAR;

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
      if (!isVisible && item.wasVisible) randomizeSpawn(item);
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

function randomPreviewStyle() {
  const startX = document.getElementById('filterOverlay').getBoundingClientRect().right + GAP;
  const availW = window.innerWidth - startX - GAP;
  const w      = Math.round(availW * (0.28 + Math.random() * 0.52));
  const h      = Math.min(Math.round(w * (0.75 + Math.random() * 0.85)), window.innerHeight - GAP * 2);
  const x      = startX + Math.random() * Math.max(0, window.innerWidth  - startX - w - GAP);
  const y      = GAP    + Math.random() * Math.max(0, window.innerHeight - h - GAP * 2);
  const rot    = (Math.random() - 0.5) * 12;
  return { w, h, transform: `translate(${Math.round(x)}px,${Math.round(y)}px) rotate(${rot.toFixed(1)}deg)` };
}

function showPreview(src) {
  if (previewPool.length >= MAX_PREVIEWS) {
    const oldest = previewPool.shift();
    oldest.classList.remove('visible');
    setTimeout(() => oldest.remove(), 250);
  }
  const { w, h, transform } = randomPreviewStyle();
  const el = document.createElement('div');
  el.className        = 'img-preview';
  el.style.width      = w + 'px';
  el.style.height     = h + 'px';
  el.style.transform  = transform;
  el.style.zIndex     = 500 + previewPool.length;
  el.innerHTML        = `<img src="${src}" alt="">`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('visible'));
  previewPool.push(el);
}

function hidePreviews() {
  previewPool.forEach(el => {
    el.classList.remove('visible');
    setTimeout(() => el.remove(), 250);
  });
  previewPool = [];
}

/* ─── Filter Data ────────────────────────────────────────────────────────────── */
const I = 'src/img/gallery/';
const FILTER_DATA = {
  creator: [
    { name: 'Albína Thordarson',            img: I + 'Albína_Thordarson_Architect.png' },
    { name: 'Dýpi',                          img: null },
    { name: 'Fischersund',                   img: I + 'Oase_vases.png' },
    { name: 'Johanna Seelemann',             img: I + 'Faux_Fauna.png' },
    { name: 'Lauf Cycles',                   img: I + 'Lauf_Elja_Bike.png' },
    { name: 'Nature Conservation Agency',    img: I + 'Seaweed.png' },
    { name: 'Ranra',                         img: I + 'Ranra_2025_Fall.png' },
    { name: 'S.AP Architects',               img: I + 'H59_Social_Housing.png' },
    { name: 'Sp(r)int Studio',               img: null },
    { name: 'Tetra',                         img: null },
    { name: 'Helga Lilja',                   img: null },
    { name: 'Studio Granda',                 img: I + 'Stöng_Ruins.png' },
    { name: 'Þykjó',                         img: null },
    { name: 'Krónan',                        img: null },
    { name: 'Gísli B. Björnsson',            img: null },
    { name: 'Rán Flygenring',                img: null },
    { name: 'Eldjárn & Jón Helgi Hólmsson', img: I + 'Elliðaárstöð_Power_Station.png' },
    { name: 'Landslag and Harry Jóhannsson', img: null },
    { name: 'The Blue Lagoon',               img: null },
    { name: 'Studio Frindrekar',             img: null },
  ],
  category: [
    { name: 'Best Investment in Design', img: null },
    { name: 'Honorary Award',            img: null },
    { name: 'Place',                     img: I + 'Gígur_Visitor_Centre.png' },
    { name: 'Product',                   img: I + 'Lauf_Elja_Bike.png' },
    { name: 'Project',                   img: I + 'Dragons_Nest.png' },
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
  filterRight.innerHTML = FILTER_DATA[filter].map(({ name, img }) => {
    const { half, dur } = makeTickerContent(name);
    return `<button class="filter-sub-option" style="--tick-dur:${dur}s" data-img="${img || ''}" data-value="${name.toLowerCase()}">
      <span class="sub-label">${name.toUpperCase()}</span>
      <div class="sub-scroll"><span>${half}</span><span>${half}</span></div>
    </button>`;
  }).join('');
  filterRight.classList.add('visible');
  filterRight.querySelectorAll('.filter-sub-option').forEach(btn => {
    btn.addEventListener('click', () => {
      filterInteracted = true;
      const isActive = btn.classList.contains('active');
      filterRight.querySelectorAll('.filter-sub-option').forEach(b => b.classList.remove('active'));
      if (!isActive) btn.classList.add('active');
    });
    btn.addEventListener('mouseenter', () => {
      if (btn.dataset.img) showPreview(btn.dataset.img);
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

  filterOverlay.classList.remove('open');
  filterBackdrop.classList.remove('open');
  filterClose.classList.remove('open');
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
