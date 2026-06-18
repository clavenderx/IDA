/* ─── Lauf Elja Detail ───────────────────────────────────────────────────────── */
(function () {
  const laufDetail    = document.getElementById('lauf-detail');
  const detailClose   = document.getElementById('detail-close');
  const detailNavFill = document.getElementById('detailNavFill');
  const track         = laufDetail.querySelector('.detail-track');
  const heroMain      = laufDetail.querySelector('.dp-hero-main');
  const blueNoiseEl   = laufDetail.querySelector('.dp-blue-noise-quote');
  let blueNoiseOffset = null;

  track.scrollLeft = 0;
  gsap.fromTo(laufDetail, { opacity: 0 }, { opacity: 1, duration: 0.35 });

  /* ─── Typewriter effect ─────────────────────────────────────────────────── */
  function typewriter(el, speed) {
    if (el.dataset.typed) return;
    el.dataset.typed = 'true';

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push({ node, full: node.textContent });
      node.textContent = '';
    }

    let ni = 0, ci = 0;
    function tick() {
      if (ni >= textNodes.length) return;
      const { node, full } = textNodes[ni];
      if (ci < full.length) {
        node.textContent += full[ci++];
        setTimeout(tick, speed);
      } else {
        ni++; ci = 0;
        tick();
      }
    }
    tick();
  }

  const typeTargets = document.querySelectorAll(
    '.dp-hero-title, .dp-hero-credit, .dp-origin-q, .dp-noise-q, .dp-blue-noise-heading, .dp-long-noise-q, .dp-cycling3-left, .dp-cycling3-right'
  );

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        typewriter(entry.target, 18);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  typeTargets.forEach(el => observer.observe(el));

  track.addEventListener('scroll', () => {
    const sl = track.scrollLeft;
    const ratio = sl / (track.scrollWidth - track.clientWidth);
    detailNavFill.style.width = (ratio * 100) + '%';
    heroMain.style.transform = `translateX(${sl}px)`;

    if (blueNoiseOffset === null) {
      blueNoiseOffset = blueNoiseEl.getBoundingClientRect().left + sl;
    }
    const pinAmount = Math.max(0, sl - blueNoiseOffset);
    blueNoiseEl.style.transform = `translateX(${pinAmount}px)`;
  });

  detailClose.addEventListener('click', () => {
    gsap.to(laufDetail, {
      opacity: 0,
      duration: 0.25,
      onComplete: () => {
        window.location.href = 'gallery.html#gallery-scene';
      },
    });
  });

  laufDetail.addEventListener('wheel', (e) => {
    e.preventDefault();
    track.scrollLeft += e.deltaY * 1.4;
  }, { passive: false });

  /* ─── Guy slide-in animations ───────────────────────────────────────────── */
  const guy1El = document.querySelector('.dp-guy1');
  const guy2El = document.querySelector('.dp-guy2');
  const rightTextDelay = document.querySelector('.dp-cycling3-right').textContent.length * 18 / 1000;

  const guyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        gsap.fromTo(guy1El, { x: 250, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: 'power2.out', delay: rightTextDelay * 2 });
        gsap.fromTo(guy2El, { x: 250, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: 'power2.out', delay: rightTextDelay * 2 + 0.3 });
        guyObserver.disconnect();
      }
    });
  }, { threshold: 0.5 });

  guyObserver.observe(document.querySelector('.dp-cycling3-right'));
})();
