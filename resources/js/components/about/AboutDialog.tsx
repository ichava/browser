
import { Modal } from '@/components/ui/Modal';
import { Marquee } from '@/components/ui/Marquee';
import { Glyph } from '@/components/ui/Glyph';
import { num } from '@/core/format';
import { useT } from '@/hooks/useT';
import { CONFIG_DEFAULTS } from '@/core/config';
import { useAppStore } from '@/hooks/useStoreApi';

export function AboutDialog() {
  const t = useT();
  const closeLayer = useAppStore((s) => s.closeLayer);
  const config = useAppStore((s) => s.config);
  const catalog = useAppStore((s) => s.catalog);
  const about = config?.about ?? CONFIG_DEFAULTS.about;
  const CREDITS = about.credits;
  const LINKS = about.links;

  return (
    <Modal showClose={false} onClose={closeLayer} width={400} panelStyle={{ overflow: 'hidden' }}>
      <div className="relative">
        <button onClick={closeLayer} title={`${t('common.close')} — Esc`} className="absolute top-2.5 end-2.5 z-2 w-[26px] h-[26px] border border-[var(--border)] bg-[var(--pop)] shadow-[var(--shadow)] rounded-[6px] cursor-pointer flex items-center justify-center text-[var(--muted-fg)]">
          <Glyph name="close" size={12} color="currentColor" />
        </button>
        <div className="flex flex-col items-center gap-2.5 pt-[26px] px-5 pb-[18px] bg-[var(--accent-soft)]">
          <div className="w-[46px] h-[46px] rounded-[12px] bg-[var(--accent)] flex items-center justify-center shadow-[var(--shadow-elevated)]">
            <Glyph name="layers" size={25} color="var(--accent-fg)" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-[16px] tracking-[-.02em]">{config?.brand.name ?? 'Ichava'}</span>
            <span className="text-[var(--muted-fg)] text-[14px]">{config?.brand.suffix ?? t('about.browser')}</span>
            <span className="font-[family-name:'Geist_Mono',monospace] text-[11px] text-[var(--accent-text)]">v{config?.meta.version ?? '1.4.0'}</span>
          </div>
          <div className="text-[12px] text-[var(--muted-fg)] text-center leading-[1.55] max-w-[40ch]">
            {about.description}
          </div>
          <div className="text-[11px] text-[var(--faint-fg)]">{t('about.craftedBy')} <b className="text-[var(--fg)] font-semibold">{config?.meta.author ?? 'Imani Manyara'}</b></div>
        </div>
      </div>

      <div className="flex border-t border-t-[var(--border)] border-b border-b-[var(--border)]">
        <Stat value={num(catalog?.meta.total_ecosystem ?? 0)} label={about.stats[0]?.label ?? t('about.statIcons')} border />
        <Stat value={String(config?.meta.sets ?? 70)} label={about.stats[1]?.label ?? t('about.statSets')} border />
        <Stat value={config?.meta.license ?? 'MIT'} label={about.stats[2]?.label ?? t('about.statLicense')} />
      </div>

      <div className="text-[9.5px] font-bold tracking-[.08em] text-[var(--faint-fg)] text-center pt-2 px-0 pb-1.5 bg-[var(--muted2)] border-b border-b-[var(--border)]">
        {about.creditsTitle}
      </div>
      <Marquee durationSec={about.creditsMarqueeSec} style={{ height: 126, background: 'var(--muted2)' }} fadeColor="var(--muted2)">
        {CREDITS.map((c) => (
          <div key={c.name} className="flex items-baseline justify-center gap-2 py-[5px] px-4">
            <span className="text-[11.5px] font-[600]">{c.name}</span>
            <span className="text-[10px] text-[var(--muted-fg)]">{c.author}</span>
            <span className="font-[family-name:'Geist_Mono',monospace] text-[9.5px] text-[var(--accent-text)] bg-[var(--accent-soft)] rounded-[3px] py-0 px-[5px]">{c.license}</span>
          </div>
        ))}
      </Marquee>

      <div className="flex items-center gap-3 py-3 px-4 flex-wrap">
        <span className="text-[11px] text-[var(--muted-fg)]">{about.copyright}</span>
        <span className="flex-1" />
        <div className="flex items-center gap-3">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="text-[12px]">{l.label}</a>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function Stat({ value, label, border }: { value: string; label: string; border?: boolean }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: 10, borderRight: border ? '1px solid var(--border)' : undefined }}>
      <span className="font-[family-name:'Geist_Mono',monospace] text-[14px] font-semibold">{value}</span>
      <span className="text-[10px] text-[var(--muted-fg)]">{label}</span>
    </div>
  );
}
