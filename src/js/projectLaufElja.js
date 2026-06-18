/* ─── Lauf Elja Detail ───────────────────────────────────────────────────────── */
(function () {
  const laufDetail    = document.getElementById('lauf-detail');
  const detailClose   = document.getElementById('detail-close');
  const detailNavFill = document.getElementById('detailNavFill');
  const track         = laufDetail.querySelector('.detail-track');

  track.scrollLeft = 0;
  gsap.fromTo(laufDetail, { opacity: 0 }, { opacity: 1, duration: 0.35 });

  track.addEventListener('scroll', () => {
    const ratio = track.scrollLeft / (track.scrollWidth - track.clientWidth);
    detailNavFill.style.width = (ratio * 100) + '%';
  });

  detailClose.addEventListener('click', () => {
    gsap.to(laufDetail, {
      opacity: 0,
      duration: 0.25,
      onComplete: () => {
        window.location.href = 'gallery.html';
      },
    });
  });

  laufDetail.addEventListener('wheel', (e) => {
    e.preventDefault();
    track.scrollLeft += e.deltaY * 1.4;
  }, { passive: false });
})();
