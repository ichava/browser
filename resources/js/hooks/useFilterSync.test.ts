import { describe, expect, it } from 'vitest';
import { toQueryParams } from './useFilterSync';
import type { FilterState } from '@/store';

const base = (overrides: Partial<FilterState> = {}): FilterState =>
  ({
    search: '',
    packages: [],
    categories: [],
    subs: [],
    variant: null,
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1,
    perPage: 60,
    ...overrides,
  }) as FilterState;

describe('toQueryParams', () => {
  it('omits empty filters so the URL stays clean', () => {
    expect(toQueryParams(base())).toEqual({
      search: undefined,
      packages: undefined,
      categories: undefined,
      variants: undefined,
      sort_by: 'name',
      sort_direction: 'asc',
      page: 1,
      per_page: 60,
    });
  });

  it('drops sub-minimum search queries the server would reject', () => {
    expect(toQueryParams(base({ search: 'a' })).search).toBeUndefined();
    expect(toQueryParams(base({ search: 'ab' })).search).toBe('ab');
  });

  it('maps the single client variant onto the server array', () => {
    expect(toQueryParams(base({ variant: 'filled' })).variants).toEqual(['filled']);
  });

  it('clamps per_page to the server maximum', () => {
    expect(toQueryParams(base({ perPage: 240 })).per_page).toBe(120);
  });
});
