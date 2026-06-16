/* ─── Landing Page Connector Lines ───────────────────────────────────────────── */
(function () {
  const svg = document.getElementById('landing-lines');
  if (!svg) return;

  const links = [
    ['tag-craft', 'ltr-craft', 'bottom', { shorten: 20, rotate: -20 }],
    ['tag-modern', 'ltr-modern', 'bottom', { shiftX: 8, shorten: 40 }],
    ['tag-design', 'ltr-design', 'bottom', { shorten: 35, rotate: 5 }],
    ['tag-future', 'ltr-future', 'bottom', { shorten: 50 }],
    ['tag-digital', 'ltr-digital', 'top', { shorten: 50, rotate: 7 }],
    ['tag-innovation', 'ltr-innovation', 'top', { shorten: 55, shiftX: 7, rotate: -10 }],
    ['tag-technology', 'ltr-technology', 'top', { shorten: 40, rotate: -10 }],
  ];

  function drawLines() {
    const overlayRect = document.getElementById('landing-overlay').getBoundingClientRect();
    svg.innerHTML = '';

    links.forEach(([tagId, letterId, tagSide, opts]) => {
      const tag = document.getElementById(tagId);
      const letter = document.getElementById(letterId);
      if (!tag || !letter) return;

      const { shorten = 0, shiftX = 0, rotate = 0 } = opts || {};

      const tagRect = tag.getBoundingClientRect();
      const letterRect = letter.getBoundingClientRect();

      let x1 = tagRect.left + tagRect.width / 2 - overlayRect.left;
      let y1 = (tagSide === 'bottom' ? tagRect.bottom : tagRect.top) - overlayRect.top;
      let x2 = letterRect.left + letterRect.width / 2 - overlayRect.left;
      let y2 = letterRect.top + letterRect.height / 2 - overlayRect.top;

      if (shorten) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        if (len > 0) {
          x2 -= (dx / len) * shorten;
          y2 -= (dy / len) * shorten;
        }
      }

      if (rotate) {
        const a = (rotate * Math.PI) / 180;
        const dx = x2 - x1;
        const dy = y2 - y1;
        x2 = x1 + dx * Math.cos(a) - dy * Math.sin(a);
        y2 = y1 + dx * Math.sin(a) + dy * Math.cos(a);
      }

      x1 += shiftX;
      x2 += shiftX;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      svg.appendChild(line);
    });
  }

  window.addEventListener('load', drawLines);
  window.addEventListener('resize', drawLines);

  /* ─── Mouse parallax on the surrounding tags ───────────────────────────── */
  const lerp = (a, b, t) => a + (b - a) * t;
  const map = (x, a, b, c, d) => c + ((x - a) * (d - c)) / (b - a);
  const rand = (a, b) => a + Math.random() * (b - a);

  let winW = window.innerWidth;
  let winH = window.innerHeight;
  let mouse = { x: winW / 2, y: winH / 2 };

  const tagItems = links.map(([tagId]) => {
    const el = document.getElementById(tagId);
    return el && {
      el,
      tx: 0,
      ty: 0,
      xRange: rand(8, 16),
      yRange: rand(8, 16),
    };
  }).filter(Boolean);

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('resize', () => {
    winW = window.innerWidth;
    winH = window.innerHeight;
  });

  function tick() {
    tagItems.forEach((item) => {
      item.tx = lerp(item.tx, map(mouse.x, 0, winW, -item.xRange, item.xRange), 0.06);
      item.ty = lerp(item.ty, map(mouse.y, 0, winH, -item.yRange, item.yRange), 0.06);
      item.el.style.transform = `translate(${item.tx}px, ${item.ty}px)`;
    });
    drawLines();
    requestAnimationFrame(tick);
  }
  tick();
})();

/* ─── Landing Page ───────────────────────────────────────────────────────────── */
(function () {
  const overlay   = document.getElementById('landing-overlay');
  const container = document.getElementById('square_container');
  const SQ = 100;
  let squares = [];
  let transitioning = false;

  function buildSquares() {
    container.innerHTML = '';
    squares = [];
    const cols = Math.ceil(window.innerWidth  / SQ);
    const rows = Math.ceil(window.innerHeight / SQ);
    container.style.width  = cols * SQ + 'px';
    container.style.height = rows * SQ + 'px';
    for (let i = 0; i < cols * rows; i++) {
      const sq = document.createElement('div');
      sq.className = 'square';
      container.appendChild(sq);
      squares.push(sq);
    }
  }

  overlay.addEventListener('click', () => {
    if (transitioning) return;
    transitioning = true;
    buildSquares();

    gsap.fromTo(squares, { opacity: 0 }, {
      opacity: 1,
      delay: 0.5,
      duration: 0.0005,
      stagger: { each: 0.004, from: 'random' },
    });

    gsap.to(squares, {
      opacity: 0,
      delay: 1.5,
      duration: 0.0005,
      stagger: { each: 0.004, from: 'random' },
    });

    gsap.to(overlay, {
      opacity: 0,
      delay: 1.15,
      duration: 0.3,
      onComplete: () => {
        window.location.href = 'gallery.html';
      },
    });
  });
})();
