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
