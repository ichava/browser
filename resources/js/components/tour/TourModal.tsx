
import { Modal } from '@js/components/ui/Modal';
import { Glyph } from '@js/components/ui/Glyph';
import { useT } from '@js/hooks/useT';
import { TOUR_STEPS } from '@js/components/tour/steps';
import { useAppStore } from '@js/hooks/useStoreApi';

/**
 * TourModal — the 5-step first-run onboarding (plan Part B). Shown on first load
 * (until `tourSeen`) and replayable from Settings / the help menu. Progress dots +
 * Skip/Next; the final step's Next ends the tour.
 */
export function TourModal() {
  const step = useAppStore((s) => s.tour.step);
  const next = useAppStore((s) => s.nextTourStep);
  const skip = useAppStore((s) => s.skipTour);
  const end = useAppStore((s) => s.endTour);
  const t = useT();

  const total = TOUR_STEPS.length;
  const s = TOUR_STEPS[Math.min(step, total - 1)]!;
  const last = step >= total - 1;

  return (
    <Modal onClose={skip} width={460} label={t('settings.tourTitle')} panelStyle={{ padding: 26 }}>
      <div className="w-[42px] h-[42px] rounded-[11px] bg-[var(--accent-soft)] text-[var(--accent-text)] flex items-center justify-center mb-4">
        <Glyph name={s.icon} size={22} color="currentColor" />
      </div>
      <div className="text-[19px] font-[700] mb-2">{t(s.titleKey)}</div>
      <div className="text-[13px] text-[var(--muted-fg)] leading-[1.6]">{t(s.bodyKey)}</div>

      <div className="flex items-center mt-6">
        <div className="flex gap-1.5">
          {TOUR_STEPS.map((_, i) => (
            <span key={i} style={{ width: i === step ? 18 : 7, height: 7, borderRadius: 4, background: i === step ? 'var(--accent)' : 'var(--border)', transition: 'width .2s' }} />
          ))}
        </div>
        <span className="flex-1" />
        <button onClick={skip} className="border-0 bg-transparent text-[var(--muted-fg)] text-[13px] font-semibold cursor-pointer py-0 px-3.5">
          {t('tour.skip')}
        </button>
        <button
          onClick={() => (last ? end() : next())}
          className="h-[38px] py-0 px-5 border-0 rounded-[calc(var(--radius)_-_1px)] bg-[var(--accent)] text-[var(--accent-fg)] text-[13px] font-[650] cursor-pointer"
        >
          {last ? t('tour.getStarted') : t('tour.next')}
        </button>
      </div>
    </Modal>
  );
}
