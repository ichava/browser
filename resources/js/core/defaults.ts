// Centralized runtime state defaults (plan: Configuration architecture). Derived
// ONCE from CONFIG_DEFAULTS so DEFAULT_FILTERS + factoryReset + the store initial
// state can't drift apart. A loaded config's `defaults.*` block may override these
// on first run; the store reads from here so there are no duplicated literals.

import { CONFIG_DEFAULTS } from './config';
import type { CopyFormat, Scale, Density, SizeUnit, SortKey, SortOrder, Theme, Treatment } from './types';

const D = CONFIG_DEFAULTS.defaults;

export interface FilterDefaults {
  search: string;
  packages: string[];
  categories: string[];
  subs: string[];
  variant: string | null;
  sortBy: SortKey;
  sortOrder: SortOrder;
  page: number;
  perPage: number;
}

export const DEFAULT_FILTERS: FilterDefaults = {
  search: '',
  packages: [...D.packages],
  categories: [],
  subs: [],
  variant: null,
  sortBy: D.sortBy,
  sortOrder: D.sortOrder,
  page: 1,
  perPage: D.perPage,
};

export const DEFAULT_APPEARANCE: {
  theme: Theme;
  accent: string;
  radius: number;
  scale: Scale;
  density: Density;
  reduceMotion: boolean;
  showLabels: boolean;
} = { ...D.appearance };

export const DEFAULT_RENDER: {
  size: number;
  sizeUnit: SizeUnit;
  gridStroke: number;
  color: string | null;
  treatment: Treatment;
  copyFormat: CopyFormat;
} = { ...D.render, treatment: D.render.treatment as Treatment };

export const DEFAULT_COLLECTIONS = D.collections.map((c) => ({ ...c, icons: [...c.icons] }));

export const HISTORY_CAP = CONFIG_DEFAULTS.limits.historyCap;
