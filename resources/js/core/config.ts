// Config contract (plan: Configuration architecture — no hardcoding).
// One typed contract sourced from JSON (app-config.json) and/or the REST config
// endpoint, with code fallbacks defined ONCE here so duplicated literals can't
// drift. DATA lives in config; LOGIC (keyframes, snippet generators, CSS math)
// stays in code. Every block is optional at the wire level; `resolveConfig`
// deep-merges a partial onto `CONFIG_DEFAULTS` so a missing key never breaks.

import type { CopyFormat, Scale as ScaleT } from './types';

export type { ScaleT };

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';
export type AppEnv = 'production' | 'development';

export interface Workspace {
  id: string;
  name: string;
  plan: string;
  active: boolean;
}
export interface TeamMember {
  initials: string;
  name: string;
  online: boolean;
  /** online | away | offline — falls back to online?online:offline */
  status?: 'online' | 'away' | 'offline';
}

export interface FeatureFlags {
  devtools: boolean;
  collections: boolean;
  history: boolean;
  motion: boolean;
  treatments: boolean;
  multiSelect: boolean;
  presence: boolean;
  /**
   * Development fixtures: the sample signed-in user, seeded collections with
   * fabricated collaborators, and the seeded notification feed.
   *
   * Defaults to FALSE. The standalone dev app turns it on in
   * `public/data/app-config.json`; a host embedding the browser simply omits it
   * and gets a neutral product with no invented data. Keeping the switch in one
   * place is the point -- the alternative is auditing every call site at port
   * time.
   *
   * This flag does NOT gate a real feature. Nothing behind it may ever become a
   * substitute for the host's own auth or data.
   */
  demo: boolean;
}

export interface AppConfig {
  meta: { version: string; author: string; sets: number; license: string; url: string };
  seo: { title: string; description: string; ogImage?: string; canonical?: string };
  env: AppEnv | null;
  debug: { enabled: boolean | null; logLevel: LogLevel };
  features: FeatureFlags;
  brand: { name: string; suffix: string; tagline: string };
  user: { mode: string; name: string; email: string; initials: string; plan: string; workspaces: Workspace[] };
  team: TeamMember[];
  ui: {
    defaultTheme: 'light' | 'dark';
    scale: ScaleT;
    density: 'compact' | 'comfy';
    accentOptions: string[];
    perPageOptions: number[];
    scaleOptions: { id: ScaleT; label: string }[];
    baseFontSize: number;
    avatarPalette: string[];
  };
  defaults: {
    packages: string[];
    perPage: number;
    sortBy: 'name' | 'package' | 'category';
    sortOrder: 'asc' | 'desc';
    appearance: { theme: 'light' | 'dark'; accent: string; radius: number; scale: ScaleT; density: 'compact' | 'comfy'; reduceMotion: boolean; showLabels: boolean };
    render: { size: number; sizeUnit: 'px' | 'rem' | 'em'; gridStroke: number; color: string | null; treatment: string; copyFormat: CopyFormat };
    collections: { id: string; name: string; icons: number[]; shared?: boolean; role?: 'editor' | 'viewer'; sharedWith?: { initials: string; name: string }[] }[];
  };
  ranges: {
    size: { min: number; max: number; step: number };
    stroke: { min: number; max: number; step: number };
    radius: { min: number; max: number };
  };
  limits: { historyCap: number; recentCommandsCap: number; paletteIconResults: number; logBuffer: number };
  toolbar: {
    sortOptions: { id: string; label: string }[];
    treatments: { id: string; label: string; desc: string }[];
    sizeUnits: string[];
    copyFormats: { id: CopyFormat; label: string }[];
    exportFormats: { id: string; label: string; desc: string; icon?: string }[];
  };
  about: { description: string; creditsTitle: string; copyright: string; creditsMarqueeSec: number; credits: { name: string; author: string; license: string }[]; links: { label: string; href: string }[]; stats: { key: string; label: string }[] };
  /** i18n metadata. The Laravel backend may serve `available` locales + an `endpoint`
   *  returning `{ [locale]: { key: value } }` overrides merged via registerTranslations. */
  i18n: { locale: string; available: string[]; endpoint?: string };
  storageKeys: { persist: string; driver: string; paletteRecent: string; locale: string };
  /** @ichava/bootsplash config block (Part D). Framework-agnostic; passed to .config(). */
  boot: Record<string, unknown>;
  storage: { frontendDriver: 'local' | 'session'; laravelDriver?: string };
}

export type PartialConfig = DeepPartial<AppConfig>;
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? (T[K] extends unknown[] ? T[K] : DeepPartial<T[K]>) : T[K] };

const YEAR = 2026;

/** The single source of truth for every default DATA value. */
export const CONFIG_DEFAULTS: AppConfig = {
  meta: { version: '1.4.0', author: 'Imani Manyara', sets: 70, license: 'MIT', url: 'https://simtabi.com' },
  seo: {
    title: 'Ichava Browser — every icon your Laravel app needs',
    description: '127,000+ SVG icons from 70+ open-source sets. Search, restyle, animate and copy — visual browser, REST API and Blade components for Laravel.',
  },
  env: null,
  debug: { enabled: null, logLevel: 'debug' },
  features: { devtools: true, collections: true, history: true, motion: true, treatments: true, multiSelect: true, presence: true, demo: false },
  brand: { name: 'Ichava', suffix: 'Browser', tagline: '' },
  // Neutral by design. The sample user lives in public/data/app-config.json
  // behind features.demo, not here -- these are the product's defaults, and a
  // host embedding the browser must not inherit an invented identity.
  user: { mode: 'guest', name: '', email: '', initials: '', plan: '', workspaces: [] },
  team: [],
  ui: {
    defaultTheme: 'light',
    scale: 'm',
    density: 'compact',
    accentOptions: ['#7c3aed', '#2563eb', '#059669', '#e11d48', '#ea580c'],
    perPageOptions: [30, 60, 120, 240],
    scaleOptions: [
      { id: 'xs', label: 'XS' },
      { id: 's', label: 'S' },
      { id: 'm', label: 'M' },
      { id: 'l', label: 'L' },
    ],
    baseFontSize: 13.5,
    avatarPalette: ['#7c3aed', '#0891b2', '#059669', '#e11d48', '#ea580c'],
  },
  defaults: {
    // The real Composer packages, and only those. This previously named
    // ichava/ui-icons and ichava/test-icons, neither of which exists on
    // Packagist or in this workspace, so the shipped default filter referenced
    // packages that cannot be installed.
    //
    // Do NOT set this to [] expecting "all packages". Two layers disagree about
    // an empty list and the disagreement is silent: IconRepository.matches skips
    // the package filter entirely and passes every icon, while AppContent gates
    // on `filters.packages.length === 0` and renders the pack-picker onboarding
    // state instead of a grid. Empty therefore shows no icons, not all of them.
    //
    // Also note this list is the ONLY source of the initial package selection.
    // `defaults.packages` in app-config.json is fetched after the store has
    // already initialised from here, and setConfig does not re-apply it, so the
    // JSON value is inert. That precedence gap is fixed with the data layer.
    packages: ['ichava/tabler-icons', 'ichava/bundled-icons', 'ichava/flag-icons', 'ichava/metronic-icons', 'ichava/emoji-sets'],
    perPage: 60,
    sortBy: 'name',
    sortOrder: 'asc',
    appearance: { theme: 'light', accent: '#7c3aed', radius: 8, scale: 'm', density: 'compact', reduceMotion: false, showLabels: true },
    render: { size: 48, sizeUnit: 'px', gridStroke: 1.5, color: null, treatment: 'default', copyFormat: 'svg' },
    // Seeded collections are demo fixtures, not defaults. See features.demo.
    collections: [],
  },
  ranges: {
    size: { min: 16, max: 1024, step: 16 },
    stroke: { min: 0.5, max: 3, step: 0.25 },
    radius: { min: 0, max: 14 },
  },
  limits: { historyCap: 40, recentCommandsCap: 5, paletteIconResults: 6, logBuffer: 300 },
  toolbar: {
    sortOptions: [
      { id: 'name', label: 'Name' },
      { id: 'package', label: 'Package' },
      { id: 'category', label: 'Category' },
    ],
    treatments: [
      { id: 'default', label: 'Stroke', desc: 'Original pack strokes' },
      { id: 'solid', label: 'Solid', desc: 'Bolder, filled weight' },
      { id: 'duotone', label: 'Dual tone', desc: 'Accent shadow layer' },
      { id: 'midtone', label: 'Midtone', desc: 'Softened 50% ink' },
      { id: 'halftone', label: 'Halftone', desc: 'Retro dot-matrix fill' },
    ],
    sizeUnits: ['px', 'rem', 'em'],
    copyFormats: [
      { id: 'svg', label: 'Raw SVG' },
      { id: 'blade', label: 'Blade tag' },
      { id: 'vue', label: 'Vue snippet' },
      { id: 'name', label: 'Icon name' },
    ],
    exportFormats: [
      { id: 'files', label: 'SVG files', desc: 'Individual .svg downloads', icon: 'cube' },
      { id: 'sprite', label: 'SVG sprite', desc: 'One <symbol> sheet', icon: 'stats' },
      { id: 'manifest', label: 'JSON manifest', desc: 'ids, packs & categories', icon: 'text' },
      { id: 'zip', label: 'ZIP bundle', desc: 'Sprite + manifest + files', icon: 'download' },
    ],
  },
  about: {
    description: 'An icon engine for Laravel: 127,000+ SVG icons with a visual browser, REST API and Blade components.',
    creditsTitle: 'OPEN SOURCE CREDITS',
    copyright: `© ${YEAR} Simtabi LLC`,
    creditsMarqueeSec: 22,
    credits: [
      { name: 'Tabler Icons', author: 'Paweł Kuna', license: 'MIT' },
      { name: 'Lucide', author: 'Lucide Contributors', license: 'ISC' },
      { name: 'Heroicons', author: 'Tailwind Labs', license: 'MIT' },
      { name: 'Feather', author: 'Cole Bemis', license: 'MIT' },
      { name: 'Bootstrap Icons', author: 'The Bootstrap Authors', license: 'MIT' },
      { name: 'Font Awesome', author: 'Fonticons, Inc.', license: 'CC BY 4.0' },
      { name: 'Boxicons', author: 'Aniket Suvarna', license: 'MIT' },
      { name: 'Phosphor Icons', author: 'Helena Zhang & Tobias Fried', license: 'MIT' },
      { name: 'Remix Icon', author: 'Remix Design', license: 'Apache-2.0' },
      { name: 'Material Symbols', author: 'Google', license: 'Apache-2.0' },
      { name: 'Metronic Icons', author: 'Keenthemes', license: 'Commercial' },
      { name: 'Flag Icons', author: 'Panayiotis Lipiridis', license: 'MIT' },
      { name: 'Twemoji', author: 'Twitter, Inc.', license: 'CC BY 4.0' },
    ],
    links: [
      { label: 'simtabi.com', href: 'https://simtabi.com' },
      { label: 'Docs', href: 'https://opensource.simtabi.com/documentation/ichava/browser/' },
      { label: 'Icon packs', href: 'https://opensource.simtabi.com/products/ichava/browser' },
      { label: 'GitHub', href: 'https://github.com/ichava/browser' },
    ],
    stats: [
      { key: 'indexed', label: 'icons indexed' },
      { key: 'sets', label: 'icon sets' },
      { key: 'license', label: 'license' },
    ],
  },
  i18n: { locale: 'en', available: ['en', 'es', 'fr', 'de', 'pt', 'sw', 'ar'] },
  storageKeys: { persist: 'ichava.browser.v2', driver: 'ichava.browser.driver', paletteRecent: 'ichava.palette.recent', locale: 'ichava.locale' },
  boot: {},
  storage: { frontendDriver: 'local', laravelDriver: 'session' },
};

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Deep-merge a partial config onto another (arrays replace, objects merge). */
export function mergeConfig<T>(base: T, over: unknown): T {
  if (over === undefined) return base;
  if (Array.isArray(over)) return over as T;
  if (isObj(over) && isObj(base)) {
    const out: Record<string, unknown> = { ...base };
    for (const k of Object.keys(over)) out[k] = mergeConfig((base as Record<string, unknown>)[k], (over as Record<string, unknown>)[k]);
    return out as T;
  }
  return (over as T) ?? base;
}

/** Resolve a wire-partial config onto the defaults → a complete typed AppConfig. */
export function resolveConfig(partial: PartialConfig | null | undefined): AppConfig {
  return mergeConfig(CONFIG_DEFAULTS, partial ?? {});
}
