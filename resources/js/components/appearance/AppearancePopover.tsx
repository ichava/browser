import { useState } from 'react';

import { useT } from '@js/hooks/useT';
import { Input } from '@js/components/base/input/input';
import { Select } from '@js/components/base/select/select';
import { Glyph } from '@js/components/ui/Glyph';
import { Popover } from '@js/components/ui/Popover';
import { iconBtn, segWrap } from '@js/components/ui/controls';
import { isValidHex } from '@js/core/format';
import { CONFIG_DEFAULTS } from '@js/core/config';
import { LOCALES, type Locale } from '@js/core/i18n';
import { useAppStore } from '@js/hooks/useStoreApi';
import { Slider } from '@js/components/base/slider/slider';

const segChild = (active: boolean) => ({
  height: 22,
  padding: '0 8px',
  border: 'none',
  background: active ? 'var(--pop)' : 'transparent',
  color: active ? 'var(--fg)' : 'var(--muted-fg)',
  borderRadius: 'calc(var(--radius) - 3px)',
  fontSize: 11,
  fontWeight: active ? 600 : 500,
  cursor: 'pointer',
  boxShadow: active ? 'var(--shadow)' : 'none',
});

const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 };
const label: React.CSSProperties = { fontSize: 11.5, fontWeight: 550, color: 'var(--muted-fg)' };

/** Appearance menu: theme · accent · radius · size · density · motion · labels. */
export function AppearancePopover() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const accent = useAppStore((s) => s.accent);
  const setAccent = useAppStore((s) => s.setAccent);
  const radius = useAppStore((s) => s.radius);
  const setRadius = useAppStore((s) => s.setRadius);
  const scale = useAppStore((s) => s.scale);
  const setScale = useAppStore((s) => s.setScale);
  const density = useAppStore((s) => s.density);
  const setDensity = useAppStore((s) => s.setDensity);
  const reduceMotion = useAppStore((s) => s.reduceMotion);
  const toggleReduceMotion = useAppStore((s) => s.toggleReduceMotion);
  const showLabels = useAppStore((s) => s.showLabels);
  const toggleLabels = useAppStore((s) => s.toggleLabels);
  const [hex, setHex] = useState(accent);
  const ACCENTS = useAppStore((s) => s.config?.ui.accentOptions) ?? CONFIG_DEFAULTS.ui.accentOptions;
  const SCALES = useAppStore((s) => s.config?.ui.scaleOptions) ?? CONFIG_DEFAULTS.ui.scaleOptions;
  const radiusRange = useAppStore((s) => s.config?.ranges.radius) ?? CONFIG_DEFAULTS.ranges.radius;
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const t = useT();

  return (
    <Popover
      align="right"
      width={250}
      panelStyle={{ padding: 12 }}
      trigger={(open, toggle) => (
        <button onClick={toggle} title={`${t('appearance.title')} — ${t('appearance.subtitle')}`} style={iconBtn(open)}>
          <Glyph name="palette" color="currentColor" />
        </button>
      )}
    >
      {() => (
        <div className="flex flex-col gap-[11px]">
          <div style={{ ...row, gap: 7, paddingBottom: 2, borderBottom: '1px solid var(--border)' }}>
            <Glyph name="palette" size={12} color="var(--accent-text)" />
            <span className="text-[12px] font-[650]">{t('appearance.title')}</span>
            <span className="text-[10px] text-[var(--faint-fg)]">{t('appearance.subtitle')}</span>
          </div>

          <div style={{ ...row, justifyContent: 'space-between' }}>
            <span style={label}>{t('appearance.theme')}</span>
            <div style={segWrap}>
              <button role="radio" aria-checked={theme === 'light'} onClick={() => setTheme('light')} style={segChild(theme === 'light')}>{t('appearance.light')}</button>
              <button role="radio" aria-checked={theme === 'dark'} onClick={() => setTheme('dark')} style={segChild(theme === 'dark')}>{t('appearance.dark')}</button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span style={label}>{t('appearance.brandAccent')}</span>
            <div className="flex gap-[5px]">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setAccent(c);
                    setHex(c);
                  }}
                  title={c}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: c,
                    border: accent.toLowerCase() === c ? '2px solid var(--fg)' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
            <div style={{ ...row, gap: 6, marginTop: 6 }}>
              <span className="text-[10.5px] text-[var(--muted-fg)] flex-none">{t('appearance.customHex')}</span>
              {/*
               * The design system's own `sm` size, not a compacted override. It is taller
               * than the 24px field it replaces; the lever for that is folding `density`
               * into `--spacing` so every input compacts together, tracked as U9. Fitting
               * this one call site with bespoke padding is what R-P7 set out to remove.
               */}
              <Input
                size="sm"
                value={hex}
                onChange={(v) => {
                  setHex(v);
                  if (isValidHex(v)) setAccent(v);
                }}
                placeholder="#7c3aed"
                aria-label={t('appearance.customHex')}
                inputClassName="font-mono"
                className="min-w-0 flex-1"
              />
              <span style={{ width: 16, height: 16, borderRadius: 5, background: accent, flex: 'none' }} />
            </div>
          </div>

          <div style={row}>
            <span style={label}>{t('appearance.radius')}</span>
            <div className="flex-1">
              <Slider
                minValue={radiusRange.min}
                maxValue={radiusRange.max}
                value={radius}
                onChange={(v) => setRadius(v as number)}
                aria-label={t('appearance.radius')}
                formatOptions={{ style: 'decimal' }}
              />
            </div>
            <span className="font-[family-name:'Geist_Mono',monospace] text-[10.5px] text-[var(--muted-fg)] w-[30px]">{radius}px</span>
          </div>

          <div style={row}>
            <span style={label}>{t('appearance.size')}</span>
            <span className="flex-1" />
            <div style={segWrap}>
              {SCALES.map((sc) => (
                <button key={sc.id} role="radio" aria-checked={scale === sc.id} onClick={() => setScale(sc.id)} style={segChild(scale === sc.id)}>{sc.label}</button>
              ))}
            </div>
          </div>

          <div style={row}>
            <span style={label}>{t('appearance.density')}</span>
            <span className="flex-1" />
            <div style={segWrap}>
              <button role="radio" aria-checked={density === 'compact'} onClick={() => setDensity('compact')} style={segChild(density === 'compact')}>{t('appearance.compact')}</button>
              <button role="radio" aria-checked={density === 'comfy'} onClick={() => setDensity('comfy')} style={segChild(density === 'comfy')}>{t('appearance.comfy')}</button>
            </div>
          </div>

          <div style={row}>
            <span style={label}>{t('appearance.language')}</span>
            <span className="flex-1" />
            {/*
             * The last raw native <select> in the app. react-aria still renders a hidden
             * native one underneath for form submission and mobile pickers, so nothing is
             * lost -- the visible control just stops being the one element that ignored the
             * design system.
             */}
            <Select
              size="sm"
              aria-label={t('appearance.language')}
              items={LOCALES.map((l) => ({ id: l.code, label: l.label }))}
              selectedKey={locale}
              onSelectionChange={(key) => setLocale(key as Locale)}
              className="w-32"
            >
              {(item) => <Select.Item {...item} />}
            </Select>
          </div>

          <Switch label={t('appearance.reduceMotion')} on={reduceMotion} onToggle={toggleReduceMotion} />
          <Switch label={t('appearance.iconLabels')} on={showLabels} onToggle={toggleLabels} />

          <div className="text-[10px] text-[var(--faint-fg)] leading-[1.45]">
            {t('appearance.footer')}
          </div>
        </div>
      )}
    </Popover>
  );
}

function Switch({ label: text, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <div style={row}>
      <span style={label}>{text}</span>
      <span className="flex-1" />
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={on}
        aria-label={text}
        style={{
          width: 34,
          height: 19,
          borderRadius: 10,
          border: 'none',
          background: on ? 'var(--accent)' : 'var(--border)',
          position: 'relative',
          cursor: 'pointer',
          transition: 'background .15s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            insetInlineStart: on ? 17 : 2,
            width: 15,
            height: 15,
            borderRadius: '50%',
            background: '#fff',
            transition: 'inset-inline-start .15s',
            boxShadow: 'var(--shadow)',
          }}
        />
      </button>
    </div>
  );
}
