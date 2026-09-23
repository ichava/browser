import { router, usePage } from '@inertiajs/react';
import type { IconId } from '@js/core/model';
import type { IchavaShared } from '@js/types';

/**
 * Server mutations for library state (Phase 5, pessimistic).
 *
 * Every writer goes to Laravel and the response refreshes the affected
 * props, which the hydration effects fold back into the store -- the UI
 * never mutates library state locally. Reads stay client-side.
 *
 * Client action verbs differ from the server enum (`viewed` vs `view`),
 * so history logging maps them here, at the single boundary, rather than
 * in every call site.
 */
const HISTORY_VERBS: Record<string, string> = {
  viewed: 'view',
  copied: 'copy',
  downloaded: 'download',
};

const LIBRARY_PROPS = ['favorites', 'collections', 'history', 'commandHistory'];

/**
 * Feedback props every mutation reload carries: the server answers
 * mutations with flash messages and validation redirects with errors,
 * and partial reloads omit anything not listed.
 */
const WITH_FEEDBACK = ['flash', 'errors'];

export function useInertiaMutations() {
  const { props } = usePage<{ ichava: IchavaShared }>();
  const routes = props.ichava.routes;

  return {
    toggleFavorite: (id: IconId) =>
      router.post(`${routes.favorites}/${id}/toggle`, {}, { preserveState: true, only: [...LIBRARY_PROPS, ...WITH_FEEDBACK] }),

    pushHistory: (id: IconId, action: string) =>
      router.post(
        routes.history,
        { icon_id: id, action: HISTORY_VERBS[action] ?? action },
        { preserveState: true, only: ['history', ...WITH_FEEDBACK] },
      ),

    logCommand: (command: string, type: 'action' | 'search' | 'navigation', metadata: Record<string, string | number | boolean | null> = {}) =>
      router.post(routes.commands, { command, type, metadata }, { preserveState: true, only: ['commandHistory', ...WITH_FEEDBACK] }),

    createCollection: (name: string) =>
      router.post(routes.collections, { name }, { preserveState: false }),

    updateCollection: (id: string, data: { name?: string; color?: string | null }) =>
      router.put(`${routes.collections}/${id}`, data, { preserveState: true, only: ['collections', ...WITH_FEEDBACK] }),

    deleteCollection: (id: string) =>
      router.delete(`${routes.collections}/${id}`, { preserveState: true, only: ['collections', ...WITH_FEEDBACK] }),

    addToCollection: (collectionId: string, iconId: IconId) =>
      router.post(`${routes.collections}/${collectionId}/icons/${iconId}`, {}, { preserveState: true, only: ['collections', ...WITH_FEEDBACK] }),

    removeFromCollection: (collectionId: string, iconId: IconId) =>
      router.delete(`${routes.collections}/${collectionId}/icons/${iconId}`, { preserveState: true, only: ['collections', ...WITH_FEEDBACK] }),

    clearHistory: () =>
      router.delete(routes.history, { preserveState: true, only: ['history', ...WITH_FEEDBACK] }),

    clearCache: () =>
      router.post(routes.cache.clear, {}, { preserveState: true, only: ['cacheStats', 'cacheHealthy', ...WITH_FEEDBACK] }),

    rebuildCache: () =>
      router.post(routes.cache.rebuild, {}, { preserveState: true, only: ['cacheStats', 'cacheHealthy', ...WITH_FEEDBACK] }),
  };
}
