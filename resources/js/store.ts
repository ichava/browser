import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';
import type { CopyFormat, SizeUnit, SortKey, SortOrder, Theme, Treatment, Scale, Density } from '@/core/types';
import type { Catalog, CategoryGroup } from '@/core/IconRepository';
import type { Filters, IconId, PageResult } from '@/core/model';
import type { ListParams } from '@/core/api/ApiClient';
import type { AppConfig } from '@/core/config';
import { DEFAULT_FILTERS, DEFAULT_APPEARANCE, DEFAULT_RENDER, DEFAULT_COLLECTIONS, HISTORY_CAP } from '@/core/defaults';
import { devbus } from '@/core/devbus';
import { driverStorage, switchDriver, getDriver, HAD_PERSISTED_STATE, type StorageDriver } from '@/core/storage';
import { CONFIG_DEFAULTS } from '@/core/config';
import { NOTIFICATION_SEED } from '@/core/notifications';
import { type Locale } from '@/core/i18n';
import { loadSharedLocale, saveSharedLocale } from '@/core/localeShare';

export type { Locale };

export type { Scale, Density, AppConfig, StorageDriver };
export type LibTab = 'favorites' | 'history' | 'collections';
export type Plan = 'FREE' | 'PRO' | 'TEAM';
export type AuthStatus = 'guest' | 'authed';
export type AuthView = null | 'signin' | 'create' | 'signout';
export type DevToolsTab = 'events' | 'state' | 'storage' | 'tests' | 'logs' | 'boot';
export type BootPhase = 'idle' | 'config' | 'catalog' | 'index' | 'hydrate' | 'ready';

export interface AuthUser {
  name: string;
  initials: string;
  email: string;
  plan: Plan;
}
export interface AppNotification {
  id: string;
  icon: string;
  text: string;
  ts: number;
  read: boolean;
}
export interface DevToolsEvent {
  kind: string;
  label: string;
  payload?: unknown;
  ts: number;
}
export interface TeamRef {
  initials: string;
  name: string;
}
export interface BootStateSlice {
  phase: BootPhase;
  progress: number;
  label: string;
  done: boolean;
}
export type SearchScope = 'all' | 'icons' | 'packages' | 'categories';
export type Layer = null | 'palette' | 'library' | 'settings' | 'about' | 'detail' | 'profile';

export interface HistoryEntry {
  id: IconId;
  action: string;
  ts: number;
}
export interface Collection {
  id: string;
  name: string;
  icons: IconId[];
  shared?: boolean;
  role?: 'editor' | 'viewer';
  sharedWith?: TeamRef[];
}
/** UI-level filter state. Mapped to `ListParams` by `useRepo` (single variant → variants[]). */
export interface FilterState {
  search: string;
  packages: string[];
  categories: string[];
  /** subcategory keys, `category/sub` (globally unique). */
  subs: string[];
  variant: string | null;
  sortBy: SortKey;
  sortOrder: SortOrder;
  page: number;
  perPage: number;
}

export function toListParams(f: FilterState): ListParams {
  return {
    search: f.search,
    packages: f.packages,
    categories: f.categories,
    subs: f.subs,
    variants: f.variant ? [f.variant] : [],
    page: f.page,
    perPage: f.perPage,
    sortBy: f.sortBy,
    sortDirection: f.sortOrder,
  };
}

export interface BrowserStore {
  catalog: Catalog | null;
  filtersData: Filters | null;
  config: AppConfig | null;
  loading: boolean;
  activeWorkspaceId: string | null;
  setCatalog: (c: Catalog) => void;
  setFiltersData: (f: Filters) => void;
  setConfig: (c: AppConfig) => void;
  setActiveWorkspace: (id: string) => void;

  /**
   * Server-driven listing state (Inertia pages).
   *
   * The loaded catalog holds one server page of icons; these slices carry
   * the corpus-wide truth (totals, page counts, full tree) so the footer
   * and sidebar render server numbers instead of loaded-set numbers.
   * `useRepo` prefers them whenever set. Null outside Inertia pages.
   */
  serverPage: Pick<PageResult, 'total' | 'page' | 'perPage' | 'lastPage' | 'rangeStart' | 'rangeEnd'> | null;
  serverTree: CategoryGroup[] | null;
  setServerPage: (p: BrowserStore['serverPage']) => void;
  setServerTree: (t: CategoryGroup[] | null) => void;

  theme: Theme;
  accent: string;
  radius: number;
  scale: Scale;
  density: Density;
  reduceMotion: boolean;
  showLabels: boolean;
  locale: Locale;
  setLocale: (l: Locale) => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setAccent: (hex: string) => void;
  setRadius: (n: number) => void;
  setScale: (s: Scale) => void;
  setDensity: (d: Density) => void;
  toggleReduceMotion: () => void;
  toggleLabels: () => void;

  filters: FilterState;
  view: 'grid' | 'list';
  catQ: string;
  collapsedGroups: string[];
  /** categories expanded to reveal their subcategories (keys = `pack/category`). */
  expandedCats: string[];
  searchScope: SearchScope;
  packageQuery: string;
  sidebarOpen: boolean;
  setSearchScope: (s: SearchScope) => void;
  setPackageQuery: (v: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (v: boolean) => void;
  setSearch: (v: string) => void;
  clearSearch: () => void;
  togglePackage: (id: string) => void;
  selectAllPacks: (all: string[]) => void;
  clearPacks: () => void;
  toggleCat: (name: string) => void;
  toggleSub: (category: string, sub: string) => void;
  clearCats: () => void;
  setVariant: (v: string | null) => void;
  setSort: (k: SortKey) => void;
  toggleOrder: () => void;
  setPage: (n: number) => void;
  nextPage: (max: number) => void;
  prevPage: () => void;
  setPerPage: (n: number) => void;
  setView: (v: 'grid' | 'list') => void;
  setCatQ: (v: string) => void;
  toggleGroup: (pack: string) => void;
  toggleCatExpand: (key: string) => void;
  /** expand every group + category-with-subs, or collapse all if already expanded. */
  toggleExpandAll: (allGroups: string[], allCatKeys: string[]) => void;
  resetFilters: () => void;

  size: number;
  sizeUnit: SizeUnit;
  gridStroke: number;
  color: string | null;
  treatment: Treatment;
  copyFormat: CopyFormat;
  setSize: (n: number) => void;
  setSizeUnit: (u: SizeUnit) => void;
  setGridStroke: (n: number) => void;
  setColor: (c: string | null) => void;
  setTreatment: (t: Treatment) => void;
  setCopyFormat: (f: CopyFormat) => void;

  selection: IconId[];
  toggleSelect: (id: IconId) => void;
  clearSelection: () => void;

  favorites: IconId[];
  history: HistoryEntry[];
  collections: Collection[];
  toggleFavorite: (id: IconId) => void;
  pushHistory: (id: IconId, action: string) => void;
  clearHistory: () => void;
  createCollection: (name: string) => void;
  renameCollection: (id: string, name: string) => void;
  removeCollection: (id: string) => void;
  addToCollection: (collId: string, iconId: IconId) => void;
  removeFromCollection: (collId: string, iconId: IconId) => void;

  layer: Layer;
  detailId: IconId | null;
  libTab: LibTab;
  openLayer: (l: Layer) => void;
  closeLayer: () => void;
  openDetail: (id: IconId) => void;
  openLibrary: (tab: LibTab) => void;

  /** Live toast queue. Rendered by `Toaster`; the store never touches the DOM. */
  toasts: { id: number; msg: string; icon: string }[];
  showToast: (msg: string, icon?: string) => void;
  dismissToast: (id: number) => void;

  // reusable data-driven context menu (plan Part D): any component supplies items
  ctx: { x: number; y: number; title?: string; items: ContextMenuItem[] } | null;
  openCtx: (x: number, y: number, items: ContextMenuItem[], title?: string) => void;
  closeCtx: () => void;

  // selection (setSelection added for "Select all on this page")
  setSelection: (ids: IconId[]) => void;

  // auth (frontend demo — plan Part B)
  auth: { status: AuthStatus; user: AuthUser | null };
  authView: AuthView;
  authReason: string | null;
  authInitialized: boolean;
  openAuth: (view: Exclude<AuthView, null>, reason?: string) => void;
  closeAuth: () => void;
  signIn: (email: string, code: string) => boolean;
  createAccount: (p: { first: string; last: string; email: string }) => void;
  signOut: () => void;

  // notifications
  notifications: AppNotification[];
  pushNotification: (n: { icon: string; text: string }) => void;
  markNotificationsRead: () => void;
  clearNotifications: () => void;
  /**
   * Load the fabricated notification feed. Called once by the app when
   * `features.demo` is on, never on its own -- the seed used to be applied at
   * module init, which made invented activity a product default that no host
   * could switch off.
   */
  seedDemoNotifications: () => void;

  // devtools (ephemeral)
  devtools: { open: boolean; tab: DevToolsTab; events: DevToolsEvent[]; capturing: boolean };
  toggleDevtools: () => void;
  setDevToolsTab: (t: DevToolsTab) => void;
  pushDevEvent: (e: DevToolsEvent) => void;
  clearDevEvents: () => void;
  setCapturing: (v: boolean) => void;

  // team collaboration (mock)
  inviteOpen: boolean;
  accessCollectionId: string | null;
  sharedOpen: boolean;
  openShared: () => void;
  closeShared: () => void;
  openInvite: () => void;
  closeInvite: () => void;
  openAccess: (id: string) => void;
  closeAccess: () => void;
  shareCollection: (id: string, opts: { role: 'editor' | 'viewer'; sharedWith: TeamRef[] }) => void;

  // storage driver (real)
  storageDriver: StorageDriver;
  setStorageDriver: (d: StorageDriver) => void;

  // product tour
  tour: { active: boolean; step: number };
  tourSeen: boolean;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  skipTour: () => void;
  endTour: () => void;

  // cookie consent
  consent: 'essential' | 'all' | null;
  setConsent: (c: 'essential' | 'all') => void;

  // boot (mirror of the splash phases for the DevTools Boot tab)
  boot: BootStateSlice;
  setBoot: (b: Partial<BootStateSlice>) => void;

  // shared confirm dialog (reset-filters, factory-reset, …)
  confirm: ConfirmSpec | null;
  openConfirm: (c: ConfirmSpec) => void;
  closeConfirm: () => void;

  factoryReset: () => void;
}

export interface ContextMenuItem {
  label: string;
  icon?: string;
  run?: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
  kbd?: string;
}

export interface ConfirmSpec {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

/**
 * Apply the config's `defaults` block — but only on a first run.
 *
 * These keys are all persisted, so on any later visit the user's own choices are
 * authoritative and this returns nothing. Precedence, lowest to highest:
 *
 *   core defaults  ->  config.defaults (server / app-config.json / mount options)
 *                  ->  the user's persisted state
 *
 * Without this the whole `defaults` block was inert: the store initialises from
 * CONFIG_DEFAULTS at module load, the config arrives later via setConfig, and
 * nothing ever read it. A host could not change the default package selection,
 * page size, sort, appearance or render options at all.
 */
function configDefaults(c: AppConfig): Partial<BrowserStore> {
  if (HAD_PERSISTED_STATE) return {};
  const d = c.defaults;
  if (!d) return {};
  const a = d.appearance;
  const r = d.render;
  return {
    filters: {
      ...DEFAULT_FILTERS,
      packages: d.packages ?? DEFAULT_FILTERS.packages,
      perPage: d.perPage ?? DEFAULT_FILTERS.perPage,
      sortBy: d.sortBy ?? DEFAULT_FILTERS.sortBy,
      sortOrder: d.sortOrder ?? DEFAULT_FILTERS.sortOrder,
    },
    ...(a && {
      theme: a.theme ?? DEFAULT_APPEARANCE.theme,
      accent: a.accent ?? DEFAULT_APPEARANCE.accent,
      radius: a.radius ?? DEFAULT_APPEARANCE.radius,
      scale: a.scale ?? DEFAULT_APPEARANCE.scale,
      density: a.density ?? DEFAULT_APPEARANCE.density,
      reduceMotion: a.reduceMotion ?? DEFAULT_APPEARANCE.reduceMotion,
      showLabels: a.showLabels ?? DEFAULT_APPEARANCE.showLabels,
    }),
    ...(r && {
      size: r.size ?? DEFAULT_RENDER.size,
      sizeUnit: r.sizeUnit ?? DEFAULT_RENDER.sizeUnit,
      gridStroke: r.gridStroke ?? DEFAULT_RENDER.gridStroke,
      color: r.color ?? DEFAULT_RENDER.color,
      treatment: r.treatment ?? DEFAULT_RENDER.treatment,
      copyFormat: r.copyFormat ?? DEFAULT_RENDER.copyFormat,
    }),
    ...(d.collections?.length ? { collections: d.collections } : {}),
  } as Partial<BrowserStore>;
}

let notifKey = 0;
let collSeq = 0;
const initials2 = (a: string, b?: string): string =>
  ((a?.[0] ?? '') + (b?.[0] ?? a?.[1] ?? '')).toUpperCase() || '??';

/**
 * An in-memory PersistStorage for stores that must not persist. Used when
 * `persistKey` is null: a secondary mount should not write another mount's
 * preferences, and two stores sharing one key would sync through storage and stop
 * being independent at all.
 */
const ephemeralStorage: PersistStorage<unknown> = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export interface CreateStoreOptions {
  /**
   * localStorage key for the persisted slice. Pass a distinct key for a second
   * mount that should keep its own preferences, or `null` to not persist at all.
   *
   * Two stores sharing one key are not independent: they would sync through
   * storage even though they are separate instances.
   */
  persistKey?: string | null;
}

/**
 * Build a browser store.
 *
 * Exists so a store can be created PER MOUNT. The module-level `useStore` below is
 * the default instance for the standalone app; two `<IchavaBrowser>` instances on one
 * page each get their own, so they no longer share filters, selection, favorites and
 * theme.
 *
 * Note the creator takes `(set, get)`. It previously took `(set)` alone, which is why
 * five actions reached for `useStore.getState()` -- meaning a per-mount store's own
 * actions would have read and written the singleton rather than themselves. That had
 * to be fixed before per-mount instances could work at all.
 */
/** Monotonic toast id; see `showToast`. */
let toastSeq = 0;

export function createBrowserStore({ persistKey = CONFIG_DEFAULTS.storageKeys.persist }: CreateStoreOptions = {}) {
  return create<BrowserStore>()(
  persist(
    (set, get) => ({
      catalog: null,
      filtersData: null,
      config: null,
      loading: true,
      activeWorkspaceId: null,
      setCatalog: (c) => set({ catalog: c, loading: false }),
      setFiltersData: (f) => set({ filtersData: f }),
      setConfig: (c) =>
        set((s) => {
          // Seed auth from config only once (guard against per-mount clobber of a
          // persisted sign-out). First run reflects config.user.mode.
          const seedAuth =
            !s.authInitialized && c.user.mode === 'authenticated'
              ? {
                  auth: {
                    status: 'authed' as AuthStatus,
                    user: { name: c.user.name, initials: c.user.initials, email: c.user.email, plan: c.user.plan as Plan },
                  },
                  authInitialized: true,
                }
              : {};
          // Keep a persisted, still-valid workspace choice; else seed from config.
          const persistedWs = s.activeWorkspaceId && c.user.workspaces.some((w) => w.id === s.activeWorkspaceId) ? s.activeWorkspaceId : null;
          return {
            config: c,
            activeWorkspaceId: persistedWs ?? c.user.workspaces.find((w) => w.active)?.id ?? c.user.workspaces[0]?.id ?? null,
            ...seedAuth,
            ...configDefaults(c),
          };
        }),
      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

      serverPage: null,
      serverTree: null,
      setServerPage: (p) => set({ serverPage: p }),
      setServerTree: (t) => set({ serverTree: t }),

      theme: DEFAULT_APPEARANCE.theme,
      accent: DEFAULT_APPEARANCE.accent,
      radius: DEFAULT_APPEARANCE.radius,
      scale: DEFAULT_APPEARANCE.scale,
      density: DEFAULT_APPEARANCE.density,
      reduceMotion: DEFAULT_APPEARANCE.reduceMotion,
      showLabels: DEFAULT_APPEARANCE.showLabels,
      locale: loadSharedLocale(),
      setLocale: (l) => { saveSharedLocale(l); set({ locale: l }); },
      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setAccent: (hex) => set({ accent: hex }),
      setRadius: (n) => set({ radius: n }),
      setScale: (sc) => set({ scale: sc }),
      setDensity: (d) => set({ density: d }),
      toggleReduceMotion: () => set((s) => ({ reduceMotion: !s.reduceMotion })),
      toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),

      filters: DEFAULT_FILTERS,
      view: 'grid',
      catQ: '',
      collapsedGroups: [],
      expandedCats: [],
      searchScope: 'icons',
      packageQuery: '',
      sidebarOpen: false,
      setSearchScope: (sc) => set({ searchScope: sc }),
      setPackageQuery: (v) => set({ packageQuery: v }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      setSearch: (v) => set((s) => ({ filters: { ...s.filters, search: v, page: 1 } })),
      clearSearch: () => set((s) => ({ filters: { ...s.filters, search: '', page: 1 } })),
      togglePackage: (id) =>
        set((s) => {
          const has = s.filters.packages.includes(id);
          return { filters: { ...s.filters, packages: has ? s.filters.packages.filter((p) => p !== id) : [...s.filters.packages, id], page: 1 } };
        }),
      selectAllPacks: (all) => set((s) => ({ filters: { ...s.filters, packages: all, page: 1 } })),
      clearPacks: () => set((s) => ({ filters: { ...s.filters, packages: [], page: 1 } })),
      toggleCat: (name) =>
        set((s) => {
          const has = s.filters.categories.includes(name);
          return { filters: { ...s.filters, categories: has ? s.filters.categories.filter((c) => c !== name) : [...s.filters.categories, name], page: 1 } };
        }),
      toggleSub: (category, sub) =>
        set((s) => {
          const key = `${category}/${sub}`;
          const has = s.filters.subs.includes(key);
          return { filters: { ...s.filters, subs: has ? s.filters.subs.filter((k) => k !== key) : [...s.filters.subs, key], page: 1 } };
        }),
      clearCats: () => set((s) => ({ filters: { ...s.filters, categories: [], subs: [], page: 1 } })),
      setVariant: (v) => set((s) => ({ filters: { ...s.filters, variant: s.filters.variant === v ? null : v, page: 1 } })),
      setSort: (k) => set((s) => ({ filters: { ...s.filters, sortBy: k } })),
      toggleOrder: () => set((s) => ({ filters: { ...s.filters, sortOrder: s.filters.sortOrder === 'asc' ? 'desc' : 'asc' } })),
      setPage: (n) => set((s) => ({ filters: { ...s.filters, page: n } })),
      nextPage: (max) => set((s) => ({ filters: { ...s.filters, page: Math.min(max, s.filters.page + 1) } })),
      prevPage: () => set((s) => ({ filters: { ...s.filters, page: Math.max(1, s.filters.page - 1) } })),
      setPerPage: (n) => set((s) => ({ filters: { ...s.filters, perPage: n, page: 1 } })),
      setView: (v) => set({ view: v }),
      setCatQ: (v) => set({ catQ: v }),
      toggleGroup: (pack) =>
        set((s) => ({ collapsedGroups: s.collapsedGroups.includes(pack) ? s.collapsedGroups.filter((p) => p !== pack) : [...s.collapsedGroups, pack] })),
      toggleCatExpand: (key) =>
        set((s) => ({ expandedCats: s.expandedCats.includes(key) ? s.expandedCats.filter((k) => k !== key) : [...s.expandedCats, key] })),
      toggleExpandAll: (allGroups, allCatKeys) =>
        set((s) => {
          const fullyExpanded = s.collapsedGroups.length === 0 && allCatKeys.every((k) => s.expandedCats.includes(k));
          return fullyExpanded
            ? { collapsedGroups: [...allGroups], expandedCats: [] }
            : { collapsedGroups: [], expandedCats: [...allCatKeys] };
        }),
      resetFilters: () => set((s) => ({ filters: { ...DEFAULT_FILTERS, packages: s.filters.packages }, catQ: '', color: null, treatment: 'default', selection: [] })),

      size: DEFAULT_RENDER.size,
      sizeUnit: DEFAULT_RENDER.sizeUnit,
      gridStroke: DEFAULT_RENDER.gridStroke,
      color: DEFAULT_RENDER.color,
      treatment: DEFAULT_RENDER.treatment,
      copyFormat: DEFAULT_RENDER.copyFormat,
      setSize: (n) => set({ size: n }),
      setSizeUnit: (u) => set({ sizeUnit: u }),
      setGridStroke: (n) => set({ gridStroke: n }),
      setColor: (c) => set({ color: c }),
      setTreatment: (t) => set({ treatment: t }),
      setCopyFormat: (f) => set({ copyFormat: f }),

      selection: [],
      toggleSelect: (id) => set((s) => ({ selection: s.selection.includes(id) ? s.selection.filter((x) => x !== id) : [...s.selection, id] })),
      clearSelection: () => set({ selection: [] }),

      favorites: [],
      history: [],
      collections: DEFAULT_COLLECTIONS.map((c) => ({ ...c, icons: [...c.icons] })),
      toggleFavorite: (id) => set((s) => ({ favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [id, ...s.favorites] })),
      pushHistory: (id, action) =>
        set((s) => ({ history: [{ id, action, ts: Date.now() }, ...s.history.filter((h) => !(h.id === id && h.action === action))].slice(0, HISTORY_CAP) })),
      clearHistory: () => set({ history: [] }),
      createCollection: (name) =>
        set((s) => {
          const clean = name.trim();
          if (!clean) return {};
          // Stable unique id (session counter + timestamp) — length-derived ids
          // collided after a delete and mutated the wrong collection.
          const id = `c-${Date.now().toString(36)}${(++collSeq).toString(36)}`;
          return { collections: [...s.collections, { id, name: clean, icons: [] }] };
        }),
      renameCollection: (id, name) => set((s) => ({ collections: s.collections.map((c) => (c.id === id ? { ...c, name: name.trim() || c.name } : c)) })),
      removeCollection: (id) => set((s) => ({ collections: s.collections.filter((c) => c.id !== id) })),
      addToCollection: (collId, iconId) =>
        set((s) => ({ collections: s.collections.map((c) => (c.id === collId && !c.icons.includes(iconId) ? { ...c, icons: [...c.icons, iconId] } : c)) })),
      removeFromCollection: (collId, iconId) =>
        set((s) => ({ collections: s.collections.map((c) => (c.id === collId ? { ...c, icons: c.icons.filter((i) => i !== iconId) } : c)) })),

      layer: null,
      detailId: null,
      libTab: 'favorites',
      openLayer: (l) => set({ layer: l }),
      closeLayer: () => set({ layer: null, detailId: null }),
      openDetail: (id) => set({ layer: 'detail', detailId: id }),
      openLibrary: (tab) => set({ layer: 'library', libTab: tab }),

      /*
       * Toasts are STATE, not a side effect into a UI library.
       *
       * This called `sonner` directly, which put a UI import in the state layer -- finding
       * A7. The store now appends to a queue and `Toaster` renders it, so the store has no
       * opinion about how a toast looks, tests can assert on the queue, and a host
       * embedding the browser can render them its own way.
       *
       * Ids come from a monotonic counter rather than a timestamp, so two toasts raised in
       * the same millisecond cannot collide on their React key.
       */
      showToast: (msg, icon = 'check') =>
        set((s) => ({ toasts: [...s.toasts, { id: ++toastSeq, msg, icon }] })),
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      toasts: [],

      ctx: null,
      openCtx: (x, y, items, title) => set({ ctx: { x, y, items, title } }),
      closeCtx: () => set({ ctx: null }),

      setSelection: (ids) => set({ selection: [...ids] }),

      auth: { status: 'guest', user: null },
      authView: null,
      authReason: null,
      authInitialized: false,
      openAuth: (view, reason) => set({ authView: view, authReason: reason ?? null }),
      closeAuth: () => set({ authView: null, authReason: null }),
      signIn: (email, code) => {
        if (code === '000000') return false;
        const cfg = get().config;
        const user: AuthUser = {
          name: cfg?.user.name ?? email.split('@')[0]!,
          initials: cfg?.user.initials ?? initials2(email),
          email,
          plan: (cfg?.user.plan as Plan) ?? 'PRO',
        };
        set({ auth: { status: 'authed', user }, authView: null, authInitialized: true });
        devbus.emit('auth', 'auth.signin', { email });
        get().pushNotification({ icon: 'check', text: 'Signed in — collections and sharing unlocked' });
        return true;
      },
      createAccount: (p) => {
        const user: AuthUser = { name: `${p.first} ${p.last}`.trim(), initials: initials2(p.first, p.last), email: p.email, plan: 'FREE' };
        set({ auth: { status: 'authed', user }, authView: null, authInitialized: true });
        devbus.emit('auth', 'auth.create', { email: p.email });
        get().pushNotification({ icon: 'check', text: 'Account created — welcome to Ichava' });
      },
      signOut: () => {
        set({ auth: { status: 'guest', user: null }, authView: null, authInitialized: true });
        devbus.emit('auth', 'auth.signout');
      },

      notifications: [],
      seedDemoNotifications: () =>
        set((s) =>
          s.notifications.length
            ? {}
            : { notifications: NOTIFICATION_SEED.map((n, i) => ({ id: `seed-${i}`, icon: n.icon, text: n.text, ts: Date.now() - n.ageMin * 60000, read: n.read ?? false })) },
        ),
      pushNotification: (n) =>
        set((s) => ({ notifications: [{ id: `n-${++notifKey}`, icon: n.icon, text: n.text, ts: Date.now(), read: false }, ...s.notifications].slice(0, 50) })),
      markNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      clearNotifications: () => set({ notifications: [] }),

      devtools: { open: false, tab: 'events', events: [], capturing: true },
      toggleDevtools: () =>
        set((s) => {
          const open = !s.devtools.open;
          devbus.emit('devtools', 'devtools.toggle', { open });
          return { devtools: { ...s.devtools, open } };
        }),
      setDevToolsTab: (t) => set((s) => ({ devtools: { ...s.devtools, tab: t } })),
      pushDevEvent: (e) =>
        set((s) => (s.devtools.capturing ? { devtools: { ...s.devtools, events: [e, ...s.devtools.events].slice(0, 200) } } : {})),
      clearDevEvents: () => set((s) => ({ devtools: { ...s.devtools, events: [] } })),
      setCapturing: (v) => set((s) => ({ devtools: { ...s.devtools, capturing: v } })),

      inviteOpen: false,
      accessCollectionId: null,
      sharedOpen: false,
      openShared: () => set({ sharedOpen: true }),
      closeShared: () => set({ sharedOpen: false }),
      openInvite: () => set({ inviteOpen: true }),
      closeInvite: () => set({ inviteOpen: false }),
      openAccess: (id) => set({ accessCollectionId: id }),
      closeAccess: () => set({ accessCollectionId: null }),
      shareCollection: (id, opts) => {
        set((s) => ({ collections: s.collections.map((c) => (c.id === id ? { ...c, shared: true, role: opts.role, sharedWith: opts.sharedWith } : c)) }));
        const coll = get().collections.find((c) => c.id === id);
        devbus.emit('share', 'collection.shareLink', { id });
        get().pushNotification({ icon: 'info', text: `Share link created for "${coll?.name ?? 'collection'}"` });
      },

      storageDriver: getDriver(),
      setStorageDriver: (d) => {
        switchDriver(d);
        set({ storageDriver: d });
        devbus.emit('storage', 'storage.driver', { driver: d });
      },

      tour: { active: false, step: 0 },
      tourSeen: false,
      startTour: () => set({ tour: { active: true, step: 0 } }),
      nextTourStep: () => set((s) => ({ tour: { ...s.tour, step: s.tour.step + 1 } })),
      prevTourStep: () => set((s) => ({ tour: { ...s.tour, step: Math.max(0, s.tour.step - 1) } })),
      skipTour: () => set({ tour: { active: false, step: 0 }, tourSeen: true }),
      endTour: () => set({ tour: { active: false, step: 0 }, tourSeen: true }),

      consent: null,
      setConsent: (c) => set({ consent: c }),

      boot: { phase: 'idle', progress: 0, label: '', done: false },
      setBoot: (b) => set((s) => ({ boot: { ...s.boot, ...b } })),

      confirm: null,
      openConfirm: (c) => set({ confirm: c }),
      closeConfirm: () => set({ confirm: null }),

      factoryReset: () =>
        set({
          filters: { ...DEFAULT_FILTERS },
          view: 'grid',
          catQ: '',
          collapsedGroups: [],
          size: DEFAULT_RENDER.size,
          sizeUnit: DEFAULT_RENDER.sizeUnit,
          gridStroke: DEFAULT_RENDER.gridStroke,
          color: DEFAULT_RENDER.color,
          treatment: DEFAULT_RENDER.treatment,
          copyFormat: DEFAULT_RENDER.copyFormat,
          searchScope: 'icons',
          selection: [],
          favorites: [],
          history: [],
          collections: [],
          theme: DEFAULT_APPEARANCE.theme,
          accent: DEFAULT_APPEARANCE.accent,
          radius: DEFAULT_APPEARANCE.radius,
          scale: DEFAULT_APPEARANCE.scale,
          density: DEFAULT_APPEARANCE.density,
          reduceMotion: DEFAULT_APPEARANCE.reduceMotion,
          showLabels: DEFAULT_APPEARANCE.showLabels,
          layer: null,
          detailId: null,
          notifications: [],
          consent: null,
          tourSeen: false,
        }),
    }),
    {
      // A null persistKey means "do not persist". zustand still requires a name, so
      // the STORAGE is swapped for an in-memory stub rather than the name omitted.
      name: persistKey ?? 'ichava.browser.ephemeral',
      version: 3,
      // Driver-aware storage: swaps localStorage ↔ sessionStorage live (plan Part B).
      storage: persistKey === null ? ephemeralStorage : driverStorage,
      // Discard any persisted `filters` whose shape predates the IconResource
      // migration (old keys: cats/sub/sort/order) so rehydration can't poison it.
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        const f = p.filters as Record<string, unknown> | undefined;
        if (f && (!Array.isArray(f.categories) || !('sortBy' in f))) delete p.filters;
        // Back-fill `subs` for filters persisted before the subcategory model.
        else if (f && !Array.isArray(f.subs)) f.subs = [];
        if (Array.isArray(p.favorites) && p.favorites.some((x) => typeof x !== 'number')) p.favorites = [];
        // Scrub any `locale` from pre-existing blobs — it's no longer persisted here
        // (the shared `ichava.locale` key owns it); see `merge` + `partialize`.
        delete p.locale;
        return p as never;
      },
      // The shared `ichava.locale` key is authoritative for locale. Force it here so a
      // stale persisted blob (from before locale left `partialize`) can't clobber the
      // value `loadSharedLocale()` seeded at init — which would break the landing↔app
      // language handoff.
      merge: (persisted, current) => ({ ...current, ...(persisted as object), locale: loadSharedLocale() }),
      partialize: (s) => ({
        theme: s.theme,
        accent: s.accent,
        radius: s.radius,
        scale: s.scale,
        density: s.density,
        reduceMotion: s.reduceMotion,
        showLabels: s.showLabels,
        // NOTE: `locale` is deliberately NOT persisted here. The shared
        // `ichava.locale` key (localeShare.ts) is the single source of truth so the
        // landing↔app language handoff holds; persisting it in this blob would let a
        // stale rehydrated value clobber loadSharedLocale() (no `merge` is defined).
        filters: s.filters,
        view: s.view,
        searchScope: s.searchScope,
        size: s.size,
        sizeUnit: s.sizeUnit,
        gridStroke: s.gridStroke,
        color: s.color,
        treatment: s.treatment,
        copyFormat: s.copyFormat,
        favorites: s.favorites,
        history: s.history,
        collections: s.collections,
        // demo systems (plan Part B)
        auth: s.auth,
        authInitialized: s.authInitialized,
        activeWorkspaceId: s.activeWorkspaceId,
        notifications: s.notifications,
        storageDriver: s.storageDriver,
        tourSeen: s.tourSeen,
        consent: s.consent,
      }),
      // Emit a storage-restore event + notification when prefs rehydrate (parity).
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const keys = Object.keys(state).length;
        devbus.emit('storage', 'state.restore', { driver: getDriver(), keys });
      },
    },
  ),
  );
}

/**
 * The default store instance.
 *
 * Retained as a module singleton for the standalone app and for the 259 call sites
 * that read it directly. A per-mount instance is provided through context instead --
 * see `hooks/useStoreApi`.
 */
export const useStore = createBrowserStore();

/** The type of a store instance, for props and context. */
export type BrowserStoreHook = typeof useStore;
