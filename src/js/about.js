import { initPixelHeading } from './pixelHeading.js';
import { animateTypewriter } from './typewriter.js';

/* ─── Pixel Entry Transition ─────────────────────────────────────────────── */
(function () {
  const container = document.getElementById('square_container');
  const SQ = 100;
  const cols = Math.ceil(window.innerWidth / SQ);
  const rows = Math.ceil(window.innerHeight / SQ);
  container.style.width  = cols * SQ + 'px';
  container.style.height = rows * SQ + 'px';

  const squares = [];
  for (let i = 0; i < cols * rows; i++) {
    const sq = document.createElement('div');
    sq.className = 'square';
    container.appendChild(sq);
    squares.push(sq);
  }

  gsap.to(squares, {
    opacity: 0,
    delay: 0.3,
    duration: 0.0005,
    stagger: { each: 0.004, from: 'random' },
    onComplete: () => { container.style.display = 'none'; },
  });
})();

/* ─── Pixel Heading ──────────────────────────────────────────────────────── */
initPixelHeading(document.getElementById('about-heading'), 75);
initPixelHeading(document.getElementById('about-year'), 20);

/* ─── Scroll Indicator + Panel Tracking ─────────────────────────────────── */
const page      = document.getElementById('about-page');
const scrollNav = document.getElementById('about-scroll-nav');
const fill      = document.getElementById('aboutNavFill');
const PANELS         = 5;
const INTRO_SECTIONS = 2;
const LAST_PANEL     = INTRO_SECTIONS + PANELS - 1; // index 6 = ap-5

/* ─── Final Overlay ──────────────────────────────────────────────────────── */
const apFinal    = document.getElementById('ap-final');
const ap5        = document.getElementById('ap-5');
const ap5Content = ap5.querySelector('.ap-content');
const ap5Label   = ap5.querySelector('.ap-top-label');
let finalState   = 'hidden'; // 'hidden' | 'visible'

function showFinalOverlay() {
  if (finalState === 'visible') return;
  finalState = 'visible';
  scrollNav.classList.remove('visible');
  gsap.to(apFinal, { y: '0%', duration: 0.9, ease: 'power3.out' });
  gsap.to([ap5Content, ap5Label], { opacity: 0, duration: 0.5, ease: 'power1.out' });
}

function hideFinalOverlay() {
  if (finalState === 'hidden') return;
  finalState = 'hidden';
  gsap.to(apFinal, { y: '100%', duration: 0.7, ease: 'power3.in' });
  gsap.to([ap5Content, ap5Label], { opacity: 1, duration: 0.4, ease: 'power1.in' });
}

page.addEventListener('scroll', () => {
  const sectionIndex = Math.round(page.scrollTop / window.innerHeight);
  const panelIndex   = sectionIndex - INTRO_SECTIONS;

  if (panelIndex >= 0 && panelIndex < PANELS && finalState === 'hidden') {
    scrollNav.classList.add('visible');
    fill.style.width = (panelIndex / (PANELS - 1) * 100) + '%';
  } else {
    scrollNav.classList.remove('visible');
  }

  // Auto-hide if user snaps back past ap-5
  if (sectionIndex < LAST_PANEL && finalState === 'visible') {
    hideFinalOverlay();
  }
});

page.addEventListener('wheel', (e) => {
  const sectionIndex = Math.round(page.scrollTop / window.innerHeight);

  if (sectionIndex === LAST_PANEL && e.deltaY > 0 && finalState === 'hidden') {
    e.preventDefault();
    showFinalOverlay();
  } else if (finalState === 'visible' && e.deltaY < 0) {
    e.preventDefault();
    hideFinalOverlay();
  } else if (finalState === 'visible' && e.deltaY > 0) {
    e.preventDefault();
    exitWithPixels('gallery.html');
  }
}, { passive: false });

/* ─── Pixel Exit Transition ──────────────────────────────────────────────── */
let exiting = false;
function exitWithPixels(href) {
  if (exiting) return;
  exiting = true;
  const container = document.getElementById('square_container');
  container.style.display = 'flex';
  const squares = Array.from(container.querySelectorAll('.square'));
  gsap.fromTo(squares,
    { opacity: 0 },
    {
      opacity: 1,
      duration: 0.0005,
      stagger: { each: 0.004, from: 'random' },
      onComplete: () => { window.location.href = href; },
    }
  );
}

/* Wheel listener on the overlay itself — fires when it covers the screen */
apFinal.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (e.deltaY < 0) {
    hideFinalOverlay();
  } else if (e.deltaY > 0) {
    exitWithPixels('gallery.html');
  }
}, { passive: false });


document.getElementById('ap-gallery-cta').addEventListener('click', (e) => {
  e.preventDefault();
  exitWithPixels('gallery.html');
});

/* ─── Typewriter on Panel Enter ──────────────────────────────────────────── */
document.fonts.ready.then(() => {
  const splitMap = new Map();

  document.querySelectorAll('.ap-title').forEach(el => {
    const split = SplitText.create(el, {
      type: 'chars',
      charsClass: 'char',
      autoSplit: true,
    });
    splitMap.set(el, split);
    gsap.set(split.chars, { autoAlpha: 0 });
  });

  // Body text: split words AND chars so word containers prevent mid-word breaks
  document.querySelectorAll('.ap-body').forEach(el => {
    const split = SplitText.create(el, {
      type: 'words,chars',
      wordsClass: 'ap-word',
      charsClass: 'char',
      autoSplit: true,
    });
    splitMap.set(el, split);
    gsap.set(split.chars, { autoAlpha: 0 });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.target._twPlayed) return;
      entry.target._twPlayed = true;

      const titleEl = entry.target.querySelector('.ap-title');
      const bodyEl  = entry.target.querySelector('.ap-body');

      if (titleEl) {
        const split = splitMap.get(titleEl);
        if (split) animateTypewriter(split.chars, 'in');
      }
      if (bodyEl) {
        const split = splitMap.get(bodyEl);
        if (split) animateTypewriter(split.chars, 'in', { delay: 0.4 });
      }
    });
  }, {
    root: page,
    threshold: 0.5,
  });

  document.querySelectorAll('.ap').forEach(panel => observer.observe(panel));
});
