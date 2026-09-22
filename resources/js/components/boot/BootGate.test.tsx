import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { BootGate } from './BootGate';
import { useStore } from '@js/store';

/**
 * End-to-end proof that the R7 rebuild's wiring holds together, not just that
 * each piece typechecks alone: useBootsplash -> Bootsplash -> the real load()
 * promise -> children rendering, and the store's `boot` slice mirroring. Uses the
 * default (unprovided) singleton store, matching App.tsx's real, unwrapped usage.
 *
 * `runLoad()`'s Promise.resolve().then(load) chain always defers load's own
 * invocation to a microtask, even for an already-settled promise -- every
 * assertion on `load` or on state it drives goes through a flush first.
 */
async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

function setOnline(online: boolean) {
  Object.defineProperty(navigator, 'onLine', { value: online, configurable: true });
}

describe('BootGate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setOnline(true);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children once load() resolves, and eventually hides the splash', async () => {
    const load = vi.fn().mockResolvedValue({ catalog: { icons: [] }, config: {} });
    render(
      <BootGate load={load}>
        {() => <div data-testid="app-shell">app ready</div>}
      </BootGate>,
    );
    await flush();

    expect(load).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toBeInTheDocument(); // the splash

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
    expect(useStore.getState().boot.phase).toBe('ready');
    expect(useStore.getState().boot.done).toBe(true);
  });

  it('shows the retry UI on load failure without ever rendering children, and a retry that succeeds renders them', async () => {
    const load = vi.fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ catalog: { icons: [] }, config: {} });

    render(
      <BootGate load={load}>
        {() => <div data-testid="app-shell">app ready</div>}
      </BootGate>,
    );
    await flush();

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByTestId('app-shell')).not.toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(1);

    act(() => screen.getByRole('button', { name: /retry/i }).click());
    await flush();
    expect(load).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });
});
