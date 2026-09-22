
import { Modal } from '@js/components/ui/Modal';
import { Glyph } from '@js/components/ui/Glyph';
import { Select } from '@js/components/base/select/select';
import { Button } from '@js/components/base/buttons/button';
import { useT } from '@js/hooks/useT';
import { CONFIG_DEFAULTS } from '@js/core/config';
import type { CopyFormat } from '@js/core/types';
import { useAppStore } from '@js/hooks/useStoreApi';

export function SettingsDialog() {
  const t = useT();
  const closeLayer = useAppStore((s) => s.closeLayer);
  const perPage = useAppStore((s) => s.filters.perPage);
  const setPerPage = useAppStore((s) => s.setPerPage);
  const copyFormat = useAppStore((s) => s.copyFormat);
  const setCopyFormat = useAppStore((s) => s.setCopyFormat);
  const factoryReset = useAppStore((s) => s.factoryReset);
  const showToast = useAppStore((s) => s.showToast);
  const openLayer = useAppStore((s) => s.openLayer);
  const openConfirm = useAppStore((s) => s.openConfirm);
  const config = useAppStore((s) => s.config);
  const storageDriver = useAppStore((s) => s.storageDriver);
  const setStorageDriver = useAppStore((s) => s.setStorageDriver);
  const startTour = useAppStore((s) => s.startTour);
  const authed = useAppStore((s) => s.auth.status === 'authed');
  const authUser = useAppStore((s) => s.auth.user);
  const openAuth = useAppStore((s) => s.openAuth);
  const PER_PAGE = config?.ui.perPageOptions ?? CONFIG_DEFAULTS.ui.perPageOptions;
  const FORMATS = config?.toolbar.copyFormats ?? CONFIG_DEFAULTS.toolbar.copyFormats;
  const acct = authUser ?? (config ? { name: config.user.name, initials: config.user.initials, email: config.user.email, plan: config.user.plan } : null);

  return (
    <Modal showClose={false} onClose={closeLayer} width={480} panelStyle={{ overflowY: 'auto' }}>
      <div className="flex items-center gap-2 py-3 px-4 border-b border-b-[var(--border)] sticky top-0 bg-[var(--pop)] z-2">
        <span className="text-[13.5px] font-[600]">{t('header.settings')}</span>
        <span className="flex-1" />
        <button onClick={closeLayer} title={`${t('common.close')} — Esc`} className="w-[26px] h-[26px] border border-[var(--border)] bg-[var(--bg)] shadow-[var(--shadow)] rounded-[6px] cursor-pointer flex items-center justify-center text-[var(--muted-fg)]">
          <Glyph name="close" size={12} color="currentColor" />
        </button>
      </div>

      <div className="py-3.5 px-4 flex flex-col gap-3.5">
        <div className="flex items-center gap-2.5 py-2.5 px-3 border border-[var(--border)] rounded-[var(--radius)] bg-[var(--muted2)]">
          <div className="w-[26px] h-[26px] flex-none rounded-[7px] bg-[var(--accent-soft)] flex items-center justify-center">
            <Glyph name="palette" size={13} color="var(--accent-text)" />
          </div>
          <div className="flex-1 text-[11.5px] text-[var(--muted-fg)] leading-[1.5]">
            {t('settings.appearanceHintPre')}<b className="text-[var(--fg)]">{t('appearance.title')}</b>{t('settings.appearanceHintPost')}
          </div>
        </div>

        <SectionLabel>{t('settings.behavior')}</SectionLabel>

        <SettingRow title={t('settings.perPageTitle')} desc={t('settings.perPageDesc')}>
          <Select
            size="sm"
            aria-label={t('settings.perPageTitle')}
            items={PER_PAGE.map((n) => ({ id: n, label: String(n) }))}
            selectedKey={perPage}
            onSelectionChange={(key) => setPerPage(Number(key))}
            className="w-28"
          >
            {(item) => <Select.Item {...item} />}
          </Select>
        </SettingRow>

        <SettingRow title={t('settings.copyFormatTitle')} desc={t('settings.copyFormatDesc')}>
          <Select
            size="sm"
            aria-label={t('settings.copyFormatTitle')}
            items={FORMATS.map((f) => ({ id: f.id, label: f.label }))}
            selectedKey={copyFormat}
            onSelectionChange={(key) => setCopyFormat(key as CopyFormat)}
            className="w-40"
          >
            {(item) => <Select.Item {...item} />}
          </Select>
        </SettingRow>

        <SettingRow title={t('settings.storageTitle')} desc={t('settings.storageDesc')}>
          <div className="inline-flex gap-0.5 border border-[var(--border)] rounded-[calc(var(--radius)_-_3px)] p-0.5">
            {(['local', 'session'] as const).map((d) => (
              <button key={d} onClick={() => setStorageDriver(d)} style={{ height: 22, padding: '0 10px', border: 'none', borderRadius: 4, background: storageDriver === d ? 'var(--accent-soft)' : 'transparent', color: storageDriver === d ? 'var(--accent)' : 'var(--muted-fg)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{d === 'local' ? t('settings.storageLocal') : t('settings.storageSession')}</button>
            ))}
          </div>
        </SettingRow>

        <SettingRow title={t('settings.tourTitle')} desc={t('settings.tourDesc')}>
          <button onClick={() => { startTour(); closeLayer(); }} style={btn}>{t('settings.replayTour')}</button>
        </SettingRow>

        <SettingRow title={t('settings.factoryTitle')} desc={t('settings.factoryDesc')}>
          <button
            onClick={() => openConfirm({ title: t('settings.factoryConfirmTitle'), body: t('settings.factoryConfirmBody'), confirmLabel: t('settings.factoryConfirmLabel'), danger: true, onConfirm: () => { factoryReset(); showToast(t('settings.factoryToast'), 'refresh'); } })}
            className="h-[26px] py-0 px-2.5 border border-[var(--border)] rounded-[calc(var(--radius)_-_3px)] bg-transparent text-[var(--danger)] text-[11.5px] cursor-pointer"
          >
            {t('settings.resetEverything')}
          </button>
        </SettingRow>

        <div className="h-[1px] bg-[var(--border)]" />
        <SectionLabel>{t('settings.account')}</SectionLabel>
        {authed && acct ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-[11.5px] font-bold flex items-center justify-center flex-none">{acct.initials}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-[600]">
                {acct.name}{' '}
                <span className="text-[9px] font-semibold text-[var(--accent-text)] bg-[var(--accent-soft)] rounded-[4px] py-[1px] px-[5px]">{acct.plan}</span>
              </div>
              <div className="text-[11px] text-[var(--muted-fg)]">{acct.email} · {t('settings.syncNote')}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 py-3 px-3.5 border border-dashed border-[var(--border)] rounded-[var(--radius)]">
            <Glyph name="info" size={15} color="var(--muted-fg)" />
            <div className="flex-1 text-[11.5px] text-[var(--muted-fg)] leading-[1.5]">
              {t('settings.guestNote')}
            </div>
            <Button size="sm" className="flex-none" onClick={() => { openAuth('signin'); closeLayer(); }}>{t('common.signIn')}</Button>
          </div>
        )}
      </div>

      <div className="py-2.5 px-4 border-t border-t-[var(--border)] flex items-center text-[10.5px] text-[var(--faint-fg)]">
        <span>© 2026 Simtabi LLC · ichava/browser v{config?.meta.version ?? '1.4.0'} · MIT</span>
        <span className="flex-1" />
        <button onClick={() => openLayer('about')} className="border-0 bg-transparent text-[var(--accent-text)] text-[10.5px] cursor-pointer p-0.5 font-semibold">{t('settings.aboutLink')}</button>
      </div>
    </Modal>
  );
}

const btn: React.CSSProperties = {
  height: 26,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '0 10px',
  border: '1px solid var(--border)',
  borderRadius: 'calc(var(--radius) - 3px)',
  background: 'var(--bg)',
  color: 'var(--fg)',
  fontSize: 11.5,
  cursor: 'pointer',
};
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10.5px] font-semibold text-[var(--faint-fg)]">{children}</div>
);
function SettingRow({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <div className="text-[12.5px] font-[550]">{title}</div>
        <div className="text-[11px] text-[var(--muted-fg)]">{desc}</div>
      </div>
      {children}
    </div>
  );
}
