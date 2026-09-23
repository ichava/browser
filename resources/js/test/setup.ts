import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement these; the fidelity/motion code touches them.
if (!('animate' in Element.prototype)) {
  // minimal WAAPI stub so MotionEngine.play() doesn't throw under jsdom
  (Element.prototype as unknown as { animate: () => unknown }).animate = () => ({ cancel() {}, pause() {}, play() {} });
}
