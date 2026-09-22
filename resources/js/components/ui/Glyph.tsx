import type { CSSProperties, FC, SVGProps } from 'react';
import {
  AlertCircle, ArrowDown, ArrowUp, BarChart01, Bell01, Check, ChevronDown, ChevronLeft,
  ChevronRight, ChevronUp, Clock, Command, Copy01, Cube01, Download01, Eye, Folder, Globe01,
  Grid01, Heart, InfoCircle, LayersThree01, Link01, List, Maximize01, Minimize01, Moon01,
  Package, Palette, PauseCircle, PlayCircle, Plus, RefreshCw01, SearchMd, Settings01,
  Sliders01, Stars01, Sun, Trash01, Type01, X, Zap,
} from '@untitledui/icons';
import { assetUrl } from '@js/core/SvgFidelity';

type IconComponent = FC<SVGProps<SVGSVGElement> & { size?: number; color?: string }>;

/**
 * Chrome glyph names → `@untitledui/icons` components.
 *
 * The names are the app's own vocabulary and are the stable API: call sites pass
 * `name`, so swapping the underlying icon set is a change to this table alone. That is
 * what made replacing `lucide-react` a one-file job rather than a 110-site rewrite.
 *
 * Every entry here is REACHED. The previous map declared 58 names of which 15 were
 * never referenced -- dead weight that shipped, because the whole map is imported
 * eagerly. Verified by extracting every quoted token from every `name=` attribute and
 * `icon:` field, which matters more than it sounds: a first pass captured only the
 * first token of `name={theme === 'dark' ? 'sun' : 'moon'}` and reported `sun` as
 * unused. A wrongly-dropped glyph does not error, it renders a blank spacer.
 */
export const GLYPH: Record<string, IconComponent> = {
  'alert-circle': AlertCircle,
  'bell-filled': Bell01,
  check: Check,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  clock: Clock,
  close: X,
  command: Command,
  copy: Copy01,
  cube: Cube01,
  download: Download01,
  eye: Eye,
  folder: Folder,
  globe: Globe01,
  grid: Grid01,
  heart: Heart,
  'heart-filled': Heart,
  info: InfoCircle,
  layers: LayersThree01,
  link: Link01,
  list: List,
  minimize: Minimize01,
  moon: Moon01,
  package: Package,
  palette: Palette,
  pause: PauseCircle,
  play: PlayCircle,
  plus: Plus,
  refresh: RefreshCw01,
  resize: Maximize01,
  search: SearchMd,
  settings: Settings01,
  sliders: Sliders01,
  'sort-asc': ArrowUp,
  'sort-desc': ArrowDown,
  sparkles: Stars01,
  stats: BarChart01,
  sun: Sun,
  text: Type01,
  trash: Trash01,
  zap: Zap,
};

/**
 * Names rendered as a solid fill.
 *
 * Untitled UI icons are stroke-first (`fill="none"`, `stroke=color`), so a filled
 * variant is the same glyph with `fill` set. `heart` and `heart-filled` therefore map
 * to one import and differ only here -- which is why the favourite toggle reads as the
 * same shape in both states rather than two different hearts.
 */
const FILLED = new Set(['bell-filled', 'heart-filled']);

/**
 * Glyph — a chrome icon from the design system's set.
 *
 * Was `Ui`, backed by `lucide-react`. The name changed with the icon set because the
 * old one said nothing; `Glyph` is what it renders.
 *
 * Unknown names render a same-size spacer rather than throwing, so a typo degrades to
 * a gap instead of a blank screen. It warns in development, and `glyphs.test.ts`
 * fails the build on any static name that has no entry, so the silent path is only
 * reachable for a genuinely dynamic name.
 */
export function Glyph({
  name,
  size = 14,
  color,
  style,
  className,
}: {
  name: string;
  size?: number;
  color?: string;
  style?: CSSProperties;
  className?: string;
}) {
  const Icon = GLYPH[name];

  if (!Icon) {
    if (import.meta.env.DEV) console.warn(`[Glyph] unknown glyph "${name}"`);
    return <span aria-hidden style={{ display: 'inline-block', width: size, height: size, flex: 'none', ...style }} />;
  }

  return (
    <Icon
      aria-hidden
      size={size}
      color={color ?? 'currentColor'}
      {...(FILLED.has(name) ? { fill: 'currentColor' } : null)}
      className={className}
      style={{ flex: 'none', ...style }}
    />
  );
}

/**
 * Mask — a monochrome icon painted via CSS mask over an SVG asset, so it always
 * inherits the surrounding `color`.
 *
 * Distinct from `Glyph` and deliberately kept: this renders arbitrary SVGs from
 * `public/assets/`, which is the icon *catalogue*, not the app's chrome. It has no
 * fixed name vocabulary and no design-system equivalent.
 */
export function Mask({
  src,
  size = 14,
  color = 'currentColor',
  style,
}: {
  src: string; // path under public/, e.g. "assets/ui/search.svg"
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  const url = assetUrl(src);
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        flex: 'none',
        backgroundColor: color,
        maskImage: `url("${url}")`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskImage: `url("${url}")`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        ...style,
      }}
    />
  );
}
