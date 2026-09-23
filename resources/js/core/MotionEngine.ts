// MotionEngine -- a DATA-DRIVEN preset generator (R5: playback delegates to
// @ichava/motion). ~34 families x 6 variants (+ None + JSON.Custom) ~= 205
// presets -- the reference set. Families/variants/easings are the DATA;
// @ichava/motion is now the LOGIC that plays them. Extensible via register*().

import IchavaMotion from '@ichava/motion';

export type Direction = 'normal' | 'reverse' | 'alternate';

export interface MotionPreset {
  id: string;
  label: string;
  /** base duration (ms) at 1× speed; 0 = no animation (None) */
  base: number;
  keyframes: Keyframe[];
  direction?: Direction;
  /** default iterations — Infinity to loop, 1 for one-shot families */
  iterations?: number;
  /** one-shot family (plays once by default; the preview may override to loop) */
  once?: boolean;
  /** transform-origin applied to the element before animating (swing/pendulum/rock) */
  origin?: string;
  /** true only for the "JSON · Custom" sentinel */
  custom?: boolean;
  /** family id (for grouping / CSS-class mapping) */
  family?: string;
  /** whether this preset works on masked icons (Draw needs inline SVG → false) */
  domOnly?: boolean;
  /** animate the SVG's child layers with a stagger (illustration families) */
  perChild?: boolean;
  /** real stroke-draw: measure child paths + animate stroke-dashoffset */
  draw?: boolean;
  /** per-child delay (ms) for perChild/draw families */
  stagger?: number;
}

interface Family {
  id: string;
  label: string;
  base: number;
  keyframes: (amp: number) => Keyframe[];
  origin?: string;
  once?: boolean;
  /** excluded from the app's masked-icon set (e.g. stroke-draw needs inline paths) */
  domOnly?: boolean;
  /** illustration family: animate child layers with a stagger */
  perChild?: boolean;
  /** real stroke-draw on child paths */
  draw?: boolean;
  /** per-child stagger (ms) */
  stagger?: number;
}

interface Variant {
  suffix: string;
  ampMul: number;
  durMul: number;
  reverse: boolean;
}

const PERSP = 'perspective(400px)';

/** The variant matrix — default + Reverse/Subtle/Bold combinations. */
export const MOTION_VARIANTS: Variant[] = [
  { suffix: '', ampMul: 1, durMul: 1, reverse: false },
  { suffix: ' · Reverse', ampMul: 1, durMul: 1, reverse: true },
  { suffix: ' · Subtle', ampMul: 0.55, durMul: 1.15, reverse: false },
  { suffix: ' · Subtle · Reverse', ampMul: 0.55, durMul: 1.15, reverse: true },
  { suffix: ' · Bold', ampMul: 1.7, durMul: 0.8, reverse: false },
  { suffix: ' · Bold · Reverse', ampMul: 1.7, durMul: 0.8, reverse: true },
];

/** ~34 base families. `amp` scales magnitude (rotate-360 families ignore it). */
export const MOTION_FAMILIES: Family[] = [
  // rotate
  { id: 'spin', label: 'Spin', base: 1400, keyframes: () => [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }] },
  { id: 'spin-y', label: 'Spin Y', base: 1600, keyframes: () => [{ transform: `${PERSP} rotateY(0deg)` }, { transform: `${PERSP} rotateY(360deg)` }] },
  { id: 'spin-z', label: 'Spin Z', base: 1600, keyframes: () => [{ transform: `${PERSP} rotateZ(0deg) rotateX(20deg)` }, { transform: `${PERSP} rotateZ(360deg) rotateX(20deg)` }] },
  { id: 'flip-x', label: 'Flip X', base: 1400, keyframes: () => [{ transform: `${PERSP} rotateX(0deg)` }, { transform: `${PERSP} rotateX(360deg)` }] },
  { id: 'flip-y', label: 'Flip Y', base: 1400, keyframes: () => [{ transform: `${PERSP} rotateY(0deg)` }, { transform: `${PERSP} rotateY(360deg)` }] },
  { id: 'roll', label: 'Roll', base: 1200, keyframes: (a) => [{ transform: `translateX(${-24 * a}%) rotate(${-120 * a}deg)`, opacity: 0.4 }, { transform: 'translateX(0) rotate(0)', opacity: 1 }] },
  { id: 'orbit', label: 'Orbit', base: 2000, keyframes: (a) => [{ transform: `rotate(0deg) translateX(${6 * a}px) rotate(0deg)` }, { transform: `rotate(360deg) translateX(${6 * a}px) rotate(-360deg)` }] },
  // scale
  { id: 'pulse', label: 'Pulse', base: 1200, keyframes: (a) => [{ opacity: 1 }, { opacity: Math.max(0.1, 1 - 0.65 * a) }, { opacity: 1 }] },
  { id: 'heartbeat', label: 'Heartbeat', base: 1000, keyframes: (a) => [{ transform: 'scale(1)' }, { transform: `scale(${1 + 0.18 * a})` }, { transform: 'scale(1)' }, { transform: `scale(${1 + 0.12 * a})` }, { transform: 'scale(1)' }] },
  { id: 'breathe', label: 'Breathe', base: 3000, keyframes: (a) => [{ transform: 'scale(1)' }, { transform: `scale(${1 + 0.08 * a})` }, { transform: 'scale(1)' }] },
  { id: 'zoom-in', label: 'Zoom In', base: 900, once: true, keyframes: (a) => [{ transform: `scale(${1 - 0.4 * a})`, opacity: 0 }, { transform: 'scale(1)', opacity: 1 }] },
  { id: 'zoom-out', label: 'Zoom Out', base: 900, once: true, keyframes: (a) => [{ transform: 'scale(1)', opacity: 1 }, { transform: `scale(${1 + 0.4 * a})`, opacity: 0 }] },
  { id: 'pop', label: 'Pop', base: 500, once: true, keyframes: (a) => [{ transform: 'scale(1)' }, { transform: `scale(${1 + 0.25 * a})` }, { transform: 'scale(1)' }] },
  { id: 'rubber-band', label: 'Rubber Band', base: 900, once: true, keyframes: (a) => [{ transform: 'scale(1,1)' }, { transform: `scale(${1 + 0.25 * a},${1 - 0.25 * a})` }, { transform: `scale(${1 - 0.15 * a},${1 + 0.15 * a})` }, { transform: `scale(${1 + 0.05 * a},${1 - 0.05 * a})` }, { transform: 'scale(1,1)' }] },
  { id: 'jello', label: 'Jello', base: 900, once: true, keyframes: (a) => [{ transform: 'skewX(0deg) skewY(0deg)' }, { transform: `skewX(${-12 * a}deg) skewY(${-12 * a}deg)` }, { transform: `skewX(${6 * a}deg) skewY(${6 * a}deg)` }, { transform: `skewX(${-3 * a}deg) skewY(${-3 * a}deg)` }, { transform: 'skewX(0) skewY(0)' }] },
  { id: 'tada', label: 'Tada', base: 1000, once: true, keyframes: (a) => [{ transform: 'scale(1) rotate(0)' }, { transform: `scale(${1 - 0.1 * a}) rotate(${-3 * a}deg)` }, { transform: `scale(${1 + 0.1 * a}) rotate(${3 * a}deg)` }, { transform: `scale(${1 + 0.1 * a}) rotate(${-3 * a}deg)` }, { transform: 'scale(1) rotate(0)' }] },
  // translate
  { id: 'bounce', label: 'Bounce', base: 900, keyframes: (a) => [{ transform: 'translateY(0)' }, { transform: `translateY(${-22 * a}%)` }, { transform: 'translateY(0)' }] },
  { id: 'float', label: 'Float', base: 2400, keyframes: (a) => [{ transform: 'translateY(0)' }, { transform: `translateY(${-12 * a}%)` }, { transform: 'translateY(0)' }] },
  { id: 'hop', label: 'Hop', base: 800, keyframes: (a) => [{ transform: 'translateY(0) scaleY(1)' }, { transform: 'translateY(0) scaleY(0.86)' }, { transform: `translateY(${-24 * a}%) scaleY(1.05)` }, { transform: 'translateY(0) scaleY(1)' }] },
  { id: 'slide-up', label: 'Slide Up', base: 900, once: true, keyframes: (a) => [{ transform: `translateY(${30 * a}%)`, opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }] },
  { id: 'slide-down', label: 'Slide Down', base: 900, once: true, keyframes: (a) => [{ transform: `translateY(${-30 * a}%)`, opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }] },
  { id: 'slide-left', label: 'Slide Left', base: 900, once: true, keyframes: (a) => [{ transform: `translateX(${30 * a}%)`, opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }] },
  { id: 'slide-right', label: 'Slide Right', base: 900, once: true, keyframes: (a) => [{ transform: `translateX(${-30 * a}%)`, opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }] },
  { id: 'shake-x', label: 'Shake X', base: 600, keyframes: (a) => [{ transform: 'translateX(0)' }, { transform: `translateX(${-3 * a}px)` }, { transform: `translateX(${3 * a}px)` }, { transform: `translateX(${-2 * a}px)` }, { transform: 'translateX(0)' }] },
  { id: 'shake-y', label: 'Shake Y', base: 600, keyframes: (a) => [{ transform: 'translateY(0)' }, { transform: `translateY(${-3 * a}px)` }, { transform: `translateY(${3 * a}px)` }, { transform: `translateY(${-2 * a}px)` }, { transform: 'translateY(0)' }] },
  { id: 'vibrate', label: 'Vibrate', base: 300, keyframes: (a) => [{ transform: 'translate(0,0)' }, { transform: `translate(${-1.5 * a}px,${1.5 * a}px)` }, { transform: `translate(${1.5 * a}px,${-1.5 * a}px)` }, { transform: 'translate(0,0)' }] },
  { id: 'wobble', label: 'Wobble', base: 1000, once: true, keyframes: (a) => [{ transform: 'translateX(0) rotate(0)' }, { transform: `translateX(${-12 * a}%) rotate(${-5 * a}deg)` }, { transform: `translateX(${8 * a}%) rotate(${3 * a}deg)` }, { transform: `translateX(${-4 * a}%) rotate(${-2 * a}deg)` }, { transform: 'translateX(0) rotate(0)' }] },
  // swing (origin: top)
  { id: 'wiggle', label: 'Wiggle', base: 800, keyframes: (a) => [{ transform: 'rotate(0deg)' }, { transform: `rotate(${-11 * a}deg)` }, { transform: `rotate(${11 * a}deg)` }, { transform: 'rotate(0deg)' }] },
  { id: 'swing', label: 'Swing', base: 1000, origin: 'top center', keyframes: (a) => [{ transform: 'rotate(0deg)' }, { transform: `rotate(${15 * a}deg)` }, { transform: `rotate(${-10 * a}deg)` }, { transform: `rotate(${5 * a}deg)` }, { transform: 'rotate(0deg)' }] },
  { id: 'pendulum', label: 'Pendulum', base: 1600, origin: 'top center', keyframes: (a) => [{ transform: `rotate(${-20 * a}deg)` }, { transform: `rotate(${20 * a}deg)` }, { transform: `rotate(${-20 * a}deg)` }] },
  { id: 'rock', label: 'Rock', base: 1200, origin: 'bottom center', keyframes: (a) => [{ transform: 'rotate(0deg)' }, { transform: `rotate(${-8 * a}deg)` }, { transform: `rotate(${8 * a}deg)` }, { transform: 'rotate(0deg)' }] },
  // opacity / filter
  { id: 'fade', label: 'Fade', base: 1400, keyframes: (a) => [{ opacity: Math.max(0, 1 - a) }, { opacity: 1 }] },
  { id: 'blink', label: 'Blink', base: 1000, keyframes: () => [{ opacity: 1 }, { opacity: 1 }, { opacity: 0 }, { opacity: 0 }, { opacity: 1 }] },
  { id: 'flash', label: 'Flash', base: 1000, once: true, keyframes: () => [{ opacity: 1 }, { opacity: 0 }, { opacity: 1 }, { opacity: 0 }, { opacity: 1 }] },
  { id: 'glow', label: 'Glow', base: 1600, keyframes: (a) => [{ filter: 'drop-shadow(0 0 0 var(--accent))' }, { filter: `drop-shadow(0 0 ${5 * a}px var(--accent))` }, { filter: 'drop-shadow(0 0 0 var(--accent))' }] },
  // stroke (inline-SVG only — excluded from the app's masked-icon set)
  { id: 'draw', label: 'Draw', base: 1400, once: true, domOnly: true, draw: true, stagger: 120, keyframes: () => [{ strokeDashoffset: 1 } as unknown as Keyframe, { strokeDashoffset: 0 } as unknown as Keyframe] },
];

/** Illustration families — animate an SVG's child layers (offered only for illustrations). */
export const ILLUSTRATION_FAMILIES: Family[] = [
  { id: 'reveal', label: 'Reveal', base: 700, once: true, perChild: true, stagger: 90, keyframes: (a) => [{ opacity: 0, transform: `translateY(${14 * a}px)` }, { opacity: 1, transform: 'translateY(0)' }] },
  { id: 'cascade', label: 'Cascade', base: 700, once: true, perChild: true, stagger: 110, keyframes: (a) => [{ opacity: 0, transform: `scale(${1 - 0.3 * a})` }, { opacity: 1, transform: 'scale(1)' }] },
  { id: 'assemble', label: 'Assemble', base: 800, once: true, perChild: true, stagger: 90, keyframes: (a) => [{ opacity: 0, transform: `translateX(${-18 * a}px) rotate(${-8 * a}deg)` }, { opacity: 1, transform: 'translateX(0) rotate(0)' }] },
  { id: 'parallax', label: 'Parallax', base: 2600, perChild: true, stagger: 160, keyframes: (a) => [{ transform: 'translateY(0)' }, { transform: `translateY(${-7 * a}px)` }, { transform: 'translateY(0)' }] },
];

const NONE: MotionPreset = { id: 'none', label: 'None', base: 0, keyframes: [] };
const JSON_CUSTOM: MotionPreset = { id: 'json', label: 'JSON · Custom ✦', base: 0, keyframes: [], custom: true };

function makePreset(f: Family, v: Variant): MotionPreset {
  const kf = f.keyframes(v.ampMul);
  return {
    id: `${f.id}${v.suffix ? '-' + v.suffix.replace(/[·\s]+/g, '').toLowerCase() : ''}`,
    label: `${f.label}${v.suffix}`,
    base: Math.round(f.base * v.durMul),
    keyframes: kf,
    direction: v.reverse ? 'reverse' : 'normal',
    iterations: f.once ? 1 : Infinity,
    once: f.once,
    origin: f.origin,
    family: f.id,
    domOnly: f.domOnly,
    perChild: f.perChild,
    draw: f.draw,
    stagger: f.stagger,
  };
}

/** Build the full preset list from the current families/variants. */
export function buildPresets(opts: { includeDomOnly?: boolean } = {}): MotionPreset[] {
  const out: MotionPreset[] = [NONE, JSON_CUSTOM];
  for (const f of MOTION_FAMILIES) {
    if (f.domOnly && !opts.includeDomOnly) continue; // Draw is inline-SVG only (masked icons can't stroke-animate)
    for (const v of MOTION_VARIANTS) out.push(makePreset(f, v));
  }
  return out;
}

/** App-facing preset list (excludes Draw — the app renders masked icons). */
export const MOTION_PRESETS: MotionPreset[] = buildPresets();

/** Illustration preset list — the layered families + real Draw, for kind:"illustration". */
export const ILLUSTRATION_PRESETS: MotionPreset[] = [
  NONE,
  JSON_CUSTOM,
  ...ILLUSTRATION_FAMILIES.flatMap((f) => MOTION_VARIANTS.map((v) => makePreset(f, v))),
  ...MOTION_FAMILIES.filter((f) => f.draw).flatMap((f) => MOTION_VARIANTS.map((v) => makePreset(f, v))),
];

/** Register a custom family/variant so the generated set grows without editing core. */
export function registerFamily(family: Family): void {
  MOTION_FAMILIES.push(family);
}
export function registerVariant(variant: Variant): void {
  MOTION_VARIANTS.push(variant);
}

// ─── Easings (extensible + custom) ───────────────────────────────────────────
// `spring`/`back`/`elastic`/`bounce` are cubic-bezier approximations; the VALUE
// (never the word) is what WAAPI receives. Order matches the reference dropdown.
export const EASINGS = [
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'cubic-bezier(.34,1.56,.64,1)', // spring
  'cubic-bezier(.68,-.55,.27,1.55)', // back
  'steps(8)',
  'cubic-bezier(.55,.06,.68,.19)', // ease-in-quad-ish (extra)
  'cubic-bezier(.22,.61,.36,1)', // ease-out-cubic (extra)
] as const;
export type Easing = string;

export const EASING_LABEL: Record<string, string> = {
  linear: 'linear',
  ease: 'ease',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
  'cubic-bezier(.34,1.56,.64,1)': 'spring',
  'cubic-bezier(.68,-.55,.27,1.55)': 'back',
  'steps(8)': 'steps(8)',
  'cubic-bezier(.55,.06,.68,.19)': 'ease-in-quad',
  'cubic-bezier(.22,.61,.36,1)': 'ease-out-cubic',
};

const customEasings: Record<string, string> = {};
export function registerEasing(name: string, value: string): void {
  customEasings[name] = value;
  EASING_LABEL[value] = name;
}
/** Validate a raw cubic-bezier(...) / steps(...) / named easing before handing to WAAPI. */
export function isValidEasing(v: string): boolean {
  return /^(linear|ease(-in|-out|-in-out)?|step-(start|end)|steps\([^)]+\)|cubic-bezier\(\s*-?\d*\.?\d+\s*(,\s*-?\d*\.?\d+\s*){3}\))$/.test(v.trim()) || v in customEasings;
}

/** Map a 0–100 slider to a 0.25×–4× logarithmic speed multiplier. */
export function sliderToSpeed(v: number): number {
  return Math.pow(4, (v - 50) / 50);
}
export function speedLabel(mult: number): string {
  return `${mult.toFixed(mult < 1 ? 2 : mult < 10 ? 1 : 0)}×`;
}

export interface PlayOptions {
  speed: number;
  easing: Easing;
  delay?: number;
  /** override the preset's default iterations (e.g. loop a one-shot in the preview) */
  iterations?: number;
}

/**
 * WAAPI execution delegates to `@ichava/motion` (R5) instead of reimplementing it a
 * second time. This file keeps the DATA layer -- the typed `MotionPreset`s, the
 * `MOTION_PRESETS`/`ILLUSTRATION_PRESETS` picker lists, easings, register*() -- because
 * `@ichava/motion` has no concept of "masked vs inline-SVG icon" (`domOnly`) or of a
 * typed preset catalog for a UI dropdown. Only the part that was a second copy of the
 * same keyframe-generation-and-play logic moves.
 *
 * Delegating by PRESET ID, not by passing the computed spec, is deliberate: only
 * `@ichava/motion`'s id-based `play()` routes `perChild`/`draw` families to its
 * per-child-staggered players (`playSpec()` animates one element only). This is safe
 * for every id `buildPresets()` generates from the built-in `MOTION_FAMILIES`/
 * `ILLUSTRATION_FAMILIES` below, because that generation is deliberately mirrored
 * 1:1 with `@ichava/motion`'s own (proven in MotionEngine.parity.test.ts, which
 * fails if either package's keyframe math drifts from the other's). It is NOT
 * guaranteed for a draw/perChild family added later via `registerFamily()` --
 * nothing currently calls that API, but a caller who does and registers one
 * would see `IchavaMotion.play()` silently no-op (return null, not throw) for
 * an id its own registry has never heard of.
 *
 * The one id that is NOT in `@ichava/motion`'s registry is `'json'` -- the "JSON ·
 * Custom" sentinel, whose `keyframes` come from what the user pasted into the detail
 * dialog rather than from either package's generator. It is never `perChild`/`draw`
 * (see the NONE/JSON_CUSTOM constants above), so it never reaches the id-based branch;
 * `playSpec()` plays its keyframes directly, by value, with no id lookup at all.
 */
export function play(el: Element, preset: MotionPreset, opts: PlayOptions): Animation | null {
  if (preset.keyframes.length === 0 || preset.base === 0) return null;

  const motionOpts = { speed: opts.speed, easing: opts.easing, delay: opts.delay, iterations: opts.iterations };

  if (preset.draw || preset.perChild) {
    return IchavaMotion.play(el, preset.id, motionOpts);
  }

  return IchavaMotion.playSpec(el, preset, motionOpts);
}
