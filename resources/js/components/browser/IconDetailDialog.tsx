import { useEffect, useMemo, useRef, useState } from 'react';

import { useRepo } from '@js/hooks/useRepo';
import { useResolvedIcons } from '@js/hooks/useResolvedIcons';
import { useCopy } from '@js/hooks/useClipboard';
import { Modal } from '@js/components/ui/Modal';
import { IconAsset } from '@js/components/ui/IconAsset';
import { Glyph } from '@js/components/ui/Glyph';
import { ColorPicker } from '@js/components/ui/ColorPicker';
import { Popover } from '@js/components/ui/Popover';
import { snippets, iconRef, SNIPPET_TABS, type SnippetFormat } from '@js/core/SnippetFactory';
import { Console } from '@js/components/ui/Console';
import { assetUrl } from '@js/core/SvgFidelity';
import { MOTION_PRESETS, ILLUSTRATION_PRESETS, EASINGS, EASING_LABEL, play, sliderToSpeed, speedLabel, type MotionPreset, type Easing } from '@js/core/MotionEngine';
import type { SizeUnit } from '@js/core/types';
import type { Icon } from '@js/core/model';
import { svgToPng, downloadBlob } from '@js/core/raster';
import { Tooltip } from '@js/components/ui/Tooltip';
import { useT } from '@js/hooks/useT';
import { Select } from '@js/components/base/select/select';
import { Menu } from '@js/components/ui/Menu';
import { useAppStore, useStoreApi } from '@js/hooks/useStoreApi';
import { Slider } from '@js/components/base/slider/slider';

export function IconDetailDialog() {
  const storeApi = useStoreApi();
  const { repo } = useRepo();
  const detailId = useAppStore((s) => s.detailId);
  const closeLayer = useAppStore((s) => s.closeLayer);
  const openDetail = useAppStore((s) => s.openDetail);
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const collections = useAppStore((s) => s.collections);
  const addToCollection = useAppStore((s) => s.addToCollection);
  const pushHistory = useAppStore((s) => s.pushHistory);
  const copy = useCopy();
  const t = useT();

  const [tab, setTab] = useState<SnippetFormat>('svg');
  const [dSize, setDSize] = useState(96);
  const [dUnit, setDUnit] = useState<SizeUnit>('px');
  const [dColor, setDColor] = useState<string | null>(null);
  const [stroke, setStroke] = useState(1.5);
  const [svgBody, setSvgBody] = useState<string | null>(null);
  const [motion, setMotion] = useState<MotionPreset>(MOTION_PRESETS[0]!);
  const [easing, setEasing] = useState<Easing>('ease-in-out');
  const [speedV, setSpeedV] = useState(50);
  const [paused, setPaused] = useState(false);
  const [customJson, setCustomJson] = useState('[\n  { "transform": "rotate(0deg) scale(1)", "opacity": 1 },\n  { "transform": "rotate(-14deg) scale(1.12)", "opacity": 1, "offset": 0.3 },\n  { "transform": "rotate(0deg) scale(1)", "opacity": 1 }\n]');
  const previewRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<Animation | null>(null);

  // `repo?.byId(detailId)` alone resolved nothing in REST mode -- there is no
  // in-memory repo to call -- so the whole dialog was unable to render past its
  // header whenever it was opened without a static catalog. `useResolvedIcons`
  // is the same resolution every other id->Icon lookup in the app now goes
  // through, so this is no longer a special case.
  const { icons: [resolvedDetailIcon] } = useResolvedIcons(detailId != null ? [detailId] : []);
  const icon = resolvedDetailIcon;

  // JSON · Custom: parse pasted keyframes (validated — array of plain objects only).
  const customKeyframes = useMemo<Keyframe[] | null>(() => {
    if (!motion.custom) return null;
    try {
      const p: unknown = JSON.parse(customJson);
      const arr = Array.isArray(p) ? p : Array.isArray((p as { keyframes?: unknown }).keyframes) ? (p as { keyframes: unknown[] }).keyframes : null;
      if (!arr || !arr.every((k) => k && typeof k === 'object' && !Array.isArray(k))) return null;
      return arr as Keyframe[];
    } catch {
      return null;
    }
  }, [motion.custom, customJson]);

  // The preset actually played: for JSON·Custom, a synthetic preset from the pasted keyframes.
  const activeMotion: MotionPreset = motion.custom && customKeyframes ? { ...motion, keyframes: customKeyframes, base: 1400 } : motion;

  // Play the selected motion preset on the preview via WAAPI.
  useEffect(() => {
    animRef.current?.cancel();
    animRef.current = null;
    if (!previewRef.current || activeMotion.id === 'none') return;
    if (activeMotion.custom && !customKeyframes) return; // invalid JSON — nothing to play
    // Loop one-shot presets in the PREVIEW so they're viewable (export default stays once).
    const anim = play(previewRef.current, activeMotion, { speed: sliderToSpeed(speedV), easing, iterations: activeMotion.once ? Infinity : undefined });
    animRef.current = anim;
    if (anim && paused) anim.pause();
    return () => anim?.cancel();
  }, [activeMotion, customKeyframes, speedV, paused, easing, icon]);

  useEffect(() => {
    if (!icon) return;
    if (icon.svgContent) { setSvgBody(icon.svgContent); return; }
    if (!icon.svgUrl) { setSvgBody(null); return; }
    let alive = true;
    fetch(assetUrl(icon.svgUrl))
      .then((r) => r.text())
      .then((t) => alive && setSvgBody(t))
      .catch(() => alive && setSvgBody(null));
    return () => {
      alive = false;
    };
  }, [icon]);

  const related = icon && repo ? repo.related(icon) : [];
  const snippet = useMemo(
    () =>
      icon
        ? snippets.build(
            tab,
            icon,
            {
              size: dSize,
              unit: dUnit,
              color: dColor,
              strokeWidth: stroke,
              motion: { id: motion.id, label: motion.label, keyframes: customKeyframes ?? motion.keyframes, base: motion.base, easing, easingLabel: EASING_LABEL[easing] ?? easing, speed: sliderToSpeed(speedV), direction: motion.direction, iterations: motion.iterations },
            },
            svgBody,
          )
        : '',
    [icon, tab, dSize, dUnit, dColor, stroke, svgBody, motion, easing, speedV],
  );

  if (!icon) return null;
  const isFav = favorites.includes(icon.id);
  // Illustrations get the layered motion families (Reveal/Cascade/Parallax/Draw).
  const presetList = icon.kind === 'illustration' ? ILLUSTRATION_PRESETS : MOTION_PRESETS;
  const motionEnabled = storeApi.getState().config?.features.motion !== false;
  const tabs = motionEnabled ? SNIPPET_TABS : SNIPPET_TABS.filter((t) => t.id !== 'motion');
  // Scale-to-fit: the icon's actual export size (dSize in dUnit) may exceed the card,
  // so render at the fit size and note the actual — SVG keeps it crisp at any scale.
  const UNIT_PX: Record<string, number> = { px: 1, rem: 16, em: 16 };
  const actualPx = dSize * (UNIT_PX[dUnit] ?? 1);
  const CARD_FIT = 150;
  const previewSize = Math.max(28, Math.min(actualPx, CARD_FIT));
  const scaledToFit = actualPx > CARD_FIT;

  // Apply the dialog's size/color/stroke to the download (own-colour icons keep
  // their fills); returns null when there is no SVG so we never write a blank file.
  const svgString = (): string | null =>
    svgBody ? snippets.build('svg', icon!, { size: dSize, unit: 'px', color: dColor, strokeWidth: stroke }, svgBody) : null;
  const downloadSvg = () => {
    const s = svgString();
    if (!s) { storeApi.getState().showToast(t('detail.noSvg'), 'alert-circle'); return; }
    downloadBlob(`${icon!.name}.svg`, new Blob([s], { type: 'image/svg+xml' }));
    pushHistory(icon!.id, 'downloaded');
  };
  const downloadPng = async () => {
    const s = svgString();
    if (!s) { storeApi.getState().showToast(t('detail.pngNoSvg'), 'alert-circle'); return; }
    try {
      downloadBlob(`${icon!.name}.png`, await svgToPng(s, Math.max(256, dSize * 4)));
      pushHistory(icon!.id, 'downloaded');
    } catch {
      storeApi.getState().showToast(t('detail.pngFailed'), 'alert-circle');
    }
  };

  return (
    <Modal showClose={false} onClose={closeLayer} width={940} label={iconRef(icon)} panelStyle={{ overflowY: 'auto' }}>
      {/* Header: identity (inline-start) · preview notice + link + close (inline-end) */}
      <div className="flex items-center gap-2 py-3 px-4 border-b border-b-[var(--border)]">
        <span className="font-[family-name:'Geist_Mono',monospace] text-[13.5px] font-semibold min-w-0 max-w-[220px] whitespace-nowrap overflow-hidden text-ellipsis">{icon.name}</span>
        <span className="text-[10.5px] text-[var(--accent-text)] bg-[var(--accent-soft)] rounded-[5px] py-0.5 px-1.5 font-[550] flex-none">{icon.package.replace('ichava/', '')}</span>
        <span className="text-[11px] text-[var(--muted-fg)] capitalize whitespace-nowrap overflow-hidden text-ellipsis">{icon.category} · {icon.variant}</span>
        <span className="flex-1 min-w-2" />
        <IconBtn name="link" title={t('tile.copyPermalink')} onClick={() => copy(`${location.origin}${location.pathname}?icon=${icon.id}`, t('tile.permalinkCopied'))} />
        <span className="text-[10.5px] text-[var(--faint-fg)] whitespace-nowrap">{t('detail.previewOnly')}</span>
        <IconBtn name="close" title={`${t('common.close')} — Esc`} onClick={closeLayer} />
      </div>

      <div className="ich-detail-grid" style={{ display: 'grid', gridTemplateColumns: '300px minmax(0,1fr)', gap: 18, padding: 18 }}>
        <div className="flex flex-col gap-2.5">
          <div className="relative h-56 border border-[var(--border)] rounded-[var(--radius)] bg-[var(--muted2)] flex items-center justify-center overflow-hidden">
            {/* Highest-fidelity inline SVG, scaled to fit the card. Size/stroke/color/
                treatment improve the render (vector), never degrade it. */}
            <div ref={previewRef} className="flex">
              <IconAsset inline icon={icon} size={previewSize} color={dColor} stroke={stroke} />
            </div>
            <span className="absolute bottom-2 left-0 right-0 text-center text-[10.5px] text-[var(--faint-fg)]">
              {scaledToFit ? `${t('detail.scaledToFit')} · ` : ''}{t('detail.actual')} {dSize}{dUnit === 'px' ? 'px' : ` ${dUnit}`}
            </span>
          </div>

          <Control label={t('detail.size')}>
            <div className="flex-1">
              <Slider minValue={16} maxValue={256} step={16} value={dSize} onChange={(v) => setDSize(v as number)} aria-label={t('detail.previewSize')} formatOptions={{ style: 'decimal' }} />
            </div>
            <Mono>{dSize}{dUnit === 'px' ? 'px' : ` ${dUnit}`}</Mono>
            <Select
              size="sm"
              aria-label={t('detail.unit')}
              items={(['px', 'rem', 'em'] as const).map((u) => ({ id: u, label: u }))}
              selectedKey={dUnit}
              onSelectionChange={(key) => setDUnit(key as SizeUnit)}
              className="w-20"
              popoverClassName="min-w-20"
            >
              {(item) => <Select.Item {...item} />}
            </Select>
          </Control>

          {/* Color/stroke don't apply to multicolor + illustration icons. */}
          {!icon.ownColor && (
          <Popover
            align="left"
            width={196}
            panelStyle={{ padding: 10, top: 30 }}
            trigger={(_o, toggle) => (
              <button onClick={toggle} style={smallBtn}>
                <span style={{ width: 13, height: 13, borderRadius: '50%', background: dColor ?? 'linear-gradient(135deg,var(--fg),var(--muted-fg))', border: '1px solid var(--border)' }} />
                <span className="text-[11.5px]">{t('detail.color')}</span>
                <Glyph name="chevron-down" size={9} color="currentColor" />
              </button>
            )}
          >
            {() => <ColorPicker value={dColor} onChange={setDColor} />}
          </Popover>
          )}

          {icon.variant === 'outline' && !icon.ownColor && (
            <Control label={t('detail.stroke')}>
              <div className="flex-1">
                <Slider minValue={0.5} maxValue={3} step={0.25} value={stroke} onChange={(v) => setStroke(v as number)} aria-label={t('detail.stroke')} formatOptions={{ style: 'decimal', maximumFractionDigits: 2 }} />
              </div>
              <Mono>{stroke.toFixed(2)}px</Mono>
            </Control>
          )}

          {motionEnabled && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-[var(--muted-fg)]">{t('detail.motion')}</span>
            <div className="flex gap-[5px]">
              {/*
               * The design system's searchable select, not a hand-built one.
               *
               * This was a custom `Popover` anchoring a cmdk `Command`, which nested a
               * scroll container (CommandList) inside another scroll container (the
               * popover panel). Nested scrollers are why the list would not scroll: the
               * wheel event goes to whichever one the pointer is over, and the inner one
               * had already reached its end. `Select.ComboBox` owns a single scrolling
               * listbox.
               *
               * A combo box rather than a plain select because the list is long -- 45
               * motion presets, 20 for illustrations -- and past about ten items a list
               * needs filtering to be usable.
               */}
              <Select.ComboBox
                size="sm"
                aria-label={t('detail.motion')}
                placeholder={t('detail.searchPresets', { n: presetList.length })}
                shortcut={false}
                items={presetList.map((m) => ({ id: m.id, label: m.label }))}
                selectedKey={motion.id}
                onSelectionChange={(key) => {
                  const next = presetList.find((m) => m.id === key);
                  if (!next) return;
                  setMotion(next);
                  setPaused(false);
                }}
                className="min-w-0 flex-1"
              >
                {(item) => <Select.Item {...item} />}
              </Select.ComboBox>
              {/* Easing — shadcn Select */}
              {/*
               * `isDisabled`, not `disabled` -- react-aria's own prop. Passing `disabled`
               * would land in `...rest` on the wrapper and do nothing, leaving the control
               * fully operable while looking dimmed.
               */}
              <Select
                size="sm"
                aria-label={t('detail.easing')}
                isDisabled={motion.id === 'none'}
                items={EASINGS.map((es) => ({ id: es, label: EASING_LABEL[es] ?? es }))}
                selectedKey={easing}
                onSelectionChange={(key) => setEasing(key as Easing)}
                className="w-36"
              >
                {(item) => <Select.Item {...item} />}
              </Select>
              <button onClick={() => setPaused((p) => !p)} disabled={motion.id === 'none'} title={paused ? t('detail.play') : t('detail.pause')} aria-label={paused ? t('detail.play') : t('detail.pause')} style={{ ...smallBtn, width: 30, padding: 0, justifyContent: 'center', opacity: motion.id === 'none' ? 0.4 : 1 }}>
                <Glyph name={paused ? 'play' : 'pause'} size={13} color="currentColor" />
              </button>
            </div>
            {motion.id !== 'none' && (
              <Control label={t('detail.speed')}>
                <div className="flex-1">
                  <Slider minValue={0} maxValue={100} value={speedV} onChange={(v) => setSpeedV(v as number)} aria-label={t('detail.speed')} formatOptions={{ style: 'decimal' }} />
                </div>
                <Mono>{speedLabel(sliderToSpeed(speedV))}</Mono>
              </Control>
            )}
          </div>
          )}

          <button onClick={() => { copy(snippet, t('detail.copied', { label: SNIPPET_TABS.find((tb) => tb.id === tab)?.label ?? 'snippet' })); pushHistory(icon.id, 'copied'); }} className="h-8 border-0 rounded-[calc(var(--radius)_-_2px)] bg-[var(--accent)] text-[var(--accent-fg)] text-[12.5px] font-semibold cursor-pointer">
            {t('common.copy')} {SNIPPET_TABS.find((tb) => tb.id === tab)?.label}
          </button>
          <div className="flex gap-1.5">
            <Menu
              label={t('detail.download')}
              trigger={
  <button className="flex-1 h-[30px] flex items-center justify-center gap-[5px] border border-[var(--border)] rounded-[calc(var(--radius)_-_2px)] bg-[var(--bg)] text-[var(--fg)] text-[12px] cursor-pointer">
                  {t('detail.download')} <Glyph name="chevron-down" size={9} color="var(--muted-fg)" />
                </button>
              }
              items={[
                { id: 'svg', label: 'SVG', onAction: () => downloadSvg() },
                { id: 'png', label: 'PNG', onAction: () => { void downloadPng(); } },
              ]}
            />
            <button onClick={() => toggleFavorite(icon.id)} style={{ flex: 1, height: 30, border: `1px solid ${isFav ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'calc(var(--radius) - 2px)', background: isFav ? 'var(--accent-soft)' : 'var(--bg)', color: isFav ? 'var(--accent)' : 'var(--fg)', fontSize: 12, cursor: 'pointer' }}>
              {isFav ? t('common.favorited') : t('common.favorite')}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 min-w-0">
          <div className="flex flex-wrap gap-0.5 border border-[var(--border)] rounded-[calc(var(--radius)_-_2px)] p-0.5 bg-[var(--muted2)] self-start">
            {tabs.map((tb) => (
              <button
                key={tb.id}
                role="tab"
                aria-selected={tab === tb.id}
                onClick={() => setTab(tb.id)}
                style={{ height: 24, padding: '0 8px', border: 'none', background: tab === tb.id ? 'var(--pop)' : 'transparent', color: tab === tb.id ? 'var(--fg)' : 'var(--muted-fg)', borderRadius: 'calc(var(--radius) - 3px)', fontSize: 11, fontWeight: tab === tb.id ? 600 : 500, cursor: 'pointer', boxShadow: tab === tb.id ? 'var(--shadow)' : 'none' }}
              >
                {tb.label}
              </button>
            ))}
          </div>

          <Console
            title={`ichava — ${SNIPPET_TABS.find((tb) => tb.id === tab)?.label}`}
            code={snippet}
            onCopy={() => copy(snippet, t('detail.copied', { label: SNIPPET_TABS.find((tb) => tb.id === tab)?.label ?? 'snippet' }))}
          />

          {/* Keyframes editor (JSON · Custom) — under the code panel, per the mockup */}
          {motionEnabled && motion.custom && (
            <div className="flex flex-col gap-[5px]">
              <textarea
                value={customJson}
                onChange={(e) => setCustomJson(e.target.value)}
                spellCheck={false}
                placeholder='[ { "transform": "rotate(0deg)" }, { "transform": "rotate(360deg)" } ]'
                aria-label={t('detail.keyframesAria')}
                style={{ width: '100%', height: 120, resize: 'vertical', padding: 10, border: `1px solid ${customKeyframes ? 'var(--console-border)' : 'var(--danger)'}`, borderRadius: 'calc(var(--radius) - 2px)', background: 'var(--console-bg)', color: 'var(--console-fg)', fontFamily: "'Geist Mono',monospace", fontSize: 11, lineHeight: 1.6 }}
              />
              <span style={{ fontSize: 10, color: customKeyframes ? 'var(--faint-fg)' : 'var(--danger)' }}>
                {customKeyframes ? t('detail.keyframesValid', { n: customKeyframes.length }) : t('detail.keyframesInvalid')}
              </span>
            </div>
          )}

          {related.length > 0 && (
            <div className="flex flex-col gap-[5px]">
              <span className="text-[11px] font-semibold text-[var(--muted-fg)]">{t('detail.related')}</span>
              <div className="flex gap-[5px]">
                {related.map((ri) => (
                  <button key={ri.id} onClick={() => openDetail(ri.id)} title={ri.name} className="w-[38px] h-[38px] flex-none flex items-center justify-center border border-[var(--border)] rounded-[calc(var(--radius)_-_2px)] bg-[var(--card)] cursor-pointer">
                    <IconAsset icon={ri} size={20} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-[var(--muted-fg)]">{t('detail.addToCollection')}</span>
            <div className="flex flex-wrap gap-[5px]">
              {collections.map((c) => {
                const has = c.icons.includes(icon.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => { addToCollection(c.id, icon.id); storeApi.getState().showToast(t('detail.addedTo', { name: c.name }), 'folder'); }}
                    style={{ height: 24, padding: '0 9px', border: `1px solid ${has ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 12, background: has ? 'var(--accent-soft)' : 'var(--bg)', color: has ? 'var(--accent)' : 'var(--fg)', fontSize: 11, cursor: 'pointer' }}
                  >
                    {c.name}
                  </button>
                );
              })}
              <button onClick={() => storeApi.getState().openLibrary('collections')} className="h-6 py-0 px-[9px] border border-dashed border-[var(--border)] rounded-[12px] bg-transparent text-[var(--muted-fg)] text-[11px] cursor-pointer">{t('detail.newCollection')}</button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

const Mono = ({ children }: { children: React.ReactNode }) => (
  <span className="font-[family-name:'Geist_Mono',monospace] text-[10.5px] text-[var(--muted-fg)] min-w-12 text-right">{children}</span>
);
function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold text-[var(--muted-fg)] flex-none">{label}</span>
      {children}
    </div>
  );
}
function IconBtn({ name, title, onClick }: { name: string; title: string; onClick: () => void }) {
  return (
    <Tooltip content={title}>
      <button onClick={onClick} aria-label={title} className="w-[26px] h-[26px] border border-[var(--border)] bg-[var(--bg)] shadow-[var(--shadow)] rounded-[6px] cursor-pointer flex items-center justify-center text-[var(--muted-fg)]">
        <Glyph name={name} size={12} color="currentColor" />
      </button>
    </Tooltip>
  );
}
const smallBtn: React.CSSProperties = {
  alignSelf: 'flex-start',
  height: 28,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '0 8px',
  border: '1px solid var(--border)',
  borderRadius: 'calc(var(--radius) - 3px)',
  background: 'var(--bg)',
  cursor: 'pointer',
  color: 'var(--fg)',
  fontSize: 11.5,
};
