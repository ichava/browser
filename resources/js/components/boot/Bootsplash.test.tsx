import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { Bootsplash } from './Bootsplash';
import { useBootsplash } from './useBootsplash';

function setOnline(online: boolean) {
  Object.defineProperty(navigator, 'onLine', { value: online, configurable: true });
}

describe('Bootsplash rendering', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setOnline(true);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const variants = ['bar', 'ring', 'steps', 'dots', 'counter', 'tree'] as const;
  it.each(variants)('renders the %s variant without crashing, with a progressbar in the loading phase', (variant) => {
    const { result } = renderHook(() => useBootsplash({ config: { variant, progress: { mode: 'auto', minDisplayMs: 100_000 } } }));
    render(<Bootsplash boot={result.current} isBody={false} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows the error panel with a working retry button', () => {
    const { result } = renderHook(() => useBootsplash({}));
    act(() => result.current.fail('fetch'));
    const { rerender } = render(<Bootsplash boot={result.current} isBody={false} />);
    rerender(<Bootsplash boot={result.current} isBody={false} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('clicking retry actually restarts the boot (phase leaves error)', () => {
    const { result } = renderHook(() => useBootsplash({}));
    act(() => result.current.fail('fetch'));
    const { rerender } = render(<Bootsplash boot={result.current} isBody={false} />);
    rerender(<Bootsplash boot={result.current} isBody={false} />);
    expect(result.current.state.phase).toBe('error');

    act(() => screen.getByRole('button', { name: /retry/i }).click());
    expect(result.current.state.phase).toBe('loading');
  });

  it('shows the ready panel when holdOnComplete is set', async () => {
    const { result } = renderHook(() => useBootsplash({ config: { holdOnComplete: true, progress: { minDisplayMs: 0 } } }));
    act(() => result.current.finish());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    const { rerender } = render(<Bootsplash boot={result.current} isBody={false} />);
    rerender(<Bootsplash boot={result.current} isBody={false} />);
    expect(screen.getByText(/ready/i)).toBeInTheDocument();
  });

  it('shows the offline banner when starting offline', () => {
    setOnline(false);
    const { result } = renderHook(() => useBootsplash({}));
    render(<Bootsplash boot={result.current} isBody={false} />);
    expect(screen.getByText(/waiting for a connection/i)).toBeInTheDocument();
  });

  it('brand name, suffix and tagline render from config', () => {
    const { result } = renderHook(() => useBootsplash({ config: { brand: { name: 'Ichava', suffix: 'Browser', tagline: 'Test tagline' } } }));
    render(<Bootsplash boot={result.current} isBody={false} />);
    expect(screen.getByText('Ichava')).toBeInTheDocument();
    expect(screen.getByText('Browser')).toBeInTheDocument();
    expect(screen.getByText('Test tagline')).toBeInTheDocument();
  });
});
