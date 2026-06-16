/**
 * Pixel reveal hover effect.
 * Scattered pixel dots "paint in" around the mouse cursor like dithering noise,
 * and fade away when the mouse leaves. No grid — pure pixel chaos.
 */

const CELL_SIZE = 32; // grid cell size (logical unit)
const REVEAL_RADIUS = 110; // how far the effect spreads from cursor (px)
const FADE_SPEED = 0.11; // how fast pixels appear (0–1 per frame)
const DECAY_SPEED = 0.04; // how fast pixels disappear after mouse leaves

export function initSwirlEffects() {
  document.querySelectorAll(".grid__item-image").forEach((el) => {
    if (el._pixelInit) return;
    el._pixelInit = true;
    new PixelEffect(el);
  });
}

class PixelEffect {
  constructor(el) {
    this.el = el;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.style.cssText = `
      position:absolute;inset:0;width:100%;height:100%;
      pointer-events:none;border-radius:inherit;
    `;
    el.style.position = "relative";
    el.style.overflow = "hidden";
    el.appendChild(this.canvas);

    this.mouse = { x: -9999, y: -9999 };
    this.hovering = false;
    this.cells = [];
    this.rafId = null;

    this.resize();
    window.addEventListener("resize", () => this.resize());

    el.addEventListener("mouseenter", (e) => {
      this.hovering = true;
      this.updateMouse(e);
      this.startLoop();
    });
    el.addEventListener("mousemove", (e) => this.updateMouse(e));
    el.addEventListener("mouseleave", () => {
      this.hovering = false;
      this.mouse = { x: -9999, y: -9999 };
    });
  }

  resize() {
    const rect = this.el.getBoundingClientRect();
    this.w = Math.round(rect.width);
    this.h = Math.round(rect.height);
    this.canvas.width = this.w;
    this.canvas.height = this.h;

    this.cols = Math.ceil(this.w / CELL_SIZE);
    this.rows = Math.ceil(this.h / CELL_SIZE);
    this.cells = [];

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        // Each "pixel" is randomly sized (1–5px) and randomly offset within its cell
        // so it never aligns on a uniform grid
        const size =
          Math.random() < 0.2
            ? Math.floor(Math.random() * 6) + 26 // occasional big pixel (26–31px)
            : Math.floor(Math.random() * 8) + 18; // mostly medium (18–25px)

        // Clamp offset so pixel stays within cell bounds
        const maxOff = Math.max(1, CELL_SIZE - size);
        const ox = Math.floor(Math.random() * maxOff);
        const oy = Math.floor(Math.random() * maxOff);

        // Shades of #C3FA95 (r:195, g:250, b:149) — darker mossy to bright lime to washed out
        const shades = [
          [120, 180, 60], // dark mossy
          [150, 210, 80], // mid green
          [195, 250, 149], // base #C3FA95
          [210, 255, 175], // light lime
          [230, 255, 200], // near white-green
        ];
        const pick = shades[Math.floor(Math.random() * shades.length)];
        // Slightly jitter each picked shade for extra variety
        const gr = Math.min(
          255,
          pick[0] + Math.floor((Math.random() - 0.5) * 20),
        );
        const gg = Math.min(
          255,
          pick[1] + Math.floor((Math.random() - 0.5) * 20),
        );
        const gb = Math.min(
          255,
          pick[2] + Math.floor((Math.random() - 0.5) * 20),
        );

        // Wide threshold + per-pixel radius multiplier = jagged, unpredictable scatter
        const threshold = 0.05 + Math.random() * 0.75;
        const radiusMult = 0.4 + Math.random() * 1.2;

        this.cells.push({
          c,
          r,
          alpha: 0,
          ox,
          oy,
          size,
          gr,
          gg,
          gb,
          threshold,
          radiusMult,
        });
      }
    }
  }

  updateMouse(e) {
    const rect = this.el.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
  }

  startLoop() {
    if (this.rafId) return;
    const loop = () => {
      this.update();
      this.draw();

      const anyVisible = this.cells.some((cell) => cell.alpha > 0.005);
      if (!anyVisible && !this.hovering) {
        this.ctx.clearRect(0, 0, this.w, this.h);
        this.rafId = null;
      } else {
        this.rafId = requestAnimationFrame(loop);
      }
    };
    this.rafId = requestAnimationFrame(loop);
  }

  update() {
    const { mouse, hovering } = this;

    this.cells.forEach((cell) => {
      const cx = (cell.c + 0.5) * CELL_SIZE;
      const cy = (cell.r + 0.5) * CELL_SIZE;
      const dx = cx - mouse.x;
      const dy = cy - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const effectiveRadius = REVEAL_RADIUS * cell.radiusMult;
      if (hovering && dist < effectiveRadius) {
        const strength = 1 - dist / effectiveRadius;
        const signal = strength * strength;

        // Only activate if the signal exceeds this pixel's personal threshold
        // — creates dithered, noisy scatter rather than a smooth gradient circle
        const target = signal > cell.threshold ? signal : 0;
        cell.alpha += (target - cell.alpha) * FADE_SPEED;
      } else {
        cell.alpha += (0 - cell.alpha) * DECAY_SPEED;
      }
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.w, this.h);

    this.cells.forEach((cell) => {
      if (cell.alpha < 0.005) return;
      const x = cell.c * CELL_SIZE + cell.ox;
      const y = cell.r * CELL_SIZE + cell.oy;

      this.ctx.fillStyle = `rgba(${cell.gr}, ${cell.gg}, ${cell.gb}, ${cell.alpha})`;
      this.ctx.fillRect(x, y, cell.size, cell.size);
    });
  }
}
