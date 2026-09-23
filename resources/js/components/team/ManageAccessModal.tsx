import { useState } from 'react';

import { useCopy } from '@/hooks/useClipboard';
import { SearchMd } from '@untitledui/icons';
import { Input } from '@/components/base/input/input';
import { Modal } from '@/components/ui/Modal';
import { Glyph } from '@/components/ui/Glyph';
import { useT } from '@/hooks/useT';
import type { TeamRef } from '@/store';
import { useAppStore } from '@/hooks/useStoreApi';

const PALETTE = ['#7c3aed', '#0891b2', '#059669', '#e11d48', '#ea580c'];

/**
 * ManageAccessModal — per-collection sharing (plan Part B, mock). Search/add
 * teammates, share with the whole team, or copy a link. Writes `shared`/`sharedWith`
 * onto the collection via `shareCollection`. Client-side only.
 */
export function ManageAccessModal() {
  const id = useAppStore((s) => s.accessCollectionId);
  const close = useAppStore((s) => s.closeAccess);
  const collection = useAppStore((s) => s.collections.find((c) => c.id === s.accessCollectionId));
  const team = useAppStore((s) => s.config?.team ?? []);
  const shareCollection = useAppStore((s) => s.shareCollection);
  const copy = useCopy();
  const t = useT();
  const [q, setQ] = useState('');
  const [members, setMembers] = useState<TeamRef[]>(collection?.sharedWith ?? []);

  if (!id || !collection) return null;
  const matches = team.filter((m) => !members.some((x) => x.initials === m.initials) && (m.name.toLowerCase().includes(q.toLowerCase()) || q === ''));

  const add = (m: TeamRef) => setMembers((prev) => [...prev, { initials: m.initials, name: m.name }]);
  const shareTeam = () => {
    shareCollection(id, { role: 'editor', sharedWith: team.map((m) => ({ initials: m.initials, name: m.name })) });
    close();
  };

  return (
    <Modal showClose={false} onClose={close} width={480} label={t('shared.manageAccess')} panelStyle={{ padding: 0 }}>
      <div className="flex items-baseline gap-1.5 py-4 px-5 border-b border-b-[var(--border)]">
        <span className="text-[15px] font-[700]">{t('shared.manageAccess')}</span>
        <span className="text-[13px] text-[var(--muted-fg)]">— {collection.name}</span>
      </div>
      <div className="p-5">
        <div className="text-[12px] font-[600] mb-1.5">{t('access.addPeople')}</div>
        <Input
          size="md"
          icon={SearchMd}
          value={q}
          onChange={setQ}
          placeholder={t('access.searchTeammates')}
          aria-label={t('access.searchTeammates')}
        />
        {q !== '' && matches.length > 0 && (
          <div className="border border-[var(--border)] rounded-[var(--radius)] mt-1.5 overflow-hidden">
            {matches.map((m, i) => (
              <button key={m.initials} onClick={() => { add(m); setQ(''); }} className="flex items-center gap-2 w-full py-2 px-2.5 border-0 bg-transparent cursor-pointer text-[var(--fg)]">
                <Avatar m={m} i={i} />
                <span className="text-[12.5px]">{m.name}</span>
              </button>
            ))}
          </div>
        )}
        <div className="mt-3.5">
          {members.length === 0 ? (
            <div className="text-[12.5px] text-[var(--muted-fg)] leading-[1.5]">{t('access.onlyYou')}</div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {members.map((m, i) => (
                <div key={m.initials} className="flex items-center gap-[9px]">
                  <Avatar m={m} i={i} />
                  <span className="flex-1 text-[12.5px]">{m.name}</span>
                  <button onClick={() => setMembers((p) => p.filter((x) => x.initials !== m.initials))} title={t('common.remove')} className="border-0 bg-transparent cursor-pointer text-[var(--muted-fg)]">
                    <Glyph name="close" size={12} color="currentColor" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => { shareCollection(id, { role: 'editor', sharedWith: members }); close(); }}
                className="self-start mt-1.5 h-[30px] py-0 px-3 border-0 rounded-[calc(var(--radius)_-_2px)] bg-[var(--accent)] text-[var(--accent-fg)] text-[12px] font-semibold cursor-pointer"
              >
                {t('access.saveAccess')}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 py-3.5 px-5 border-t border-t-[var(--border)]">
        <button onClick={shareTeam} className="h-[34px] py-0 px-3.5 border-0 rounded-[calc(var(--radius)_-_2px)] bg-[var(--accent)] text-[var(--accent-fg)] text-[12.5px] font-semibold cursor-pointer">
          {t('access.shareEntireTeam')}
        </button>
        <span className="flex-1" />
        <button
          onClick={() => copy(`${location.origin}/ichava/c/${collection.id}`, t('access.shareLinkCopied'))}
          className="h-[34px] py-0 px-3.5 border border-[var(--border)] rounded-[calc(var(--radius)_-_2px)] bg-[var(--bg)] text-[var(--fg)] text-[12.5px] cursor-pointer"
        >
          {t('access.copyLinkInstead')}
        </button>
      </div>
    </Modal>
  );
}

function Avatar({ m, i }: { m: TeamRef; i: number }) {
  return (
    <div style={{ width: 24, height: 24, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', background: PALETTE[i % PALETTE.length] }}>
      {m.initials}
    </div>
  );
}
