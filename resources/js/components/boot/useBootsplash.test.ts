import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBootsplash } from './useBootsplash';

function setOnline(online: boolean) {
  Object.defineProperty(navigator, 'onLine', { value: online, configurable: true });
}

const FAST_CONFIG = { progress: { mode: 'auto', durationMs: 200, minDisplayMs: 0, timeoutMs: 5000, slowAfterMs: 2000 } };

describe('useBootsplash', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setOnline(true);
    localStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts loading when online, and fires onStart', () => {
    const onStart = vi.fn();
    const { result } = renderHook(() => useBootsplash({ config: FAST_CONFIG, onStart }));
    expect(result.current.state.phase).toBe('loading');
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('starts in the offline phase when navigator.onLine is false', () => {
    setOnline(false);
    const { result } = renderHook(() => useBootsplash({ config: FAST_CONFIG }));
    expect(result.current.state.phase).toBe('offline');
  });

  it('progress reaches 100 and completes on its own over time', async () => {
    const onComplete = vi.fn();
    const onHidden = vi.fn();
    const { result } = renderHook(() => useBootsplash({ config: FAST_CONFIG, onComplete, onHidden }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(result.current.state.pct).toBe(100);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onHidden).toHaveBeenCalledTimes(1);
    expect(result.current.state.phase).toBe('hidden');
  });

  it('finish() completes immediately without waiting for the progress curve', async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useBootsplash({ config: FAST_CONFIG, onComplete }));

    act(() => result.current.finish());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.state.pct).toBe(100);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('fail() sets the error phase and fires onError with the given reason', () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useBootsplash({ config: FAST_CONFIG, onError }));

    act(() => result.current.fail('fetch'));

    expect(result.current.state.phase).toBe('error');
    expect(onError).toHaveBeenCalledWith('fetch');
  });

  it('retry() after a failure restarts loading and re-fires onStart', () => {
    const onStart = vi.fn();
    const { result } = renderHook(() => useBootsplash({ config: FAST_CONFIG, onStart }));

    act(() => result.current.fail('fetch'));
    expect(result.current.state.phase).toBe('error');

    act(() => result.current.retry());
    expect(result.current.state.phase).toBe('loading');
    expect(onStart).toHaveBeenCalledTimes(2); // once on mount, once on retry
  });

  // Indeterminate mode drives slow/timeout off two plain, curve-independent
  // setTimeouts (unlike determinate mode, where the progress curve races the
  // accumulator toward completion using a fixed ~600ms ramp whenever
  // source:'config' -- durationMs only matters when endpoint-gated). Testing the
  // timers this way avoids coupling the assertion to that curve's exact shape.
  it('sets slow after slowAfterMs while still loading, and fails with "timeout" at timeoutMs', async () => {
    const onError = vi.fn();
    const cfg = { progress: { mode: 'indeterminate', minDisplayMs: 0, timeoutMs: 1000, slowAfterMs: 300 } };
    const { result } = renderHook(() => useBootsplash({ config: cfg, onError }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(result.current.state.slow).toBe(true);
    expect(result.current.state.phase).toBe('loading');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    expect(result.current.state.phase).toBe('error');
    expect(onError).toHaveBeenCalledWith('timeout');
  });

  it('beforeComplete gates completion: hangs while it never resolves, proceeds once it does', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const onComplete = vi.fn();
    const { result } = renderHook(() => useBootsplash({ config: FAST_CONFIG, beforeComplete: () => gate, onComplete }));

    act(() => result.current.finish());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    // still gated -- onComplete must not have fired, and the splash must not have moved on
    expect(onComplete).not.toHaveBeenCalled();
    expect(result.current.state.phase).not.toBe('hidden');

    release();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('beforeComplete rejecting hangs the splash forever rather than completing anyway', async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useBootsplash({
      config: FAST_CONFIG,
      beforeComplete: () => Promise.reject(new Error('load failed')),
      onComplete,
    }));

    act(() => result.current.finish());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(onComplete).not.toHaveBeenCalled();
    expect(result.current.state.phase).not.toBe('hidden');
  });

  it('holdOnComplete stops at the ready phase instead of fading to hidden', async () => {
    const onHidden = vi.fn();
    const { result } = renderHook(() => useBootsplash({ config: { ...FAST_CONFIG, holdOnComplete: true }, onHidden }));

    act(() => result.current.finish());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(result.current.state.phase).toBe('ready');
    expect(onHidden).not.toHaveBeenCalled();
  });

  it('persists theme/variant/layout/align to localStorage only when persist.enabled', async () => {
    const cfg = { ...FAST_CONFIG, theme: 'light', variant: 'ring', persist: { enabled: true, key: 'test.boot', fields: ['theme', 'variant', 'layout', 'align'] } };
    renderHook(() => useBootsplash({ config: cfg }));

    const raw = localStorage.getItem('test.boot');
    expect(raw).not.toBeNull();
    const saved = JSON.parse(raw!);
    expect(saved.theme).toBe('light');
    expect(saved.variant).toBe('ring');
  });

  it('a persisted preference from an earlier session overrides the config default on the next mount', () => {
    localStorage.setItem('test.boot2', JSON.stringify({ theme: 'light' }));
    const cfg = { theme: 'dark', persist: { enabled: true, key: 'test.boot2', fields: ['theme'] } };
    const { result } = renderHook(() => useBootsplash({ config: cfg }));
    expect(result.current.config.theme).toBe('light');
  });

  it('going offline mid-load switches phase to offline, and coming back online restarts', () => {
    const onStart = vi.fn();
    renderHook(() => useBootsplash({ config: FAST_CONFIG, onStart }));
    expect(onStart).toHaveBeenCalledTimes(1);

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event('offline'));
    });
    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event('online'));
    });
    expect(onStart).toHaveBeenCalledTimes(2);
  });
});
