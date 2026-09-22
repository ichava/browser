import { useState } from 'react';

import { useResolvedIcons } from '@js/hooks/useResolvedIcons';
import { useCopy } from '@js/hooks/useClipboard';
import { Input } from '@js/components/base/input/input';
import { Form } from '@js/components/base/form/form';
import { Modal } from '@js/components/ui/Modal';
import { IconAsset } from '@js/components/ui/IconAsset';
import { Glyph } from '@js/components/ui/Glyph';
import { relativeTime } from '@js/core/format';
import { useT } from '@js/hooks/useT';
import { iconRef } from '@js/core/SnippetFactory';
import type { LibTab, Collection } from '@js/store';
import { useAppStore, useStoreApi } from '@js/hooks/useStoreApi';

const TABS: { id: LibTab; key: string }[] = [
  { id: 'favorites', key: 'library.favorites' },
  { id: 'history', key: 'library.history' },
  { id: 'collections', key: 'library.collections' },
];

export function LibraryDialog() {
  const storeApi = useStoreApi();
  const t = useT();
  const closeLayer = useAppStore((s) => s.closeLayer);
  const libTab = useAppStore((s) => s.libTab);
  const setLibTab = (tab: LibTab) => storeApi.setState({ libTab: tab });

  return (
    <Modal showClose={false} onClose={closeLayer} width={620} panelStyle={{ height: 460 }}>
      <div className="flex items-center gap-2 py-2.5 px-3.5 border-b border-b-[var(--border)]">
        <div role="tablist" className="flex gap-0.5 border border-[var(--border)] rounded-[calc(var(--radius)_-_2px)] p-0.5 bg-[var(--muted2)]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={libTab === tab.id}
              onClick={() => setLibTab(tab.id)}
              style={{ height: 24, padding: '0 12px', border: 'none', background: libTab === tab.id ? 'var(--pop)' : 'transparent', color: libTab === tab.id ? 'var(--fg)' : 'var(--muted-fg)', borderRadius: 'calc(var(--radius) - 3px)', fontSize: 11.5, fontWeight: libTab === tab.id ? 600 : 500, cursor: 'pointer', boxShadow: libTab === tab.id ? 'var(--shadow)' : 'none' }}
            >
              {t(tab.key)}
            </button>
          ))}
        </div>
        <span className="flex-1" />
        <button onClick={closeLayer} title={`${t('common.close')} — Esc`} className="w-[26px] h-[26px] border border-[var(--border)] bg-[var(--bg)] shadow-[var(--shadow)] rounded-[6px] cursor-pointer flex items-center justify-center text-[var(--muted-fg)]">
          <Glyph name="close" size={12} color="currentColor" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {libTab === 'favorites' && <Favorites />}
        {libTab === 'history' && <History />}
        {libTab === 'collections' && <Collections />}
      </div>
    </Modal>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-[var(--muted-fg)]">
      <Glyph name={icon} size={18} color="var(--faint-fg)" />
      <span className="text-[12.5px]">{text}</span>
    </div>
  );
}

const rowBtn: React.CSSProperties = {
  height: 24,
  padding: '0 8px',
  border: '1px solid var(--border)',
  borderRadius: 'calc(var(--radius) - 3px)',
  background: 'var(--bg)',
  color: 'var(--fg)',
  fontSize: 11,
  cursor: 'pointer',
};

function Favorites() {
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const openDetail = useAppStore((s) => s.openDetail);
  const t = useT();
  const { icons } = useResolvedIcons(favorites);
  if (!icons.length) return <Empty icon="heart" text={t('library.emptyFavorites')} />;
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2">
      {icons.map((icon) => icon && (
        <div key={icon.id} role="button" tabIndex={0} aria-label={icon.name} onClick={() => openDetail(icon.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(icon.id); } }} className="relative flex flex-col items-center justify-center gap-1.5 aspect-[1_/_0.9] border border-[var(--border)] rounded-[var(--radius)] cursor-pointer">
          <button onClick={(e) => { e.stopPropagation(); toggleFavorite(icon.id); }} title={t('common.remove')} className="absolute top-1 end-1 w-[22px] h-[22px] border border-[var(--border)] bg-[var(--pop)] rounded-[6px] cursor-pointer flex items-center justify-center text-[var(--muted-fg)]">
            <Glyph name="close" size={11} color="currentColor" />
          </button>
          <IconAsset icon={icon} size={24} />
          <span className="text-[10px] text-[var(--muted-fg)] max-w-[90%] whitespace-nowrap overflow-hidden text-ellipsis">{icon.name}</span>
        </div>
      ))}
    </div>
  );
}

function History() {
  const history = useAppStore((s) => s.history);
  const clearHistory = useAppStore((s) => s.clearHistory);
  const openDetail = useAppStore((s) => s.openDetail);
  const t = useT();
  const { icons } = useResolvedIcons(history.map((h) => h.id));
  const byId = new Map(icons.map((i) => [i.id, i] as const));
  if (!history.length) return <Empty icon="clock" text={t('library.emptyHistory')} />;
  return (
    <div className="flex flex-col">
      {history.map((h, i) => {
        const icon = byId.get(h.id);
        return (
          <div key={`${h.id}-${h.action}-${i}`} role="button" tabIndex={0} onClick={() => openDetail(h.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(h.id); } }} className="flex items-center gap-2.5 h-[38px] border-b border-b-[var(--border)] cursor-pointer">
            {icon && <IconAsset icon={icon} size={16} />}
            <span className="text-[12.5px] font-medium min-w-[120px]">{icon?.name ?? h.id}</span>
            <span className="text-[11px] text-[var(--accent-text)] bg-[var(--accent-soft)] rounded-[4px] py-[1px] px-1.5">{h.action}</span>
            <span className="flex-1" />
            <span className="font-[family-name:'Geist_Mono',monospace] text-[10.5px] text-[var(--faint-fg)]">{relativeTime(h.ts)}</span>
          </div>
        );
      })}
      <button onClick={clearHistory} className="self-start mt-2.5 h-[26px] py-0 px-2.5 border border-[var(--border)] rounded-[calc(var(--radius)_-_3px)] bg-transparent text-[var(--muted-fg)] text-[11.5px] cursor-pointer">{t('library.clearHistory')}</button>
    </div>
  );
}

function Collections() {
  const collections = useAppStore((s) => s.collections);
  const createCollection = useAppStore((s) => s.createCollection);
  const openAccess = useAppStore((s) => s.openAccess);
  const t = useT();
  const [name, setName] = useState('');

  return (
    <>
      {/*
       * A form, so Enter and the button run one submit path. Previously the Enter key was
       * handled by an `onKeyDown` on the field and the click by an `onClick` on the
       * button -- two copies of the same two statements, which is how they drift.
       */}
      <Form
        onSubmit={(e) => { e.preventDefault(); createCollection(name); setName(''); }}
        style={{ display: 'flex', gap: 6, marginBottom: 12 }}
      >
        <Input
          size="sm"
          value={name}
          onChange={setName}
          placeholder={t('library.newCollectionPlaceholder')}
          aria-label={t('library.newCollectionPlaceholder')}
          className="flex-1"
        />
        <button type="submit" className="flex-none py-0 px-3 border-0 rounded-[calc(var(--radius)_-_2px)] bg-[var(--accent)] text-[var(--accent-fg)] text-[12px] font-semibold cursor-pointer">{t('common.create')}</button>
      </Form>

      {collections.length === 0 && <Empty icon="folder" text={t('library.emptyCollections')} />}

      <div className="flex flex-col gap-1.5">
        {collections.map((c) => (
          <CollectionCard key={c.id} c={c} onManageAccess={() => openAccess(c.id)} />
        ))}
      </div>
    </>
  );
}

/**
 * One collection's icons, resolved together in one `useResolvedIcons` call.
 *
 * Extracted out of `Collections` because a hook cannot be called once per item
 * inside a `.map()` -- each collection needs its own resolution (a different
 * icon-id list), so each needs to be its own component with its own hook call
 * at that component's top level. This also fixes `copyNames`: it used to read
 * `repo` from the outer `Collections` scope, which had no way to resolve icons
 * in REST mode; it now reuses exactly what this card already resolved.
 */
function CollectionCard({ c, onManageAccess }: { c: Collection; onManageAccess: () => void }) {
  const removeCollection = useAppStore((s) => s.removeCollection);
  const removeFromCollection = useAppStore((s) => s.removeFromCollection);
  const openDetail = useAppStore((s) => s.openDetail);
  const copy = useCopy();
  const t = useT();
  const { icons } = useResolvedIcons(c.icons);
  const byId = new Map(icons.map((i) => [i.id, i] as const));

  const copyNames = () => {
    copy(icons.map(iconRef).join('\n'), t('toolbar.namesCopied', { n: c.icons.length }));
  };

  return (
    <div className="border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
      <div className="flex items-center gap-2 py-2.5 px-3">
        <Glyph name="folder" size={14} color="var(--accent-text)" />
        <span className="text-[12.5px] font-[550]">{c.name}</span>
        <span className="font-[family-name:'Geist_Mono',monospace] text-[10.5px] text-[var(--muted-fg)]">{t('library.iconCount', { n: c.icons.length })}</span>
        {c.shared && <span className="text-[9px] font-bold text-[var(--accent-text)] bg-[var(--accent-soft)] rounded-[4px] py-[1px] px-[5px]">{t('library.teamBadge')}</span>}
        {c.shared && c.role === 'viewer' && <span className="text-[9px] font-semibold text-[var(--faint-fg)] border border-[var(--border)] rounded-[4px] py-[1px] px-[5px]">{t('library.viewerBadge')}</span>}
        {c.shared && (c.sharedWith ?? []).length > 0 && (
          <div className="flex">
            {(c.sharedWith ?? []).slice(0, 3).map((m, i) => (
              <div key={m.initials} style={{ width: 18, height: 18, borderRadius: '50%', marginLeft: i === 0 ? 0 : -6, border: '2px solid var(--pop)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7.5, fontWeight: 700, color: '#fff', background: ['#7c3aed', '#0891b2', '#059669'][i % 3] }}>{m.initials}</div>
            ))}
          </div>
        )}
        <span className="flex-1" />
        <button onClick={onManageAccess} title={t('shared.manageAccess')} style={rowBtn}>{t('shared.manageAccess')}</button>
        <button onClick={copyNames} title={t('library.copyNamesTitle')} style={rowBtn}>{t('toolbar.copyNames')}</button>
        <button onClick={() => removeCollection(c.id)} title={t('library.deleteCollection')} className="w-[26px] h-[26px] border border-[var(--border)] bg-[var(--pop)] rounded-[6px] cursor-pointer flex items-center justify-center text-[var(--muted-fg)]">
          <Glyph name="trash" size={13} color="currentColor" />
        </button>
      </div>
      {c.icons.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-t-[var(--border)] py-2.5 px-3 mt-0 mx-3 mb-2.5">
          {c.icons.map((id) => {
            const icon = byId.get(id);
            if (!icon) return null;
            return (
              <div key={id} role="button" tabIndex={0} aria-label={icon.name} onClick={() => openDetail(id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(id); } }} title={icon.name} className="relative w-[38px] h-[38px] border border-[var(--border)] rounded-[6px] bg-[var(--card)] flex items-center justify-center cursor-pointer">
                <IconAsset icon={icon} size={18} />
                <button onClick={(e) => { e.stopPropagation(); removeFromCollection(c.id, id); }} title={t('common.remove')} className="absolute -top-[5px] -end-[5px] w-[15px] h-[15px] border border-[var(--border)] bg-[var(--pop)] rounded-full flex items-center justify-center cursor-pointer text-[var(--muted-fg)]">
                  <Glyph name="close" size={7} color="currentColor" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
