// Notification seed (plan Part B). Demo activity shown on first run; after the user
// clears them the persisted (empty) list wins. DATA only.

export interface NotificationSeed {
  icon: string;
  text: string;
  /** minutes ago, for a realistic relative-time spread */
  ageMin: number;
  /** pre-read on seed (keeps the unread badge at 3). */
  read?: boolean;
}

export const NOTIFICATION_SEED: NotificationSeed[] = [
  { icon: 'info', text: 'Share link created for "Dashboard set"', ageMin: 0 },
  { icon: 'check', text: 'Signed in — collections and sharing unlocked', ageMin: 1 },
  { icon: 'info', text: 'Jonas D. added 3 icons to "Dashboard set"', ageMin: 8 },
  { icon: 'info', text: 'Preferences restored from local storage', ageMin: 20, read: true },
];
