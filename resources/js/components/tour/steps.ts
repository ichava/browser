// Product-tour step content (plan Part B). DATA — a config `boot`/`tour` block may
// override these later; kept as a typed constant for now.

// Steps carry i18n KEYS (resolved by TourModal via t()) rather than literal copy,
// so the tour translates with the rest of the app.
export interface TourStep {
  icon: string;
  titleKey: string;
  bodyKey: string;
}

export const TOUR_STEPS: TourStep[] = [
  { icon: 'sparkles', titleKey: 'tour.s1Title', bodyKey: 'tour.s1Body' },
  { icon: 'search', titleKey: 'tour.s2Title', bodyKey: 'tour.s2Body' },
  { icon: 'palette', titleKey: 'tour.s3Title', bodyKey: 'tour.s3Body' },
  { icon: 'copy', titleKey: 'tour.s4Title', bodyKey: 'tour.s4Body' },
  { icon: 'folder', titleKey: 'tour.s5Title', bodyKey: 'tour.s5Body' },
];
