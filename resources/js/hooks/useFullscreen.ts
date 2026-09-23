import { useCallback, useEffect, useState } from 'react';

/** Fullscreen toggle bound to the Fullscreen API, tracking the live state. */
export function useFullscreen(): [boolean, () => void] {
  const [full, setFull] = useState(() => (typeof document !== 'undefined' ? !!document.fullscreenElement : false));

  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);

  const toggle = useCallback(() => {
    try {
      if (document.fullscreenElement) void document.exitFullscreen?.();
      else void document.documentElement.requestFullscreen?.();
    } catch {
      /* fullscreen unavailable / denied */
    }
  }, []);

  return [full, toggle];
}
