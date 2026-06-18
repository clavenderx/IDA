/* ─── Pixel Entry Transition ─────────────────────────────────────────────── */
PixelTransition.fillOut({ duration: 0.8 });

import { preloadImages } from "./utils.js";
import { initTypewriter, animateTypewriter } from "./typewriter.js";

gsap.registerPlugin(SplitText);

const splitMap = new Map();

const applyCoverflowLayout = (imgs, currentIndex, count, animate = false, forward = true) => {
  const GAP = 500;
  const SIDE_ROTATE = 20;
  const SIDE_SCALE = 0.85;
  const half = count / 2;

  imgs.forEach((img, i) => {
    const offset = ((i - currentIndex) % count + count) % count;
    let wrapped = offset > half ? offset - count : offset;

    // The "opposite" image (exactly halfway around) has an ambiguous side.
    // Send it in the same direction as the scroll so it never crosses the screen.
    if (offset === half) wrapped = forward ? -half : half;

    const x = wrapped * GAP;
    const rotY = wrapped === 0 ? 0 : wrapped > 0 ? -SIDE_ROTATE : SIDE_ROTATE;
    const scale = Math.abs(wrapped) >= 1 ? SIDE_SCALE : 1;
    const zIndex = Math.round(10 - Math.abs(wrapped));
    const opacity = Math.abs(wrapped) > 1.5 ? 0 : 1;
    const overlayOpacity = wrapped === 0 ? 0 : 0.65;
    const overlay = img.querySelector('.ring-img-overlay');

    if (animate) {
      gsap.to(img, { x, rotateY: rotY, scale, zIndex, opacity, duration: 0.7, ease: "power2.inOut" });
      if (overlay) gsap.to(overlay, { opacity: overlayOpacity, duration: 0.7, ease: "power2.inOut" });
    } else {
      gsap.set(img, { x, rotateY: rotY, scale, zIndex, opacity });
      if (overlay) gsap.set(overlay, { opacity: overlayOpacity });
    }
  });
};

const initRing = () => {
  const ring = document.querySelector(".ring");
  if (!ring) return null;
  const imgs = Array.from(ring.querySelectorAll(".ring-img"));
  const count = imgs.length;
  if (!count) return null;

  gsap.set(ring, { transformStyle: "preserve-3d", perspective: 1200 });
  gsap.set(imgs, {
    transformStyle: "preserve-3d",
    position: "absolute",
    top: 0,
    left: "50%",
    xPercent: -50,
  });

  imgs.forEach(img => {
    const overlay = document.createElement('div');
    overlay.className = 'ring-img-overlay';
    overlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.65);pointer-events:none;';
    img.appendChild(overlay);
  });

  applyCoverflowLayout(imgs, 1, count);

  gsap.fromTo(
    imgs,
    { y: 200, opacity: 0 },
    { y: 0, opacity: 1, duration: 1.2, ease: "expo.out", stagger: 0.07 },
  );

  return { imgs, count };
};

const initEvaStory = (ringRef) => {
  const track = document.querySelector(".eva-story__track");
  if (!track) return;

  gsap.set(track, { x: 0 });

  const slides = document.querySelectorAll(".eva-story__slide");
  const slideCount = slides.length;
  let currentSlide = 0;
  let animating = false;

  const ringImgs = ringRef ? ringRef.imgs : [];
  const ringCount = ringRef ? ringRef.count : 0;
  let prevRingIndex = 1; // matches initRing's starting index

  const animateSlideBody = (slideEl) => {
    const body = slideEl?.querySelector(".eva-story__body");
    if (!body) return;
    const split = splitMap.get(body);
    if (split) animateTypewriter(split.chars, "in");
  };

  slides.forEach((slide) => {
    const body = slide.querySelector(".eva-story__body");
    if (!body) return;
    const split = splitMap.get(body);
    if (split) gsap.set(split.chars, { autoAlpha: 0 });
  });
  animateSlideBody(slides[0]);

  const goToSlide = (index) => {
    if (animating) return;
    animating = true;

    const outBody = slides[currentSlide]?.querySelector(".eva-story__body");
    if (outBody) {
      const outSplit = splitMap.get(outBody);
      if (outSplit) gsap.set(outSplit.chars, { autoAlpha: 0 });
    }

    const prevSlide = currentSlide;
    const nextSlide = ((index % slideCount) + slideCount) % slideCount;
    const isForwardWrap = prevSlide === slideCount - 1 && nextSlide === 0;
    const isBackwardWrap = prevSlide === 0 && nextSlide === slideCount - 1;
    const forward = isForwardWrap || (!isBackwardWrap && nextSlide > prevSlide);

    if (ringCount) {
      const pinned = slides[nextSlide].dataset.ring;
      const ringIndex = pinned !== undefined
        ? parseInt(pinned, 10) % ringCount
        : (nextSlide + 1) % ringCount;

      if (ringIndex !== prevRingIndex) {
        // Snap the incoming side image to the correct off-screen edge before animating
        const incomingIdx = forward
          ? (ringIndex + 1) % ringCount
          : (ringIndex + ringCount - 1) % ringCount;
        gsap.set(ringImgs[incomingIdx], { x: forward ? window.innerWidth * 0.8 : -window.innerWidth * 0.8 });
      }

      applyCoverflowLayout(ringImgs, ringIndex, ringCount, true, forward);
      prevRingIndex = ringIndex;
    }

    const fill = document.getElementById("previewScrollFill");
    if (fill) fill.style.width = `${(nextSlide / (slideCount - 1)) * 100}%`;

    if (isForwardWrap) {
      const clone = slides[0].cloneNode(true);
      track.appendChild(clone);
      gsap.to(track, {
        x: `-${slideCount * 100}vw`,
        duration: 0.8,
        ease: "power3.inOut",
        onComplete: () => {
          track.removeChild(clone);
          currentSlide = 0;
          gsap.set(track, { x: 0 });
          animating = false;
          animateSlideBody(slides[nextSlide]);
        },
      });
    } else if (isBackwardWrap) {
      const clone = slides[slideCount - 1].cloneNode(true);
      track.insertBefore(clone, slides[0]);
      gsap.set(track, { x: `-${(prevSlide + 1) * 100}vw` });
      gsap.to(track, {
        x: 0,
        duration: 0.8,
        ease: "power3.inOut",
        onComplete: () => {
          track.removeChild(clone);
          currentSlide = slideCount - 1;
          gsap.set(track, { x: `-${(slideCount - 1) * 100}vw` });
          animating = false;
          animateSlideBody(slides[nextSlide]);
        },
      });
    } else {
      currentSlide = nextSlide;
      gsap.to(track, {
        x: `-${currentSlide * 100}vw`,
        duration: 0.8,
        ease: "power3.inOut",
        onComplete: () => {
          animating = false;
          animateSlideBody(slides[nextSlide]);
        },
      });
    }
  };

  let wheelLock = false;

  window.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      if (wheelLock) return;
      wheelLock = true;
      setTimeout(() => { wheelLock = false; }, 900);

      if (e.deltaY > 0 || e.deltaX > 0) {
        goToSlide(currentSlide + 1);
      } else {
        goToSlide(currentSlide - 1);
      }
    },
    { passive: false },
  );
};

const init = () => {
  initTypewriter(document.querySelectorAll(".preview__title span"), {
    map: splitMap,
  });

  initTypewriter(document.querySelectorAll(".eva-story__body"), {
    map: splitMap,
  });

  document.querySelectorAll(".preview__title span").forEach((el) => {
    const chars = splitMap.get(el)?.chars || [];
    animateTypewriter(chars, "in");
  });

  const ringRef = initRing();
  initEvaStory(ringRef);
};

preloadImages(".ring-img").then(() => {
  document.body.classList.remove("loading");
  init();
});
