// Environment / production gate (plan Part E). A single resolver decides whether
// the non-prod tooling (DevTools panel, ⌘D, window handle, verbose logs, boot
// step controls) is available. Default OFF in production; a runtime override
// (`?debug=1` or localStorage['ichava.debug']='1') re-enables it for prod triage.

import type { AppConfig, AppEnv } from './config';

const DEBUG_LS_KEY = 'ichava.debug';

function viteProd(): boolean {
  try {
    return import.meta.env.PROD === true;
  } catch {
    return false;
  }
}

function queryOverride(): boolean | null {
  try {
    const p = new URLSearchParams(window.location.search);
    if (p.has('debug')) {
      const v = p.get('debug');
      return v === '' || v === '1' || v === 'true' || v === 'boot';
    }
  } catch {
    /* no window */
  }
  return null;
}

function storageOverride(): boolean | null {
  try {
    const v = window.localStorage.getItem(DEBUG_LS_KEY);
    if (v == null) return null;
    return v === '1' || v === 'true';
  } catch {
    return null;
  }
}

/** Resolved app mode. `config.env` wins; else Vite's build mode. */
export function resolveMode(config?: Pick<AppConfig, 'env'> | null): AppEnv {
  return config?.env ?? (viteProd() ? 'production' : 'development');
}

/**
 * Whether debug tooling is enabled. Precedence:
 * explicit `?debug=` / localStorage override → `config.debug.enabled` → `mode !== production`.
 */
export function isDebugEnabled(config?: Pick<AppConfig, 'env' | 'debug'> | null): boolean {
  const q = queryOverride();
  if (q !== null) return q;
  const ls = storageOverride();
  if (ls !== null) return ls;
  if (config?.debug?.enabled != null) return config.debug.enabled;
  return resolveMode(config) !== 'production';
}

/** True when the boot-splash step/sim controls should show (`?debug=boot` or debug on). */
export function isBootDebug(config?: Pick<AppConfig, 'env' | 'debug'> | null): boolean {
  try {
    const p = new URLSearchParams(window.location.search);
    if (p.get('debug') === 'boot') return true;
  } catch {
    /* no window */
  }
  return isDebugEnabled(config);
}

/** DevTools UI is available only when debug is on AND the feature flag is set. */
export function isDevToolsAvailable(config?: Pick<AppConfig, 'env' | 'debug' | 'features'> | null): boolean {
  return isDebugEnabled(config) && config?.features?.devtools !== false;
}
