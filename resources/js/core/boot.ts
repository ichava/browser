// Boot config builder (plan Part D). Assembles the @ichava/bootsplash config from
// the app's `config.boot` block + brand/accent, with sane fallbacks. DATA only —
// the splash's animation/logic lives in the vendored library.

import { mergeConfig, type AppConfig } from './config';

/** Build the bootsplash `.config({...})` object from AppConfig (config-driven). */
export function buildBootConfig(config?: AppConfig | null): Record<string, unknown> {
  const brand = config?.brand ?? { name: 'Ichava', suffix: 'Browser', tagline: '' };
  const accent = config?.defaults?.appearance?.accent ?? '';
  const theme = config?.ui?.defaultTheme ?? 'dark';
  const base: Record<string, unknown> = {
    brand: { name: brand.name, suffix: brand.suffix, tagline: brand.tagline, accent },
    theme,
    variant: 'bar',
    background: 'gradient',
    showPercent: true,
    showStat: true,
    progress: { mode: 'auto', durationMs: 1800, minDisplayMs: 500, timeoutMs: 12000, slowAfterMs: 4500 },
    footer: {
      enabled: true,
      version: `ichava/browser v${config?.meta?.version ?? '1.4.0'}`,
      copyright: config?.about?.copyright ?? '© 2026 Simtabi LLC',
      url: config?.meta?.url ?? 'https://simtabi.com',
    },
    counter: { to: 127262, caption: 'icons indexed' },
  };
  // config.boot (JSON/API) deep-merges over the derived base — the user's source of
  // truth (nested keys like brand.tagline override without dropping siblings).
  return mergeConfig(base, config?.boot ?? {});
}
