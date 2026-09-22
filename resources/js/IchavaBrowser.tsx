import { useEffect, useMemo, type CSSProperties } from 'react';

import type { AppConfig } from '@js/store';
import type { Catalog } from '@js/core/IconRepository';
import { IconRepository } from '@js/core/IconRepository';
import { hexToRgba, readableOn } from '@js/core/format';
import { useShortcuts } from '@js/hooks/useShortcuts';
import { AppHeader } from '@js/components/layout/AppHeader';
import { AppSidebar } from '@js/components/layout/AppSidebar';
import { AppMain } from '@js/components/layout/AppMain';
import { Toaster } from '@js/components/ui/Toaster';
import { IconDetailDialog } from '@js/components/browser/IconDetailDialog';
import { CommandPalette } from '@js/components/command/CommandPalette';
import { LibraryDialog } from '@js/components/library/LibraryDialog';
import { SettingsDialog } from '@js/components/settings/SettingsDialog';
import { AboutDialog } from '@js/components/about/AboutDialog';
import { ContextMenu } from '@js/components/browser/ContextMenu';
import { ConfirmDialog } from '@js/components/ui/ConfirmDialog';
import { TooltipProvider } from '@js/components/ui/Tooltip';
import { AuthModal } from '@js/components/auth/AuthModal';
import { ProfileModal } from '@js/components/auth/ProfileModal';
import { TourModal } from '@js/components/tour/TourModal';
import { ConsentBanner } from '@js/components/consent/ConsentBanner';
import { InviteModal } from '@js/components/team/InviteModal';
import { ManageAccessModal } from '@js/components/team/ManageAccessModal';
import { SharedCollectionsModal } from '@js/components/team/SharedCollectionsModal';
import { DevToolsPanel } from '@js/components/devtools/DevToolsPanel';
import { isDevToolsAvailable } from '@js/core/env';
import { logger } from '@js/core/logger';
import { runRegression } from '@js/components/devtools/regression';

import { CONFIG_DEFAULTS } from '@js/core/config';
import { UI_SCALE_MAP } from '@js/core/appScale';
import { localeDir, registerTranslations, type Locale } from '@js/core/i18n';
import { StoreProvider, useAppStore, useStoreApi } from '@js/hooks/useStoreApi';
import type { BrowserStoreHook } from '@js/store';

/** Base font size. UI scale multiplies this and `--spacing`; there is no CSS zoom. */
const BASE_FONT = CONFIG_DEFAULTS.ui.baseFontSize;

/**
 * Resolved `--bg` per theme.
 *
 * Read off the running app, not guessed: the legacy bridge maps `--bg` to
 * `--color-bg-primary`, which the vendored Untitled UI layer defines as `--color-white`
 * in light and `--color-neutral-950` in dark. Needed as a concrete hex because the
 * contrast search runs in JS, before any CSS variable exists to read.
 */
const THEME_BG = { light: '#ffffff', dark: '#0a0a0a' } as const;

/** Browser default root font size; UI scale multiplies this. */
const BASE_REM_PX = 16;

export interface IchavaBrowserProps {
  /**
   * The icon catalog, built by the Inertia page from server props and loaded
   * into the store on mount. Server data arrives as page props, never over REST.
   */
  catalog?: Catalog;
  /** Optional app config (accent options, per-page options, user, team). */
  config?: AppConfig | null;
  /**
   * Whether this instance owns the document. **Defaults to false.**
   *
   * When true it sets the theme class and design tokens on `<html>`, plus
   * `lang`/`dir`, `document.title` and the description `<meta>`. Only a standalone
   * app may do that. Embedded in a host page it would hijack the host's theme,
   * text direction, title and SEO metadata — which was the behaviour, unconditionally.
   *
   * Tokens are always applied to the component root regardless, so the app themes
   * correctly either way.
   */
  manageDocument?: boolean;
  /**
   * The store instance backing this mount.
   *
   * Omit it and everything resolves to the module singleton, which is what the
   * standalone app wants. Pass one from `createBrowserStore()` and this instance gets
   * its own filters, selection, favorites, appearance and detail state -- two mounts
   * on a page were previously the same store, so each was overwriting the other.
   */
  store?: BrowserStoreHook;
}

/**
 * IchavaBrowser — the mountable browser shell, decoupled from any bootstrap.
 * Inertia pages render this with a catalog built from server props. Data is
 * loaded into the store on mount; theme tokens are applied to the root so a
 * single accent/radius knob rethemes everything.
 */
export function IchavaBrowser({ catalog, config = null, manageDocument = false, store }: IchavaBrowserProps) {
  // Provided before anything reads state, so the whole subtree -- this component
  // included -- resolves the same instance.
  return (
    <StoreProvider value={store ?? null}>
      <IchavaBrowserInner catalog={catalog ?? null} config={config} manageDocument={manageDocument} />
    </StoreProvider>
  );
}

function IchavaBrowserInner({
  catalog,
  config,
  manageDocument,
}: { catalog: Catalog | null; config: AppConfig | null; manageDocument: boolean }) {
  const storeApi = useStoreApi();
  const theme = useAppStore((s) => s.theme);
  const accent = useAppStore((s) => s.accent);
  const radius = useAppStore((s) => s.radius);
  const scale = useAppStore((s) => s.scale);
  const density = useAppStore((s) => s.density);
  const locale = useAppStore((s) => s.locale);
  const layer = useAppStore((s) => s.layer);
  const authed = useAppStore((s) => s.auth.status === 'authed');
  const loading = useAppStore((s) => s.loading);
  const reduceMotion = useAppStore((s) => s.reduceMotion);
  const tourActive = useAppStore((s) => s.tour.active);
  const consent = useAppStore((s) => s.consent);
  const inviteOpen = useAppStore((s) => s.inviteOpen);
  const accessId = useAppStore((s) => s.accessCollectionId);
  const sharedOpen = useAppStore((s) => s.sharedOpen);
  const devtoolsOpen = useAppStore((s) => s.devtools.open);
  const devtoolsAvailable = isDevToolsAvailable(config);

  useShortcuts();

  useEffect(() => {
    if (catalog) {
      storeApi.getState().setCatalog(catalog);
      storeApi.getState().setFiltersData(new IconRepository(catalog).filters());
      logger.info('app', 'catalog mounted', { icons: catalog.icons.length });
    } else {
      storeApi.setState({ loading: false });
    }
    if (config) storeApi.getState().setConfig(config);
    logger.configure(config);
    // Development fixtures only. The standalone dev app enables features.demo in
    // public/data/app-config.json; a host embedding the browser omits it and
    // sees no invented activity. This is the single call site by design.
    if (config?.features?.demo) storeApi.getState().seedDemoNotifications();
    // First-run onboarding: show the tour once (until skipped/finished).
    if (!storeApi.getState().tourSeen) storeApi.getState().startTour();
    // Dev-only console handle; never attached in production (env gate).
    if (isDevToolsAvailable(config)) {
      (window as unknown as { ichava?: unknown }).ichava = {
        store: storeApi,
        config,
        runRegression: () => runRegression(storeApi.getState().catalog, storeApi.getState().config, storeApi),
        logs: () => logger.buffer(),
        setLogLevel: (l: Parameters<typeof logger.setLevel>[0]) => logger.setLevel(l),
      };
    }
  }, [catalog, config, storeApi]);

  // Theme tokens on <html>, so the remaining Radix overlays -- which still portal to
  // <body>, outside this component -- inherit the same accent/radius/dark tokens.
  //
  // Standalone only, and temporary. Everything written here is ALSO written to the
  // component root in `rootStyle`, so the app themes correctly with this disabled.
  // Dropping CSS `zoom` removed the reason overlays had to escape the root at all, so
  // a portal container inside the mount is now possible; it lands with the overlay
  // rewrite, and this whole effect goes with it.
  //
  // Cleaned up on unmount so a host is left exactly as it was found.
  useEffect(() => {
    if (!manageDocument) return;
    const el = document.documentElement;
    const hadDark = el.classList.contains('dark-mode');
    el.classList.toggle('dark-mode', theme === 'dark');
    el.style.setProperty('--accent', accent);
    // Mirrored for the same reason as the rest: overlays still portal to <body> and would
    // otherwise miss it. Kept in step with `rootStyle` -- a token set in one place and not
    // the other means the standalone app and an embed disagree on colour.
    el.style.setProperty('--accent-text', readableOn(accent, theme === 'dark' ? THEME_BG.dark : THEME_BG.light));
    el.style.setProperty('--accent-soft', hexToRgba(accent, theme === 'dark' ? 0.16 : 0.1));
    el.style.setProperty('--ring', hexToRgba(accent, 0.35));
    el.style.setProperty('--radius', `${radius}px`);
    // Portalled overlays render at <body>, which sets no font-size and would
    // otherwise inherit 16px. Modal/Popover read var(--app-font).
    el.style.setProperty('--app-font', `${BASE_FONT}px`);
    /*
     * Standalone only: scale the ROOT FONT SIZE, which is what `rem` resolves against.
     *
     * `zoom` was tried here and had to come out. It scales everything, but
     * `getBoundingClientRect()` then reports VISUAL coordinates while CSS `left`/`top`
     * stay in LAYOUT units, so react-aria measured a trigger in one space and positioned
     * the panel in the other. Measured drift: a dropdown landed 186px off its trigger at
     * the smallest scale and 142px off at the largest, tracking the zoom factor exactly.
     * That is the same coordinate distortion R-P7 removed `zoom` for, and a detached
     * dropdown is a worse defect than chrome that does not grow.
     *
     * Root font-size has no such problem: `rem` lengths scale, coordinates stay in one
     * space, and overlays position correctly at every scale. The chrome scales with it
     * wherever its dimensions are expressed in `rem` -- see `appScale.rem()`.
     */
    el.style.setProperty('font-size', `${BASE_REM_PX * (UI_SCALE_MAP[scale] || 1)}px`);
    el.setAttribute('data-density', density);
    el.toggleAttribute('data-reduce-motion', reduceMotion);
    return () => {
      el.classList.toggle('dark-mode', hadDark);
      el.style.removeProperty('font-size');
      for (const v of ['--accent', '--accent-text', '--accent-soft', '--ring', '--radius', '--app-font']) el.style.removeProperty(v);
      el.removeAttribute('data-density');
      el.removeAttribute('data-reduce-motion');
    };
  }, [manageDocument, theme, accent, radius, density, reduceMotion, scale]);

  // Locale → document lang + text direction (RTL for Arabic). Standalone only: a
  // host's text direction is not ours to change. `dir` is also set on the component
  // root below, so RTL layout works either way.
  useEffect(() => {
    if (!manageDocument) return;
    const el = document.documentElement;
    const prevLang = el.getAttribute('lang');
    const prevDir = el.getAttribute('dir');
    el.setAttribute('lang', locale);
    el.setAttribute('dir', localeDir(locale));
    return () => {
      if (prevLang === null) el.removeAttribute('lang');
      else el.setAttribute('lang', prevLang);
      if (prevDir === null) el.removeAttribute('dir');
      else el.setAttribute('dir', prevDir);
    };
  }, [manageDocument, locale]);

  // Optional Laravel-backend translation sync: when config.i18n.endpoint is set,
  // fetch `{ [locale]: { key: value } }` overrides and merge them over the bundled
  // catalog. No-op when unset (frontend stays fully functional standalone).
  useEffect(() => {
    const endpoint = config?.i18n?.endpoint;
    if (!endpoint) return;
    let alive = true;
    fetch(endpoint)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Record<string, Record<string, string>> | null) => {
        if (!alive || !data) return;
        for (const [loc, dict] of Object.entries(data)) registerTranslations(loc as Locale, dict);
        // force a re-render so already-mounted strings pick up server overrides
        storeApi.setState((s) => ({ locale: s.locale }));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [config, storeApi]);

  // Document title + meta description from config.seo. Standalone only: a host's
  // title and SEO metadata are emphatically not ours to rewrite. Restored on unmount,
  // and a <meta> we created is removed rather than left behind.
  useEffect(() => {
    if (!manageDocument) return;
    const seo = config?.seo ?? CONFIG_DEFAULTS.seo;
    const prevTitle = document.title;
    if (seo?.title) document.title = seo.title;

    let created = false;
    let meta: Element | null = null;
    let prevContent: string | null = null;
    if (seo?.description) {
      meta = document.head.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
        created = true;
      } else {
        prevContent = meta.getAttribute('content');
      }
      meta.setAttribute('content', seo.description);
    }

    return () => {
      document.title = prevTitle;
      if (!meta) return;
      if (created) meta.remove();
      else if (prevContent === null) meta.removeAttribute('content');
      else meta.setAttribute('content', prevContent);
    };
  }, [manageDocument, config]);

  /*
   * Nudge open overlays to re-measure after a scale change.
   *
   * react-aria positions a popover once on open and recalculates on scroll and resize. A
   * `zoom` change fires neither, so a dropdown that is already open keeps its old absolute
   * position while its trigger moves underneath it -- measured drift of 25px on a single
   * step, which detaches the panel from the control it belongs to.
   *
   * Dispatching `resize` is the documented way to ask every positioned overlay to
   * recompute, and it costs nothing when none are open.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // After paint, so the new zoom is in effect when overlays re-measure.
    const id = requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    return () => cancelAnimationFrame(id);
  }, [scale, density]);

  /*
   * The theme background the accent has to be legible against. These are the resolved
   * values of `--bg` (`--color-bg-primary`) in each theme, taken from the live token
   * audit rather than assumed -- the bridge maps them to Tailwind's neutral scale.
   */
  const accentText = useMemo(
    () => readableOn(accent, theme === 'dark' ? THEME_BG.dark : THEME_BG.light),
    [accent, theme],
  );

  const rootStyle = useMemo<CSSProperties>(() => {
    /*
     * UI scale is TOKEN scaling, not CSS `zoom`.
     *
     * It used to be a real `zoom` on the app root, with `calc(100vX / z)` sizing to
     * keep the box one viewport. That worked, but it distorted the coordinate space,
     * which is why overlays had to portal to `<body>` -- OUTSIDE the zoomed root -- so
     * Floating UI could read a trigger's undistorted visual rect. And portalling to
     * `<body>` is exactly what the embedding contract forbids, and why the design
     * tokens had to be written to `<html>` for overlays to inherit them.
     *
     * Tailwind v4 derives every spacing utility from a single theme variable
     * (`p-4` compiles to `calc(var(--spacing) * 4)`), so overriding `--spacing` here
     * scales all spacing inside this root, and `font-size` scales the type. Same
     * visual result, no coordinate distortion -- which means overlays can portal
     * INSIDE the mount and still position correctly.
     *
     * This is what unblocks the portal container, and it is why `zoom` had to go
     * before the overlay work rather than during it.
     */
    const z = UI_SCALE_MAP[scale] || 1;
    return {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      color: 'var(--fg)',
      overflow: 'hidden',
      /*
       * UI scale is a real zoom, matching how display scaling works on macOS and Windows:
       * every pixel grows, not only the ones expressed as tokens.
       *
       * Token scaling was tried and moved just part of the UI. `--spacing` and `font-size`
       * scale Tailwind utilities and type, but the chrome is full of inline pixel literals
       * -- `height: 48` on the header, `width: 248` on the sidebar -- and those cannot see
       * a token. Measured from scale m to l: the font went 13.5px to 15.12px while the
       * header stayed at exactly 48px and the sidebar at 248px. Type grew inside furniture
       * that did not, which is not what asking for a bigger UI means.
       *
       * `zoom` was dropped in R-P7 because it distorted the coordinate space for overlays
       * positioned by Floating UI. That reason is gone: every overlay is react-aria now,
       * and in standalone mode the zoom goes on `<html>` (see the effect above) so
       * overlays portalled to `<body>` sit inside the zoomed subtree and scale too. This
       * root-level zoom is the embedded fallback, where the document is not ours to touch.
       */
      /*
       * Embedded fallback. The document's root font-size is not ours to change, so an
       * embed scales through the same tokens the standalone app also sets: `--spacing`
       * drives every Tailwind spacing utility, and `--ich-rem` drives the chrome
       * dimensions that `appScale.rem()` emits. Overlay coordinates stay undistorted
       * either way, which is the property that matters most.
       */
      ['--spacing' as string]: `${0.25 * z}rem`,
      ['--ich-rem' as string]: `${BASE_REM_PX * z}px`,
      fontSize: `${BASE_FONT * z}px`,
      ['--app-font' as string]: `${BASE_FONT * z}px`,

      // The user's accent, and the Untitled UI brand tokens derived from it, so an
      // Untitled UI `primary` Button follows the picked colour rather than the
      // shipped purple. The colour picker is a real product feature; adopting a
      // design system must not silently remove it.
      //
      // A fill and a label need different colours. `--accent` is the picked hex and stays
      // exact, because a solid fill is measured against the white text ON it.
      // `--accent-text` is that colour nudged along the lightness axis until it clears AA
      // against THIS theme's background: a live audit measured the default `#7c3aed` at
      // 3.47:1 as text on the dark background, and every accent in the shipped palette
      // failed on one theme or the other. Untitled UI's own answer is a pair of
      // `text-brand-*` tokens that swap per theme, which works for a fixed brand but not
      // for an arbitrary user-picked hex -- so the safe variant is derived, not looked up.
      ['--accent' as string]: accent,
      ['--accent-text' as string]: accentText,
      ['--accent-soft' as string]: hexToRgba(accent, theme === 'dark' ? 0.16 : 0.1),
      ['--ring' as string]: hexToRgba(accent, 0.35),
      ['--radius' as string]: `${radius}px`,
      ['--color-bg-brand-solid' as string]: accent,
      ['--color-bg-brand-solid_hover' as string]: hexToRgba(accent, 0.88),
      ['--color-bg-brand-primary' as string]: hexToRgba(accent, theme === 'dark' ? 0.16 : 0.1),
      ['--color-border-brand' as string]: hexToRgba(accent, 0.5),
      // Both of these are TEXT roles in Untitled UI's vocabulary, so they take the
      // readable variant. Pointing them at the raw accent is what produced the failure.
      ['--color-fg-brand-primary' as string]: accentText,
      ['--color-text-brand-secondary' as string]: accentText,
    };
  }, [accent, accentText, theme, radius, scale, manageDocument]);

  return (
    <TooltipProvider>
    <div
      className={theme === 'dark' ? 'dark-mode' : undefined}
      style={rootStyle}
      data-app="ichava-browser"
      data-ichava-root=""
      data-density={density}
      data-reduce-motion={reduceMotion ? '' : undefined}
      // lang and dir on the root as well as (optionally) on <html>, so RTL layout and
      // language-sensitive rendering work without touching the host document.
      lang={locale}
      dir={localeDir(locale)}
    >
      <AppHeader />
      <div className="flex-1 flex min-h-0">
        <AppSidebar />
        <AppMain loading={loading} />
      </div>

      {layer === 'detail' && <IconDetailDialog />}
      {layer === 'palette' && <CommandPalette />}
      {layer === 'library' && <LibraryDialog />}
      {layer === 'settings' && <SettingsDialog />}
      {layer === 'profile' && authed && <ProfileModal />}
      {layer === 'about' && <AboutDialog />}
      {inviteOpen && <InviteModal />}
      {accessId && <ManageAccessModal />}
      {sharedOpen && <SharedCollectionsModal />}
      {tourActive && <TourModal />}
      {consent === null && <ConsentBanner />}
      {devtoolsAvailable && devtoolsOpen && <DevToolsPanel />}
      <ContextMenu />
      <AuthModal />
      <ConfirmDialog />
      <Toaster />
    </div>
    </TooltipProvider>
  );
}
