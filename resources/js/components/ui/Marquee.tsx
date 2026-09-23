import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/**
 * Marquee — auto-scroll that becomes MANUALLY scrollable on hover.
 *
 * Vertical mode (credits) is scroll-based (requestAnimationFrame drives scrollTop
 * over duplicated content for a seamless loop): hovering pauses the auto-scroll and
 * hands control to the wheel; leaving resumes auto-scroll from the current position.
 * Horizontal mode uses a CSS transform. Both respect the app's reduce-motion setting.
 */
export function Marquee({
  children,
  direction = 'vertical',
  durationSec = 16,
  gap = 0,
  style,
  fade = true,
  fadeColor = 'var(--muted2)',
}: {
  children: ReactNode;
  direction?: 'vertical' | 'horizontal';
  durationSec?: number;
  gap?: number;
  style?: CSSProperties;
  fade?: boolean;
  fadeColor?: string;
}) {
  if (direction === 'horizontal') {
    return <HorizontalMarquee durationSec={durationSec} gap={gap} style={style} fade={fade} fadeColor={fadeColor}>{children}</HorizontalMarquee>;
  }
  return <VerticalMarquee durationSec={durationSec} gap={gap} style={style} fade={fade} fadeColor={fadeColor}>{children}</VerticalMarquee>;
}

function fadeOverlay(vertical: boolean, color: string): CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background: vertical
      ? `linear-gradient(${color}, transparent 16px, transparent calc(100% - 16px), ${color})`
      : `linear-gradient(90deg, ${color}, transparent 24px, transparent calc(100% - 24px), ${color})`,
  };
}

function VerticalMarquee({ children, durationSec, gap, style, fade, fadeColor }: { children: ReactNode; durationSec: number; gap: number; style?: CSSProperties; fade: boolean; fadeColor: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    let last = performance.now();
    // Float accumulator: assigning scrollTop directly (rather than +=) so
    // sub-pixel per-frame steps aren't rounded away to zero.
    let pos = el.scrollTop;
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const reduce = document.documentElement.hasAttribute('data-reduce-motion');
      const half = el.scrollHeight / 2;
      if (pausedRef.current || reduce) {
        // follow the user's manual scroll; wrap for a seamless resume
        pos = el.scrollTop;
        if (half > 0 && pos >= half) {
          pos -= half;
          el.scrollTop = pos;
        }
      } else if (half > 0) {
        pos += (half / (durationSec * 1000)) * dt;
        if (pos >= half) pos -= half;
        el.scrollTop = pos;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationSec]);

  return (
    <div
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
    >
      <div ref={scrollRef} className="ich-marquee-scroll" style={{ height: '100%', overflowY: 'auto', overscrollBehavior: 'contain' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap }}>{children}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap }} aria-hidden>{children}</div>
      </div>
      {fade && <div style={fadeOverlay(true, fadeColor)} />}
    </div>
  );
}

function HorizontalMarquee({ children, durationSec, gap, style, fade, fadeColor }: { children: ReactNode; durationSec: number; gap: number; style?: CSSProperties; fade: boolean; fadeColor: string }) {
  const [paused, setPaused] = useState(false);
  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', gap, animation: `ichMarqueeX ${durationSec}s linear infinite`, animationPlayState: paused ? 'paused' : 'running', willChange: 'transform' }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap }}>{children}</div>
        <div style={{ display: 'flex', flexDirection: 'row', gap }} aria-hidden>{children}</div>
      </div>
      {fade && <div style={fadeOverlay(false, fadeColor)} />}
    </div>
  );
}
