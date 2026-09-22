
import { useRepo } from '@js/hooks/useRepo';
import { Glyph } from '@js/components/ui/Glyph';
import { Select } from '@js/components/base/select/select';
import { Tooltip } from '@js/components/ui/Tooltip';
import { num } from '@js/core/format';
import { useT } from '@js/hooks/useT';
import { rem } from '@js/core/appScale';
import { useAppStore } from '@js/hooks/useStoreApi';

const PER_PAGE_FALLBACK = [30, 60, 120, 240];

export function AppFooter() {
  const { page } = useRepo();
  const t = useT();
  const perPage = useAppStore((s) => s.filters.perPage);
  const setPerPage = useAppStore((s) => s.setPerPage);
  const nextPage = useAppStore((s) => s.nextPage);
  const prevPage = useAppStore((s) => s.prevPage);
  const PER_PAGE = useAppStore((s) => s.config?.ui.perPageOptions) ?? PER_PAGE_FALLBACK;

  return (
    <div style={{ height: rem(38), flex: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', borderTop: '1px solid var(--border)', userSelect: 'none' }}>
      <span className="text-[11.5px] text-[var(--muted-fg)]">
        {page.total === 0 ? t('footer.noResults') : t('footer.range', { start: num(page.rangeStart), end: num(page.rangeEnd), total: num(page.total) })}
      </span>
      <span className="flex-1" />

      {/*
       * Numeric keys, no String()/Number() round trip -- react-aria's selectedKey takes a
       * number directly. The options now read "60 / page" like the trigger instead of a
       * bare "60"; previously the trigger and its own list disagreed on wording.
       */}
      <Select
        size="sm"
        aria-label={t('footer.perPageLabel')}
        items={PER_PAGE.map((n) => ({ id: n, label: t('footer.perPage', { n }) }))}
        selectedKey={perPage}
        onSelectionChange={(key) => setPerPage(Number(key))}
        className="w-28 flex-none"
      >
        {(item) => <Select.Item {...item} />}
      </Select>

      <div className="flex items-center gap-0.5">
        <Tooltip content={t('footer.prevPage')} side="top">
          <button onClick={prevPage} aria-label={t('footer.prevPage')} disabled={page.page <= 1} style={{ ...pageBtn, opacity: page.page <= 1 ? 0.45 : 1 }}>
            <Glyph name="chevron-left" size={11} color="currentColor" />
          </button>
        </Tooltip>
        <span className="font-[family-name:'Geist_Mono',monospace] text-[11px] text-[var(--muted-fg)] py-0 px-1.5">{page.page} / {page.lastPage}</span>
        <Tooltip content={t('footer.nextPage')} side="top">
          <button onClick={() => nextPage(page.lastPage)} aria-label={t('footer.nextPage')} disabled={page.page >= page.lastPage} style={{ ...pageBtn, opacity: page.page >= page.lastPage ? 0.45 : 1 }}>
            <Glyph name="chevron-right" size={11} color="currentColor" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

const pageBtn: React.CSSProperties = {
  width: 24,
  height: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid var(--border)',
  borderRadius: 5,
  background: 'var(--bg)',
  cursor: 'pointer',
  color: 'var(--muted-fg)',
};
