// R5. MotionEngine.play() delegates WAAPI execution to @ichava/motion, in one
// of two ways depending on the preset:
//
//  - draw/perChild presets go through @ichava/motion's id-based play(), which
//    looks the id up in ITS OWN registry and animates from ITS OWN generated
//    keyframes -- MotionEngine's copy of those keyframes is never read. Those
//    ids MUST match, or the animation silently plays the wrong thing.
//  - everything else goes through playSpec(), which takes MotionEngine's own
//    preset object directly as data and never consults @ichava/motion's
//    registry at all -- so nothing about that registry's content is relevant
//    to what plays. (glow is a real, deliberate example of why this split
//    matters: it keyframes `var(--accent)` here for the app's theme, vs
//    @ichava/motion's generic `currentColor` -- a difference that is
//    completely harmless because glow is neither draw nor perChild.)
//
// This test therefore only asserts parity for the draw/perChild subset --
// the only ids play() ever looks up in @ichava/motion's own registry.
import { describe, expect, it } from 'vitest';
import IchavaMotion from '@ichava/motion';
import { ILLUSTRATION_PRESETS } from './MotionEngine';

describe('MotionEngine <-> @ichava/motion parity (draw/perChild ids only)', () => {
  const motionPresets = IchavaMotion.presets();

  const delegatedByIdPresets = ILLUSTRATION_PRESETS.filter((p) => p.draw || p.perChild);

  it('generates at least one draw/perChild preset to compare (guards against an empty, vacuously-passing suite)', () => {
    expect(delegatedByIdPresets.length).toBeGreaterThan(10);
  });

  it.each(delegatedByIdPresets.map((p) => [p.id, p] as const))('%s is registered in @ichava/motion with matching keyframes and timing', (id, engine) => {
    const motion = motionPresets[id];
    expect(motion, `@ichava/motion has no preset registered for id "${id}", but MotionEngine.play() looks it up by id for every draw/perChild preset`).toBeDefined();

    expect(motion!.keyframes).toEqual(engine.keyframes);
    expect(motion!.base).toBe(engine.base);
    expect(motion!.direction).toBe(engine.direction ?? 'normal');
    expect(motion!.iterations).toBe(engine.iterations ?? Infinity);
    expect(motion!.once).toBe(!!engine.once);
    expect(motion!.origin).toBe(engine.origin);
    expect(motion!.draw).toBe(!!engine.draw);
    expect(motion!.perChild).toBe(!!engine.perChild);
    expect(motion!.stagger).toBe(engine.stagger);
  });
});
