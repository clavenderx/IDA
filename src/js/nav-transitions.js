(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('a[href="gallery.html"]').forEach(link => {
      if (currentPage === 'gallery.html') return;
      link.addEventListener('click', e => {
        e.preventDefault();
        PixelTransition.navigateTo('gallery.html');
      });
    });
  });
})();
