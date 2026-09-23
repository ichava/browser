// Config shape + defaults for <Bootsplash>. Mirrors the vendored @ichava/bootsplash
// v2.1.0 engine's DEFAULTS object field-for-field (R7) -- BootGate's buildBootConfig()
// output, and any config.boot JSON a host supplies, both merge over this the same way
// they merged over the vendored library's DEFAULTS.
//
// Not reproduced: data-* attribute config (fromDataset in the original). The vendored
// library reads that off its mount target for framework-free embedding; this component
// is always configured programmatically by BootGate, and nothing in this app ever sets
// data-* attributes on document.body, so that input channel is unreachable here.

export type BootVariant = 'bar' | 'ring' | 'steps' | 'dots' | 'counter' | 'tree';
export type BootTheme = 'dark' | 'light' | 'auto';
export type BootBackground = 'gradient' | 'solid' | 'dots' | 'aurora';
export type BootLayout = 'center' | 'corner' | 'corner-tr' | 'left' | 'right' | 'top' | 'bottom';
export type BootAlign = 'center' | 'left' | 'right';
export type BootNoticePosition = 'top' | 'bottom' | 'center' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type BootLogoType = 'svg' | 'image' | 'emoji' | 'initials';

export interface BootTaskDef {
  id: string;
  label: string;
  /** leaf-only: relative share of the progress curve */
  weight?: number;
  /** leaf-only: displayed instead of an elapsed-time readout once done */
  stat?: string;
  /** leaf-only: live stats-strip increments applied when this task completes */
  add?: Record<string, number>;
  children?: BootTaskDef[];
}

export interface BootStatDef {
  key: string;
  label: string;
  to: number;
}

export interface BootConfig {
  brand: { name: string; suffix: string; tagline: string; accent: string; logo: { type: BootLogoType; value: string } };
  theme: BootTheme;
  variant: BootVariant;
  layout: BootLayout;
  align: BootAlign;
  background: BootBackground;
  source: 'config' | 'endpoint' | 'both';
  endpoint: string;
  holdOnComplete: boolean;
  reveal: { target: string; url: string; mode: 'crossfade' };
  progress: { mode: 'auto' | 'indeterminate'; durationMs: number; minDisplayMs: number; timeoutMs: number; slowAfterMs: number };
  tasks: BootTaskDef[];
  messages: string[];
  stats: BootStatDef[];
  tips: { enabled: boolean; intervalMs: number; items: string[] };
  footer: { enabled: boolean; version: string; copyright: string; env: string; url: string; contact: string };
  counter: { to: number; caption: string };
  showPercent: boolean;
  showStat: boolean;
  showStats: boolean;
  showCancel: boolean;
  reduceMotion: boolean;
  rtl: boolean;
  contextColors: boolean;
  maxVisible: number;
  persist: { enabled: boolean; key: string; fields: Array<'theme' | 'variant' | 'layout' | 'align'> };
  notice: { position: BootNoticePosition };
  statText?: string;
  i18n: { retry: string; replay: string; cancel: string; ready: string; offline: string; slow: string; error: string };
}

export const BOOT_DEFAULTS: BootConfig = {
  brand: { name: 'Ichava', suffix: 'Browser', tagline: '', accent: '', logo: { type: 'svg', value: '' } },
  theme: 'dark',
  variant: 'bar',
  layout: 'center',
  align: 'center',
  background: 'gradient',
  source: 'config',
  endpoint: '',
  holdOnComplete: false,
  reveal: { target: '', url: '', mode: 'crossfade' },
  progress: { mode: 'auto', durationMs: 3400, minDisplayMs: 500, timeoutMs: 12000, slowAfterMs: 4500 },
  tasks: [
    { id: 'env', label: 'Environment', children: [
      { id: 'csrf', label: 'Acquire CSRF token', weight: 1 },
      { id: 'session', label: 'Restore session', weight: 1 },
    ] },
    { id: 'catalog', label: 'Icon catalog', children: [
      { id: 'manifest', label: 'Fetch pack manifest', weight: 1 },
      { id: 'tabler', label: 'tabler-icons', weight: 3, stat: '6,146', add: { icons: 6146, packages: 1 } },
      { id: 'metronic', label: 'metronic-icons', weight: 2, stat: '2,000', add: { icons: 2000, packages: 1 } },
      { id: 'flags', label: 'flag-icons', weight: 1, stat: '540', add: { icons: 540, packages: 1 } },
    ] },
    { id: 'index', label: 'Indexing', children: [
      { id: 'cats', label: 'Categories', weight: 1, add: { categories: 84 } },
      { id: 'search', label: 'Search index', weight: 2 },
    ] },
    { id: 'workspace', label: 'Workspace', children: [
      { id: 'prefs', label: 'Preferences', weight: 1 },
      { id: 'favs', label: 'Favorites & collections', weight: 1 },
    ] },
  ],
  messages: ['Connecting to catalog', 'Loading icon packs', 'Indexing categories', 'Restoring workspace', 'Finalizing'],
  stats: [
    { key: 'icons', label: 'Icons', to: 8686 },
    { key: 'packages', label: 'Packages', to: 3 },
    { key: 'categories', label: 'Categories', to: 84 },
  ],
  tips: { enabled: false, intervalMs: 3200, items: [
    'Press ⌘K anywhere to open the command palette.',
    'Icons inherit currentColor — theme them with one CSS variable.',
    'Star an icon to add it to your Favorites.',
  ] },
  footer: { enabled: true, version: 'v2.1.0', copyright: `© ${new Date().getFullYear()} Simtabi LLC`, env: '', url: 'https://simtabi.com', contact: 'hello@simtabi.com' },
  counter: { to: 127262, caption: 'icons indexed' },
  showPercent: true,
  showStat: true,
  showStats: false,
  showCancel: false,
  reduceMotion: false,
  rtl: false,
  contextColors: true,
  maxVisible: 4,
  persist: { enabled: false, key: 'ichava.bootsplash', fields: ['theme', 'variant', 'layout', 'align'] },
  notice: { position: 'top' },
  i18n: { retry: 'Retry', replay: 'Replay', cancel: 'Skip', ready: 'Ready', offline: "You're offline — waiting for a connection…", slow: 'Still working — this is taking longer than usual…', error: "Couldn't reach the icon catalog. Check your connection." },
};

/** Every leaf task (children flattened out), in document order. */
export function leaves(tasks: BootTaskDef[]): BootTaskDef[] {
  const out: BootTaskDef[] = [];
  const walk = (list: BootTaskDef[]) => {
    for (const t of list) {
      if (t.children && t.children.length) walk(t.children);
      else out.push(t);
    }
  };
  walk(tasks);
  return out;
}

export function totalWeight(ls: BootTaskDef[]): number {
  return ls.reduce((a, t) => a + (t.weight ?? 1), 0) || 1;
}
