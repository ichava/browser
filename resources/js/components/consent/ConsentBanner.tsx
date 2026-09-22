
import { Glyph } from '@js/components/ui/Glyph';
import { Button } from '@js/components/base/buttons/button';
import { useT } from '@js/hooks/useT';
import { useAppStore } from '@js/hooks/useStoreApi';

/**
 * ConsentBanner — the "Cookies & storage" notice (plan Part B). Shown until a
 * choice is recorded (persisted). Cosmetic: there is no real tracking to gate —
 * it just records the dismissal so it doesn't reappear.
 */
export function ConsentBanner() {
  const setConsent = useAppStore((s) => s.setConsent);
  const t = useT();

  return (
    <div
      role="dialog"
      aria-label={t('consent.ariaLabel')}
      className="fixed start-4 bottom-4 z-70 w-[340px] max-w-[calc(100vw_-_32px)] bg-[var(--pop)] border border-[var(--border)] rounded-[calc(var(--radius)_+_2px)] shadow-[var(--shadow-elevated)] p-4 [animation:ichRise_.2s_ease]"
    >
      <div className="flex items-center gap-2 mb-2">
        <Glyph name="info" size={15} color="var(--accent-text)" />
        <span className="text-[13.5px] font-[650]">{t('consent.title')}</span>
      </div>
      <div className="text-[12px] text-[var(--muted-fg)] leading-[1.55]">
        {t('consent.body')}
      </div>
      <div className="flex justify-end gap-2 mt-3.5">
        <Button color="secondary" size="sm" onClick={() => setConsent('essential')}>
          {t('consent.essentialOnly')}
        </Button>
        <Button size="sm" onClick={() => setConsent('all')}>
          {t('consent.acceptAll')}
        </Button>
      </div>
    </div>
  );
}
