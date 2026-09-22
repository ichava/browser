import { useState } from 'react';
import { Input } from '@js/components/base/input/input';
import { hslToHex, isValidHex, hexWithAlpha } from '@js/core/format';
import { useT } from '@js/hooks/useT';

const SWATCHES = ['#09090b', '#71717a', '#7c3aed', '#2563eb', '#059669', '#e11d48', '#ea580c', '#0891b2'];

/**
 * ColorPicker — hue/lightness sliders + swatches + hex + alpha, no native OS
 * picker (mockup ColorEngine, condensed). `value=null` means "themed"
 * (currentColor); picking a swatch/hex sets an explicit preview color.
 */
export function ColorPicker({ value, onChange }: { value: string | null; onChange: (c: string | null) => void }) {
  const [hue, setHue] = useState(265);
  const [light, setLight] = useState(50);
  const [alpha, setAlpha] = useState(100);
  const [hex, setHex] = useState(value ?? '#7c3aed');
  const t = useT();

  const mid = hslToHex(hue, 50);
  const emit = (base6: string, a: number) => onChange(a >= 100 ? base6 : hexWithAlpha(base6, a));
  const apply = (h: number, l: number) => {
    const c = hslToHex(h, l);
    setHex(c);
    emit(c, alpha);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-semibold text-[var(--muted-fg)]">{t('color.previewColor')}</span>
        <button
          onClick={() => onChange(null)}
          style={{ border: 'none', background: 'none', color: value ? 'var(--accent)' : 'var(--faint-fg)', fontSize: 10.5, cursor: 'pointer', padding: 2 }}
        >
          {t('color.resetToTheme')}
        </button>
      </div>
      <div className="flex gap-[5px] flex-wrap">
        {SWATCHES.map((c) => (
          <button
            key={c}
            onClick={() => { setHex(c); onChange(c); }}
            title={c}
            style={{ width: 22, height: 22, borderRadius: 6, background: c, border: value === c ? '2px solid var(--fg)' : '1px solid var(--border)', cursor: 'pointer' }}
          />
        ))}
      </div>
      <input
        type="range"
        className="ich-hue"
        min={0}
        max={360}
        value={hue}
        onChange={(e) => { const h = Number(e.target.value); setHue(h); apply(h, light); }}
        style={{ width: '100%' }}
      />
      <input
        type="range"
        className="ich-light"
        min={12}
        max={88}
        value={light}
        onChange={(e) => { const l = Number(e.target.value); setLight(l); apply(hue, l); }}
        style={{ width: '100%', ['--pick-mid' as string]: mid }}
      />
      <div className="flex items-center gap-[7px]">
        <span style={{ width: 20, height: 20, borderRadius: 6, background: value ?? mid, border: '1px solid var(--border)', flex: 'none' }} />
        {/*
         * Hex and opacity migrate; the two `type="range"` tracks above deliberately do
         * not. Their whole purpose is a hue spectrum and a lightness ramp painted on the
         * track itself, which is a native range-input capability with no design-system
         * equivalent -- and they are the surface R-P7 broke, now pinned by
         * `visual.spec.ts`. Migrating them would delete both the gradient and its guard.
         */}
        <Input
          size="sm"
          value={hex}
          onChange={(v) => { setHex(v); if (isValidHex(v)) emit(v, alpha); }}
          placeholder="#7c3aed"
          aria-label={t('appearance.customHex')}
          inputClassName="font-mono"
          className="min-w-0 flex-1"
        />
        <Input
          size="sm"
          inputMode="numeric"
          value={String(alpha)}
          onChange={(v) => { const a = Math.max(0, Math.min(100, Number(v) || 0)); setAlpha(a); if (isValidHex(hex)) emit(hex, a); }}
          aria-label={t('color.opacity')}
          inputClassName="text-right font-mono"
          className="w-14 flex-none"
        />
      </div>
    </div>
  );
}
