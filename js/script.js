const Z_FAR   = -800;   // far away  — items start here (small, near center)
const Z_NEAR  =  650;   // close     — items end here   (large, off-screen)
const Z_RANGE = Z_NEAR - Z_FAR; // 1450 px total travel

// Base speed (px/s) and initial Z for each item.
// Speed matches the original CSS durations; initial Z matches the original
// negative delays so the field is staggered on load.
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
  { dur: 22, delay: 17 },
];

const items = Array.from(document.querySelectorAll('.item')).map((el, i) => {
  const { dur, delay } = CONFIG[i];
  return {
    el,
    z:     Z_FAR + (delay / dur) * Z_RANGE, // initial position mid-journey
    speed: Z_RANGE / dur,                    // px per second at base
  };
});

const scene = document.querySelector('.scene');
let hoveredItem = null;

items.forEach(item => {
  item.el.addEventListener('mouseenter', () => {
    hoveredItem = item;
    item.el.classList.add('hovered');
    scene.classList.add('has-hover');
  });
  item.el.addEventListener('mouseleave', () => {
    hoveredItem = null;
    item.el.classList.remove('hovered');
    scene.classList.remove('has-hover');
  });
});

// scrollVel: boost multiplier on base speed.
//   0   = base speed    (no scroll)
//   9   = 10× faster    (fast scroll down)
//  -0.9 = ~10% speed    (scroll up nearly stops it)
let scrollVel = 0;

window.addEventListener('wheel', e => {
  scrollVel += e.deltaY * 0.012;
  scrollVel = Math.max(-0.9, Math.min(9, scrollVel));
}, { passive: true });

window.addEventListener('touchmove', e => {
  if (e.touches.length === 1) {
    scrollVel += 0.5;
    scrollVel = Math.min(9, scrollVel);
  }
}, { passive: true });

let lastTime = null;

function tick(now) {
  if (lastTime === null) lastTime = now;
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (!hoveredItem) {
    items.forEach(item => {
      const effectiveSpeed = item.speed * (1 + scrollVel);
      item.z += effectiveSpeed * dt;

      if (item.z >= Z_NEAR) item.z = Z_FAR;

      const p = (item.z - Z_FAR) / Z_RANGE;
      let opacity;
      if      (p < 0.07) opacity = p / 0.07;
      else if (p > 0.82) opacity = 1 - (p - 0.82) / 0.18;
      else               opacity = 1;

      item.el.style.transform = `translateZ(${item.z}px)`;
      item.el.style.opacity   = Math.max(0, Math.min(1, opacity));
    });
  }

  scrollVel *= 0.92;
  if (Math.abs(scrollVel) < 0.005) scrollVel = 0;

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
