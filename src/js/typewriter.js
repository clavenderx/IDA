/**
 * Typewriter component — character-by-character reveal using GSAP SplitText.
 *
 * Usage:
 *   import { initTypewriter, animateTypewriter } from './typewriter.js';
 *
 *   // 1. Split elements (call once after DOM is ready)
 *   const splitMap = initTypewriter('.my-heading span');
 *
 *   // 2. Animate in/out
 *   const chars = splitMap.get(el);
 *   animateTypewriter(chars, 'in');
 *
 *   // 3. Or let initTypewriter wire up scroll triggers automatically
 *   initTypewriter('.my-heading span', { scrollTrigger: true });
 */

/**
 * Splits one or more elements into individual character spans via SplitText
 * and optionally wires up scroll-triggered typewriter animations.
 *
 * @param {string|NodeList|HTMLElement[]} selector - CSS selector or element list
 * @param {Object} [opts]
 * @param {boolean} [opts.scrollTrigger=false] - Auto-trigger animation when element enters viewport
 * @param {string} [opts.scrollStart='top center'] - ScrollTrigger start value
 * @param {string} [opts.direction='in'] - Default animation direction for scroll trigger
 * @param {Map} [opts.map] - Existing Map to populate (pass jury.js's splitMap to share it)
 * @returns {Map<HTMLElement, SplitText>} Map of element → SplitText instance
 */
export const initTypewriter = (selector, opts = {}) => {
  const {
    scrollTrigger: useScrollTrigger = false,
    scrollStart = "top center",
    direction = "in",
    map = new Map(),
  } = opts;

  const elements =
    typeof selector === "string"
      ? document.querySelectorAll(selector)
      : selector;

  elements.forEach((el) => {
    const split = SplitText.create(el, {
      type: "chars",
      charsClass: "char",
      autoSplit: true,
    });
    map.set(el, split);

    if (useScrollTrigger) {
      animateTypewriter(split.chars, direction, {
        scrollTrigger: {
          trigger: el,
          start: scrollStart,
          toggleActions: "play none none reverse",
        },
      });
    }
  });

  return map;
};

/**
 * Animates an array of SplitText character elements in or out.
 *
 * @param {HTMLElement[]} chars - Character elements (from SplitText instance)
 * @param {'in'|'out'} [direction='in'] - 'in' reveals, 'out' hides
 * @param {Object} [opts={}] - Extra GSAP options (e.g. scrollTrigger, delay)
 */
export const animateTypewriter = (chars, direction = "in", opts = {}) => {
  if (!chars?.length) return;

  const base = {
    autoAlpha: direction === "in" ? 1 : 0,
    duration: 0.02,
    ease: "none",
    stagger: { each: 0.04, from: direction === "in" ? "start" : "end" },
    ...opts,
  };

  gsap.fromTo(chars, { autoAlpha: direction === "in" ? 0 : 1 }, base);
};
