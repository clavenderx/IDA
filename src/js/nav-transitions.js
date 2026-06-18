(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    const routes = ['gallery.html', 'about.html', 'index.html', 'jury.html', 'eva.html'];
    routes.forEach(page => {
      document.querySelectorAll(`a[href="${page}"]`).forEach(link => {
        if (currentPage === page) return;
        link.addEventListener('click', e => {
          e.preventDefault();
          PixelTransition.navigateTo(page);
        });
      });
    });
  });
})();
