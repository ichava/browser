// Inline icon paths, transcribed verbatim from the vendored engine's ICON map
// (R7) -- same viewBox/stroke attributes as its svg() helper.
const PATHS = {
  layers: 'M12 2 2 7l10 5 10-5-10-5Z|m2 17 10 5 10-5|m2 12 10 5 10-5',
  spin: 'M21 12a9 9 0 1 1-6.219-8.56',
  check: 'M20 6 9 17l-5-5',
  x: 'M18 6 6 18M6 6l12 12',
  alert: 'M12 8v4M12 16h.01',
  clock: 'M12 6v6l4 2',
  offline: 'M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01',
  replay: 'M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.4 2.6L3 8|M3 3v5h5',
  tip: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z',
} as const;
const CIRCLE = { alert: { cx: 12, cy: 12, r: 10 }, clock: { cx: 12, cy: 12, r: 10 } } as const;

export type IconName = keyof typeof PATHS;

// `spin` emits `ichbs__spin`, matching the vendored svg() helper's own class name
// exactly -- which bootsplash.css never actually styles (only `.ichbs__step-spin`/
// `.ichbs__node-spin` carry the keyframe, and nothing ever applies THOSE to an
// icon). The original's spin icons were already static; reproduced as-is for
// parity rather than silently fixed, since that would be an unrequested behaviour
// change.
export function BootIcon({ name, spin, className }: { name: IconName; spin?: boolean; className?: string }) {
  const cx = CIRCLE[name as keyof typeof CIRCLE];
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={[spin ? 'ichbs__spin' : '', className].filter(Boolean).join(' ') || undefined}
      aria-hidden="true"
    >
      {cx && <circle cx={cx.cx} cy={cx.cy} r={cx.r} />}
      {PATHS[name].split('|').map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
