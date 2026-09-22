
import { useResolvedIcons } from '@js/hooks/useResolvedIcons';
import { useCopy } from '@js/hooks/useClipboard';
import { useT } from '@js/hooks/useT';
import { Modal } from '@js/components/ui/Modal';
import { IconAsset } from '@js/components/ui/IconAsset';
import { Glyph } from '@js/components/ui/Glyph';
import { iconRef } from '@js/core/SnippetFactory';
import { CONFIG_DEFAULTS } from '@js/core/config';
import { useAppStore } from '@js/hooks/useStoreApi';
import type { Collection } from '@js/store';

const rowBtn: React.CSSProperties = {
  height: 26,
  padding: '0 10px',
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  borderRadius: 6,
  fontSize: 11,
  cursor: 'pointer',
  color: 'var(--fg)',
};

/**
 * SharedCollectionsModal — the collections shared with the active workspace/team.
 * Opened from the Team popover + the account menu. Mirrors the icon-card structure
 * used across the app (folder header → member avatars/role → 38px icon thumbnails).
 */
export function SharedCollectionsModal() {
  const closeShared = useAppStore((s) => s.closeShared);
  const collections = useAppStore((s) => s.collections);
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const config = useAppStore((s) => s.config);
  const openDetail = useAppStore((s) => s.openDetail);
  const openAccess = useAppStore((s) => s.openAccess);
  const openInvite = useAppStore((s) => s.openInvite);
  const t = useT();

  const palette = config?.ui.avatarPalette?.length ? config.ui.avatarPalette : CONFIG_DEFAULTS.ui.avatarPalette;
  const workspace = config?.user.workspaces.find((w) => w.id === activeWorkspaceId) ?? config?.user.workspaces[0];
  const shared = collections.filter((c) => c.shared || (c.sharedWith ?? []).length > 0);

  return (
    <Modal showClose={false} onClose={closeShared} width={620} label={t('shared.title')} panelStyle={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <div className="flex items-center gap-2 py-3 px-4 border-b border-b-[var(--border)] flex-none">
        <Glyph name="folder" size={15} color="var(--accent-text)" />
        <span className="text-[13.5px] font-[650]">{t('shared.title')}</span>
        <span className="font-[family-name:'Geist_Mono',monospace] text-[10.5px] text-[var(--faint-fg)]">{workspace?.name ?? t('team.title')}</span>
        <span className="flex-1" />
        <span className="text-[11px] text-[var(--muted-fg)]">{t('shared.count', { n: shared.length })}</span>
        <button onClick={closeShared} title={`${t('common.close')} — Esc`} aria-label={t('common.close')} className="w-[26px] h-[26px] border border-[var(--border)] bg-[var(--bg)] shadow-[var(--shadow)] rounded-[6px] cursor-pointer flex items-center justify-center text-[var(--muted-fg)]">
          <Glyph name="close" size={12} color="currentColor" />
        </button>
      </div>

      {/* body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 min-h-0">
        {shared.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 px-4 text-[var(--muted-fg)]">
            <Glyph name="folder" size={22} color="var(--faint-fg)" />
            <span className="text-[12.5px] text-center">{t('shared.empty')}</span>
            <button onClick={() => { closeShared(); openInvite(); }} style={{ ...rowBtn, height: 30, background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', fontWeight: 600 }}>{t('shared.inviteTeam')}</button>
          </div>
        ) : (
          shared.map((c) => (
            <SharedCollectionCard key={c.id} c={c} palette={palette} onManageAccess={() => openAccess(c.id)} onOpenDetail={openDetail} />
          ))
        )}
      </div>
    </Modal>
  );
}

/**
 * One shared collection's icons, resolved together in one `useResolvedIcons`
 * call -- same reasoning as `CollectionCard` in `LibraryDialog.tsx`: a hook
 * cannot be called once per item inside a `.map()`, so each card is its own
 * component with its own hook call.
 */
function SharedCollectionCard({
  c,
  palette,
  onManageAccess,
  onOpenDetail,
}: {
  c: Collection;
  palette: string[];
  onManageAccess: () => void;
  onOpenDetail: (id: number) => void;
}) {
  const copy = useCopy();
  const t = useT();
  const { icons } = useResolvedIcons(c.icons);
  const byId = new Map(icons.map((i) => [i.id, i] as const));

  const copyNames = () => {
    copy(icons.map(iconRef).join('\n'), t('toolbar.namesCopied', { n: c.icons.length }));
  };

  return (
    <div className="border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
      {/* card header */}
      <div className="flex items-center gap-2 py-2.5 px-3">
        <Glyph name="folder" size={14} color="var(--accent-text)" />
        <span className="text-[12.5px] font-[550]">{c.name}</span>
        <span className="font-[family-name:'Geist_Mono',monospace] text-[10.5px] text-[var(--muted-fg)]">{t('library.iconCount', { n: c.icons.length })}</span>
        <span className="text-[9px] font-bold text-[var(--accent-text)] bg-[var(--accent-soft)] rounded-[4px] py-[1px] px-[5px]">{c.role === 'viewer' ? t('shared.viewer') : t('shared.editor')}</span>
        {(c.sharedWith ?? []).length > 0 && (
          <div className="flex">
            {(c.sharedWith ?? []).slice(0, 3).map((m, i) => (
              <div key={m.initials} style={{ width: 18, height: 18, borderRadius: '50%', marginInlineStart: i === 0 ? 0 : -6, border: '2px solid var(--pop)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7.5, fontWeight: 700, color: 'var(--accent-fg)', background: palette[i % palette.length] }}>{m.initials}</div>
            ))}
          </div>
        )}
        <span className="flex-1" />
        <button onClick={onManageAccess} style={rowBtn}>{t('shared.manageAccess')}</button>
        <button onClick={copyNames} style={rowBtn}>{t('toolbar.copyNames')}</button>
      </div>
      {/* icon thumbnails */}
      {c.icons.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-t-[var(--border)] py-2.5 px-3">
          {c.icons.map((id) => {
            const icon = byId.get(id);
            if (!icon) return null;
            return (
              <div key={id} role="button" tabIndex={0} aria-label={icon.name} onClick={() => onOpenDetail(id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenDetail(id); } }} title={icon.name} className="w-[38px] h-[38px] border border-[var(--border)] rounded-[6px] bg-[var(--card)] flex items-center justify-center cursor-pointer">
                <IconAsset icon={icon} size={18} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
