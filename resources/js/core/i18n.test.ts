import { describe, expect, it } from 'vitest';
import { translate, registerTranslations, localeDir, LOCALES, MESSAGES } from './i18n';

describe('i18n', () => {
  it('resolves a key in the requested locale', () => {
    expect(translate('es', 'common.cancel')).toBe('Cancelar');
    expect(translate('fr', 'header.settings')).toBe('Paramètres');
  });

  it('falls back to English, then the key itself', () => {
    // a real key missing from a sparse locale falls back to English
    expect(translate('ar', 'common.copy')).toBe('نسخ');
    expect(translate('en', 'no.such.key')).toBe('no.such.key');
    expect(translate('de', 'no.such.key')).toBe('no.such.key');
  });

  it('interpolates {vars}', () => {
    expect(translate('en', 'toolbar.selected', { n: 3 })).toBe('3 selected');
    expect(translate('es', 'shared.count', { n: 2 })).toBe('2 compartidas');
  });

  it('merges server-provided translations (Laravel sync)', () => {
    registerTranslations('en', { 'common.cancel': 'Dismiss' });
    expect(translate('en', 'common.cancel')).toBe('Dismiss');
    registerTranslations('en', { 'common.cancel': 'Cancel' }); // restore
  });

  it('marks Arabic RTL and everything else LTR', () => {
    expect(localeDir('ar')).toBe('rtl');
    expect(localeDir('en')).toBe('ltr');
    expect(LOCALES.map((l) => l.code)).toContain('sw');
  });

  // Full key parity: every English key must exist in every advertised locale, so
  // no chrome silently falls back to English. Guards future missing translations.
  it('has every English key in all 7 locales', () => {
    const enKeys = Object.keys(MESSAGES.en);
    expect(enKeys.length).toBeGreaterThan(300);
    for (const { code } of LOCALES) {
      const missing = enKeys.filter((k) => !(k in MESSAGES[code]));
      expect(missing, `locale "${code}" is missing keys: ${missing.slice(0, 10).join(', ')}`).toHaveLength(0);
    }
  });

  // No locale carries a stale key that English dropped (dead-key guard).
  it('has no extra keys beyond the English set in any locale', () => {
    const enKeys = new Set(Object.keys(MESSAGES.en));
    for (const { code } of LOCALES) {
      const extra = Object.keys(MESSAGES[code]).filter((k) => !enKeys.has(k));
      expect(extra, `locale "${code}" has stale keys: ${extra.slice(0, 10).join(', ')}`).toHaveLength(0);
    }
  });

  // Interpolation placeholders must match across locales so {n}/{name}/… never
  // render literally in a translation.
  it('keeps the same {placeholders} in every locale', () => {
    const ph = (s: string) => (s.match(/\{[a-zA-Z]+\}/g) ?? []).sort().join(',');
    for (const key of Object.keys(MESSAGES.en)) {
      const en = ph(MESSAGES.en[key]!);
      if (!en) continue;
      for (const { code } of LOCALES) {
        if (code === 'en') continue;
        const val = MESSAGES[code][key];
        if (val === undefined) continue;
        expect(ph(val), `"${key}" [${code}] placeholders differ from en`).toBe(en);
      }
    }
  });
});
