// Import utility function for preloading images
import { preloadImages } from "./utils.js";
import { initSwirlEffects } from "./swirl.js";
import { initTypewriter, animateTypewriter } from "./typewriter.js";
import { initPixelHeading } from "./pixelHeading.js";

// Register the GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollSmoother, ScrollToPlugin, SplitText);

// Initialize GSAP's ScrollSmoother for smooth scrolling and scroll-based effects
const smoother = ScrollSmoother.create({
  smooth: 1, // How long (in seconds) it takes to "catch up"
  effects: true, // Enable data-speed and data-lag-based scroll effects
  normalizeScroll: true, // Normalizes scroll behavior across browsers
});

// Reference to the container that wraps all the 3D scene elements
const sceneWrapper = document.querySelector(".scene-wrapper");

// Global flag to prevent multiple animations from overlapping or triggering at once
let isAnimating = false;

// A Map to store SplitText instances keyed by DOM elements (used for animating text characters)
const splitMap = new Map();

/**
 * Returns an array of transform strings to evenly space carousel cells in 3D
 *
 * @param {number} count - Number of carousel cells
 * @param {number} radius - Radius of the circular layout
 * @returns {string[]} Array of transform strings for each cell
 */
const getCarouselCellTransforms = (count, radius) => {
  const angleStep = 360 / count; // Divide 360° by number of cells to get angle step
  return Array.from({ length: count }, (_, i) => {
    const angle = i * angleStep;
    return `rotateY(${angle}deg) translateZ(${radius}px)`; // 3D rotation + translation
  });
};

/**
 * Applies 3D transforms to each cell in a given carousel
 *
 * @param {Element} carousel - DOM element representing the carousel
 * @returns {void}
 */
const setupCarouselCells = (carousel) => {
  const wrapper = carousel.closest(".scene");
  const radius = parseFloat(wrapper.dataset.radius) || 500; // Read radius from data attribute or default to 500
  const cells = carousel.querySelectorAll(".carousel__cell");

  const transforms = getCarouselCellTransforms(cells.length, radius); // Get transform strings
  cells.forEach((cell, i) => {
    cell.style.transform = transforms[i]; // Apply transform to each cell
  });
};

/**
 * Creates a scroll-linked GSAP timeline for a given carousel scene
 *
 * @param {Element} carousel - DOM element of the carousel
 * @returns {GSAPTimeline} Scroll-driven animation timeline
 */
const createScrollAnimation = (carousel) => {
  const wrapper = carousel.closest(".scene");
  const cards = carousel.querySelectorAll(".card");
  const titleSpan = wrapper.querySelector(".scene__title span");
  const split = splitMap.get(titleSpan);
  const chars = split?.chars || [];

  // Create scroll-driven timeline
  carousel._timeline = gsap.timeline({
    defaults: { ease: "sine.inOut" },
    scrollTrigger: {
      trigger: wrapper,
      start: "top bottom", // Start when top of wrapper hits bottom of viewport
      end: "bottom top", // End when bottom of wrapper hits top of viewport
      scrub: true, // Smooth animation based on scroll position
    },
  });

  carousel._timeline
    .fromTo(carousel, { rotationY: 0 }, { rotationY: -180 }, 0) // Rotate carousel horizontally
    .fromTo(
      carousel,
      { rotationZ: 3, rotationX: 3 },
      { rotationZ: -3, rotationX: -3 },
      0,
    ) // Subtle 3D tilt
    .fromTo(
      cards,
      { filter: "brightness(250%)" },
      { filter: "brightness(80%)", ease: "power3" },
      0,
    ) // Brightness dimming
    .fromTo(cards, { rotationZ: 10 }, { rotationZ: -10, ease: "none" }, 0); // Rotate cards around Z

  // Animate title characters in on scroll
  if (chars.length > 0) {
    animateChars(chars, "in", {
      scrollTrigger: {
        trigger: wrapper,
        start: "top center",
        toggleActions: "play none none reverse",
      },
    });
  }

  return carousel._timeline;
};

const initTextsSplit = () => {
  initTypewriter(
    document.querySelectorAll(".scene__title span, .preview__title span, .preview__close"),
    { map: splitMap },
  );
};

/**
 * Returns interpolated rotation values based on scroll progress
 *
 * @param {number} progress - Scroll progress (0 to 1)
 * @returns {Object} Object with interpolated rotationX, rotationY, rotationZ values
 */
const getInterpolatedRotation = (progress) => ({
  rotationY: gsap.utils.interpolate(0, -180, progress), // Horizontal spin from 0° to -180°
  rotationX: gsap.utils.interpolate(3, -3, progress), // Tilt forward/backward
  rotationZ: gsap.utils.interpolate(3, -3, progress), // Z-axis twist
});

/**
 * Animates a single grid item into view with position, scale, and 3D depth
 *
 * @param {Element} el - DOM element to animate
 * @param {number} dx - Horizontal distance from center
 * @param {number} dy - Vertical distance from center
 * @param {number} rotationY - Y-axis rotation direction
 * @param {number} delay - Delay before animation starts
 * @returns {void}
 */
const animateGridItemIn = (el, dx, dy, rotationY, delay) => {
  // Animate 2D transform and opacity
  gsap.fromTo(
    el,
    {
      transformOrigin: `% 50% ${dx > 0 ? -dx * 0.8 : dx * 0.8}px`,
      //x: dx, // Offset based on distance from center
      autoAlpha: 0,
      y: dy * 0.5, // Slight vertical offset
      scale: 0.5, // Scaled down
      rotationY: dx < 0 ? rotationY : rotationY, // Rotate in from left/right
    },
    {
      //x: 0,
      y: 0,
      scale: 1,
      rotationY: 0,
      autoAlpha: 1,
      duration: 0.4,
      ease: "sine",
      delay: delay + 0.1,
    },
  );

  // Animate z-position separately for 3D pop
  gsap.fromTo(
    el,
    { z: -3500 },
    {
      z: 0,
      duration: 0.3,
      ease: "expo",
      delay,
    },
  );
};

/**
 * Animates a single grid item out of view with depth and fade
 *
 * @param {Element} el - DOM element to animate
 * @param {number} dx - Horizontal distance from center
 * @param {number} dy - Vertical distance from center
 * @param {number} rotationY - Y-axis rotation direction
 * @param {number} delay - Delay before animation starts
 * @param {boolean} isLast - Whether this is the last item (for onComplete)
 * @param {Function} [onComplete] - Callback when animation finishes
 * @returns {void}
 */
const animateGridItemOut = (
  el,
  dx,
  dy,
  rotationY,
  delay,
  isLast,
  onComplete,
) => {
  // Animate 2D transform and opacity
  gsap.to(el, {
    startAt: {
      transformOrigin: `50% 50% ${dx > 0 ? -dx * 0.8 : dx * 0.8}px`,
    },
    //x: dx,
    y: dy * 0.4,
    rotationY: dx < 0 ? rotationY : rotationY,
    scale: 0.4,
    autoAlpha: 0,
    duration: 0.4,
    ease: "sine.in",
    delay,
  });
  gsap.to(el, {
    z: -3500,
    duration: 0.4,
    ease: "expo.in",
    delay: delay + 0.9,
    onComplete: isLast ? onComplete : undefined, // Call onComplete only for the last item
  });
};

/**
 * Animates all grid items in or out with a distance-based stagger and easing
 *
 * @param {Object} options
 * @param {NodeList} options.items - Collection of grid item DOM elements
 * @param {number} options.centerX - X-coordinate of the center
 * @param {number} options.centerY - Y-coordinate of the center
 * @param {'in' | 'out'} [options.direction='in'] - Animation direction
 * @param {Function} [options.onComplete] - Callback after all animations complete
 * @returns {void}
 */
const animateGridItems = ({
  items,
  centerX,
  centerY,
  direction = "in",
  onComplete,
}) => {
  // Measure position of each item and calculate distance from center
  const itemData = Array.from(items).map((el) => {
    const rect = el.getBoundingClientRect();
    const elCenterX = rect.left + rect.width / 2;
    const elCenterY = rect.top + rect.height / 2;
    const dx = centerX - elCenterX;
    const dy = centerY - elCenterY;
    const dist = Math.hypot(dx, dy); // Euclidean distance from center
    const isLeft = elCenterX < centerX;
    return { el, dx, dy, dist, isLeft };
  });

  const maxDist = Math.max(...itemData.map((d) => d.dist)); // Farthest distance
  const totalStagger = 0.025 * (itemData.length - 1); // Total stagger duration

  let latest = { delay: -1, el: null }; // Track latest delay item

  itemData.forEach(({ el, dx, dy, dist, isLeft }) => {
    const norm = maxDist ? dist / maxDist : 0; // Normalize distance
    const exponential = Math.pow(direction === "in" ? 1 - norm : norm, 1); // Easing
    const delay = exponential * totalStagger;
    const rotationY = isLeft ? 100 : -100; // Directional rotation

    if (direction === "in") {
      animateGridItemIn(el, dx, dy, rotationY, delay);
    } else {
      if (delay > latest.delay) {
        latest = { delay, el };
      }
      animateGridItemOut(el, dx, dy, rotationY, delay, false, onComplete);
    }
  });

  // Ensure onComplete runs only after the last item finishes
  if (direction === "out" && latest.el) {
    const { el, dx, dy, isLeft } = itemData.find((d) => d.el === latest.el);
    const rotationY = isLeft ? 100 : -100;
    animateGridItemOut(el, dx, dy, rotationY, latest.delay, true, onComplete);
  }
};

/**
 * Stores active coverflow carousel state per preview element.
 */
const ringStateMap = new Map();

/**
 * Positions coverflow cards based on the current index (supports decimals for smooth drag).
 */
const applyCoverflowLayout = (imgs, currentIndex, count) => {
  const GAP = 500;
  const SIDE_ROTATE = 20;
  const SIDE_SCALE = 0.85;

  imgs.forEach((img, i) => {
    const offset = ((i - currentIndex) % count + count) % count;
    // Normalize so offset is in range -count/2 to count/2 (wrap around)
    const wrapped = offset > count / 2 ? offset - count : offset;

    const x = wrapped * GAP;
    const rotY = wrapped === 0 ? 0 : wrapped > 0 ? -SIDE_ROTATE : SIDE_ROTATE;
    const scale = Math.abs(wrapped) >= 1 ? SIDE_SCALE : 1;
    const zIndex = Math.round(10 - Math.abs(wrapped));
    const opacity = Math.abs(wrapped) > 1.5 ? 0 : 1;

    gsap.set(img, { x, rotateY: rotY, scale, zIndex, opacity });
  });
};

/**
 * Initialises the coverflow carousel inside a preview
 * @param {HTMLElement} preview
 */
const initPreviewRing = (preview) => {
  const ring = preview.querySelector(".ring");
  if (!ring) return;
  const imgs = Array.from(ring.querySelectorAll(".ring-img"));
  const count = imgs.length;
  if (!count) return;

  gsap.set(ring, { transformStyle: "preserve-3d", perspective: 1200 });
  gsap.set(imgs, { transformStyle: "preserve-3d", position: "absolute", top: 0, left: "50%", xPercent: -50 });

  let currentIndex = 1;
  applyCoverflowLayout(imgs, currentIndex, count);

  ringStateMap.set(preview, { ring, imgs });
};

/**
 * Tears down the coverflow carousel event listeners for a preview
 * @param {HTMLElement} preview
 */
const destroyPreviewRing = (preview) => {
  ringStateMap.delete(preview);
};

/**
 * Animates the ring carousel into view when preview opens
 * @param {HTMLElement} preview
 */
const animatePreviewGridIn = (preview) => {
  initPreviewRing(preview);
  const state = ringStateMap.get(preview);
  if (!state) return;
  const { imgs } = state;

  // Staggered entrance: images fly up from below with fade
  gsap.fromTo(
    imgs,
    {
      y: 200,
      opacity: 0,
    },
    {
      y: 0,
      opacity: 1,
      duration: 1.2,
      ease: "expo.out",
      stagger: 0.07,
    },
  );
};

/**
 * Animates the ring carousel out when preview closes
 * @param {HTMLElement} preview
 */
const animatePreviewGridOut = (preview) => {
  const state = ringStateMap.get(preview);
  const imgs = state ? state.imgs : preview.querySelectorAll(".ring-img");

  gsap.to(imgs, {
    y: -150,
    opacity: 0,
    duration: 0.5,
    ease: "expo.in",
    stagger: 0.04,
    onComplete: () => {
      destroyPreviewRing(preview);
      if (preview.id === "preview-2") destroyEvaStory(preview);
      gsap.set(preview, { pointerEvents: "none", autoAlpha: 0 });
      document.querySelector(".preview-bottom-bar")?.classList.remove("is-visible");
      // Reset for next open
      if (imgs.length)
        gsap.set(imgs, { clearProps: "y,opacity,backgroundPosition" });
    },
  });
};

/**
 * Retrieves relevant DOM elements and text splits from a scene title
 * @param {HTMLElement} titleEl - The `.scene__title` element
 * @returns {Object} wrapper, carousel, cards, span, chars
 */
const getSceneElementsFromTitle = (titleEl) => {
  const wrapper = titleEl.closest(".scene"); // Scene container
  const carousel = wrapper?.querySelector(".carousel"); // Carousel in the scene
  const cards = carousel?.querySelectorAll(".card"); // All card elements
  const span = titleEl.querySelector("span"); // Title span
  const chars = splitMap.get(span)?.chars || []; // SplitText chars
  return { wrapper, carousel, cards, span, chars };
};

/**
 * Retrieves scene-related elements from a preview element
 * @param {HTMLElement} previewEl - The `.preview` element
 * @returns {Object} All scene elements and corresponding titleEl
 */
const getSceneElementsFromPreview = (previewEl) => {
  const previewId = `#${previewEl.id}`;
  const titleLink = document.querySelector(
    `.scene__title a[href="${previewId}"]`,
  );
  const titleEl = titleLink?.closest(".scene__title"); // Corresponding title element
  return { ...getSceneElementsFromTitle(titleEl), titleEl };
};

const animateChars = animateTypewriter;

/**
 * Animates title and close button characters in a preview
 *
 * @param {HTMLElement} preview - The preview container
 * @param {'in' | 'out'} direction - Animation direction
 * @param {string} [selector='.preview__title span, .preview__close'] - Selector for elements to animate
 */
const animatePreviewTexts = (
  preview,
  direction = "in",
  selector = ".preview__title span, .preview__close",
) => {
  preview.querySelectorAll(selector).forEach((el) => {
    const chars = splitMap.get(el)?.chars || [];
    animateChars(chars, direction);
  });
};

/**
 * Handles transition from carousel view to preview grid
 *
 * @param {Event} e - Click event triggered from `.scene__title`
 */
const activatePreviewFromCarousel = (e) => {
  const titleEl = e.currentTarget;
  const href = titleEl.querySelector("a")?.getAttribute("href");
  if (!href || !href.startsWith("#")) return;
  e.preventDefault();
  if (isAnimating) return;
  isAnimating = true;
  const { wrapper, carousel, cards, chars } =
    getSceneElementsFromTitle(titleEl);

  // Calculate scroll position to center the scene
  const offsetTop = wrapper.getBoundingClientRect().top + window.scrollY;
  const targetY = offsetTop - window.innerHeight / 2 + wrapper.offsetHeight / 2;

  // Temporarily disable scroll-based animations
  ScrollTrigger.getAll().forEach((t) => t.disable(false));

  gsap
    .timeline({
      defaults: { duration: 1.5, ease: "power2.inOut" },
      onComplete: () => {
        isAnimating = false;
        ScrollTrigger.getAll().forEach((t) => t.enable());
        carousel._timeline.scrollTrigger.scroll(targetY);
      },
    })
    .to(window, {
      onStart: () => {
        lockUserScroll();
      },
      onComplete: () => {
        unlockUserScroll();
        smoother.paused(true);
        // Kill normalizeScroll event capture so wheel events reach our preview listener
        ScrollTrigger.normalizeScroll(false);
      },
      scrollTo: { y: targetY, autoKill: true },
    })
    .to(
      chars,
      {
        autoAlpha: 0,
        duration: 0.02,
        ease: "none",
        stagger: { each: 0.04, from: "end" },
      },
      0,
    )
    .to(carousel, { rotationX: 90, rotationY: -360, z: -2000 }, 0)
    .to(
      carousel,
      {
        duration: 2.5,
        ease: "power3.inOut",
        z: 1500,
        rotationZ: 270,
        onComplete: () => gsap.set(sceneWrapper, { autoAlpha: 0 }),
      },
      0.7,
    )
    .to(cards, { rotationZ: 0 }, 0)
    .add(() => {
      const previewSelector = titleEl.querySelector("a")?.getAttribute("href");
      const preview = document.querySelector(previewSelector);
      gsap.set(preview, { pointerEvents: "auto", autoAlpha: 1 });
      // Fix: .preview__close is position:fixed so it doesn't inherit pointer-events from .preview
      const closeBtn = preview.querySelector(".preview__close");
      if (closeBtn) gsap.set(closeBtn, { pointerEvents: "auto" });
      animatePreviewGridIn(preview);
      animatePreviewTexts(preview, "in");
      animateBioIn(preview);
      if (preview.id === "preview-2") initEvaStory(preview);
      document.querySelector(".preview-bottom-bar")?.classList.add("is-visible");
    }, "<+=1.9");
};

let evaStoryWheelHandler = null;

/**
 * Tears down Eva's story scroll wheel listener.
 */
const destroyEvaStory = (preview) => {
  if (evaStoryWheelHandler) {
    preview.removeEventListener("wheel", evaStoryWheelHandler);
    window.removeEventListener("wheel", evaStoryWheelHandler);
    evaStoryWheelHandler = null;
  }
};

/**
 * Drives the horizontal text scroll + coverflow rotation for Eva's preview.
 * Resets to slide 0 on every open and cleans up previous listeners first.
 */
const initEvaStory = (preview) => {
  const track = preview.querySelector(".eva-story__track");
  if (!track) return;

  // Clean up any previous listener and reset to first slide
  destroyEvaStory(preview);
  gsap.set(track, { x: 0 });

  const slides = preview.querySelectorAll(".eva-story__slide");
  const slideCount = slides.length;
  let currentSlide = 0;
  let animating = false;

  const state = ringStateMap.get(preview);
  const ringImgs = state ? state.imgs : [];
  const ringCount = ringImgs.length;

  const goToSlide = (index) => {
    if (animating) return;
    animating = true;

    const prevSlide = currentSlide;
    const nextSlide = ((index % slideCount) + slideCount) % slideCount;
    const isForwardWrap = prevSlide === slideCount - 1 && nextSlide === 0;
    const isBackwardWrap = prevSlide === 0 && nextSlide === slideCount - 1;

    if (ringCount) applyCoverflowLayout(ringImgs, (nextSlide + 1) % ringCount, ringCount);

    const fill = document.getElementById("previewScrollFill");
    if (fill) fill.style.width = `${(nextSlide / (slideCount - 1)) * 100}%`;

    if (isForwardWrap) {
      // Clone slide 0 at end so animation continues leftward
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
        },
      });
    } else if (isBackwardWrap) {
      // Clone slide N-1 at start so animation continues rightward
      const clone = slides[slideCount - 1].cloneNode(true);
      track.insertBefore(clone, slides[0]);
      // Shift track to maintain current visual position after prepend
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
        },
      });
    } else {
      currentSlide = nextSlide;
      gsap.to(track, {
        x: `-${currentSlide * 100}vw`,
        duration: 0.8,
        ease: "power3.inOut",
        onComplete: () => { animating = false; },
      });
    }
  };

  let wheelLock = false;

  evaStoryWheelHandler = (e) => {
    e.preventDefault();
    if (wheelLock) return;
    wheelLock = true;
    setTimeout(() => { wheelLock = false; }, 900);

    if (e.deltaY > 0 || e.deltaX > 0) {
      goToSlide(currentSlide + 1);
    } else {
      goToSlide(currentSlide - 1);
    }
  };

  preview.addEventListener("wheel", evaStoryWheelHandler, { passive: false });
  window.addEventListener("wheel", evaStoryWheelHandler, { passive: false });
};

/**
 * Handles transition from preview grid back to carousel view
 *
 * @param {Event} e - Click event triggered from `.preview__close`
 */
const deactivatePreviewToCarousel = (e) => {
  if (isAnimating) return;
  isAnimating = true;

  const closeBtn = e.currentTarget;
  const preview = closeBtn?.closest(".preview");
  if (!preview) return;

  // Disable the close button immediately to prevent double-firing
  gsap.set(closeBtn, { pointerEvents: "none" });

  const { carousel, cards, chars } = getSceneElementsFromPreview(preview);

  animatePreviewTexts(preview, "out");
  animateBioOut(preview);
  animatePreviewGridOut(preview);

  gsap.set(sceneWrapper, { autoAlpha: 1 });

  const progress = 0.5; // halfway
  /*
  BUG: progress should always be 0.5 but for some reason it's 0 sometimes
  const timeline = carousel._timeline;
  const scrollTrigger = timeline?.scrollTrigger;
  const progress = scrollTrigger?.progress ?? 0;
  */

  const { rotationX, rotationY, rotationZ } = getInterpolatedRotation(progress);

  gsap
    .timeline({
      delay: 0.7,
      defaults: { duration: 1.3, ease: "expo" },
      onComplete: () => {
        smoother.paused(false);
        ScrollTrigger.normalizeScroll(true);
        isAnimating = false;
      },
    })
    .fromTo(
      chars,
      { autoAlpha: 0 },
      {
        autoAlpha: 1,
        duration: 0.02,
        ease: "none",
        stagger: { each: 0.04, from: "start" },
      },
    )
    .fromTo(
      carousel,
      {
        z: -550,
        rotationX,
        rotationY: -720,
        rotationZ,
        yPercent: 300,
      },
      {
        rotationY,
        yPercent: 0,
      },
      0,
    )
    .fromTo(cards, { autoAlpha: 0 }, { autoAlpha: 1 }, 0.3);
};

/**
 * Scroll-to-close state per preview
 */

/**
 * Adds click event listeners to scene titles and preview close buttons
 *
 * @returns {void}
 */
const initEventListeners = () => {
  document.querySelectorAll(".scene__title").forEach((title) => {
    title.addEventListener("click", activatePreviewFromCarousel);

    const span = title.querySelector("span");
    const chars = splitMap.get(span)?.chars || [];

    title.addEventListener("mouseenter", () => {
      gsap.to(chars, { color: "#C3FA95", duration: 0.2, stagger: { each: 0.02, from: "start" }, overwrite: "auto" });
    });
    title.addEventListener("mouseleave", () => {
      gsap.to(chars, { color: "#ffffff", duration: 0.2, stagger: { each: 0.02, from: "end" }, overwrite: "auto" });
    });
  });

  document.querySelectorAll(".preview__close").forEach((btn) => {
    btn.addEventListener("click", deactivatePreviewToCarousel);
  });
};

/**
 * Initializes all carousels on the page
 *
 * @returns {void}
 */
const initCarousels = () => {
  document.querySelectorAll(".carousel").forEach((carousel) => {
    setupCarouselCells(carousel); // Position carousel cells in 3D
    carousel._timeline = createScrollAnimation(carousel); // Attach scroll animation timeline
  });
};

function preventScroll(e) {
  e.preventDefault();
}

function lockUserScroll() {
  window.addEventListener("wheel", preventScroll, { passive: false });
  window.addEventListener("touchmove", preventScroll, { passive: false });
  window.addEventListener("keydown", preventArrowScroll, false);
}

function unlockUserScroll() {
  window.removeEventListener("wheel", preventScroll);
  window.removeEventListener("touchmove", preventScroll);
  window.removeEventListener("keydown", preventArrowScroll);
}

function preventArrowScroll(e) {
  const keys = [
    "ArrowUp",
    "ArrowDown",
    "PageUp",
    "PageDown",
    "Home",
    "End",
    " ",
  ];
  if (keys.includes(e.key)) e.preventDefault();
}

/**
 * Splits bio text into word spans for animation
 */
const initBioSplit = () => {
  document.querySelectorAll(".preview__bio span").forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => `<span class="word">${w}</span>`).join(" ");
  });
};

/**
 * Animates bio words in one by one
 */
const animateBioIn = (preview) => {
  const words = preview.querySelectorAll(".preview__bio .word");
  if (!words.length) return;
  gsap.fromTo(
    words,
    { autoAlpha: 0, y: 8 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.3,
      ease: "power2.out",
      stagger: { each: 0.04, from: "start" },
      delay: 0.2,
    },
  );
};

/**
 * Animates bio words out
 */
const animateBioOut = (preview) => {
  const words = preview.querySelectorAll(".preview__bio .word");
  if (!words.length) return;
  gsap.to(words, {
    autoAlpha: 0,
    y: 8,
    duration: 0.15,
    ease: "power2.in",
    stagger: { each: 0.02, from: "end" },
  });
};

/**
 * Sets up scroll-triggered fade-in for grid items inside a preview
 */
const initGridScrollFade = (preview) => {
  const items = preview.querySelectorAll(".grid__item");
  items.forEach((item) => {
    gsap.to(item, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power2.out",
      scrollTrigger: {
        trigger: item,
        scroller: preview,
        start: "top 95%",
        toggleActions: "play none none reverse",
      },
    });
  });
};

/**
 * Initializes text splitting, carousels, and event listeners
 *
 * @returns {void}
 */
const init = () => {
  initBioSplit();
  initTextsSplit(); // Prepare character-level splits for animations
  initCarousels(); // Set up carousels with transforms and scroll triggers
  initEventListeners(); // Bind all interactive handlers
  window.addEventListener("resize", ScrollTrigger.refresh); // Refresh triggers on resize
};

// Preload carousel card faces first (visible on load), then preload ring images
// in the background so previews are ready when opened.
preloadImages(".card__face").then(() => {
  document.body.classList.remove("loading"); // Remove loading state from body
  init(); // Begin initialization
  initPixelHeading(document.querySelector(".jury-hero__heading"));
  preloadImages(".ring-img"); // Preload preview ring images in background
});
