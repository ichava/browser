import { useState, type CSSProperties, type ReactNode } from 'react';
import {
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  OverlayArrow as AriaOverlayArrow,
  Popover as AriaPopover,
  Pressable,
} from 'react-aria-components';

/**
 * Popover — trigger + panel, on Untitled UI's overlay stack (react-aria).
 *
 * The public API (`trigger`, `children(close)`, `align`, `drop`, `width`, `panelStyle`) is
 * unchanged, so all eight call sites are untouched by the swap.
 *
 * This was Radix Popover, and it had to move for the same reason Selects were unusable
 * inside Modals: two overlay systems do not agree about stacking or about
 * `pointer-events`. With modal, tooltip, select and popover all on react-aria, the layer
 * scale in `theme.css` is the single thing deciding what sits above what.
 *
 * The trigger is wrapped in `Pressable` because `DialogTrigger` needs a child that accepts
 * press interactions, and every call site passes a plain styled `<button>`. Same reasoning
 * as `Focusable` in the Tooltip: adapt the element rather than force eight call sites to
 * become react-aria `Button`s and lose their `iconBtn()` styling.
 */
export function Popover({
  trigger,
  children,
  align = 'left',
  drop = 'down',
  width,
  panelStyle,
}: {
  trigger: (open: boolean, toggle: () => void) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'left' | 'right';
  drop?: 'down' | 'up';
  width?: number;
  panelStyle?: CSSProperties;
}) {
  // Controlled, so the trigger render-prop can still style itself as active: react-aria's
  // DialogTrigger otherwise owns open state and does not expose it to the trigger.
  const [open, setOpen] = useState(false);

  return (
    <AriaDialogTrigger isOpen={open} onOpenChange={setOpen}>
      {/*
       * `toggle` stays a no-op. `Pressable` wires the press to react-aria, so a call site
       * also calling `toggle()` would open and immediately close again. `open` is real and
       * is what the triggers use for their active state.
       */}
      <Pressable>{trigger(open, () => {}) as never}</Pressable>

      <AriaPopover
        placement={`${drop === 'up' ? 'top' : 'bottom'} ${align === 'right' ? 'end' : 'start'}` as never}
        offset={6}
        containerPadding={8}
        /*
         * Non-modal: these are toolbar and header popovers, not dialogs. react-aria's
         * default lays an underlay that swallows every interaction outside the panel, so
         * with a colour picker open the rest of the app stopped responding -- clicking a
         * second trigger did nothing until the first was dismissed. Radix's popover did
         * not block, and these call sites were written against that. Outside press still
         * closes; it just no longer freezes everything behind it.
         */
        isNonModal
        className="z-(--z-popover)"
        style={{
          width,
          // Portalled to <body>: pin the app's base font, or inherited text becomes 16px.
          fontSize: 'var(--app-font, 13.5px)',
        }}
      >
        <AriaOverlayArrow>
          <svg width={12} height={6} viewBox="0 0 12 6" className="block group-placement-top:rotate-180">
            <path d="M0 6 L6 0 L12 6 Z" fill="var(--pop)" />
          </svg>
        </AriaOverlayArrow>

        <AriaDialog
          aria-label="Popover"
          // `ich-pop` is retained deliberately: `theme.css` positions on it and the visual
          // spec that guards the colour-picker gradients selects the panel by it. Dropping
          // a class during a swap is how a guard silently stops matching anything.
          className="ich-pop outline-hidden"
          style={{
            background: 'var(--pop)',
            border: '1px solid var(--border)',
            borderRadius: 'min(calc(var(--radius) + 2px), 10px)',
            boxShadow: 'var(--shadow-elevated)',
            overflow: 'hidden',
            ...stripPosition(panelStyle),
          }}
        >
          {({ close }) => (
            /*
             * One scroll container. A tall panel scrolls inside the height react-aria
             * leaves it rather than growing past the viewport -- the same single-scroller
             * rule that fixed the motion preset list, where a scroll container nested in
             * another meant the wheel event stopped at whichever the pointer was over.
             */
            <div
              className="max-h-[72vh] overflow-y-auto overscroll-contain touch-pan-y"
            >
              {children(close)}
            </div>
          )}
        </AriaDialog>
      </AriaPopover>
    </AriaDialogTrigger>
  );
}

/** react-aria positions the panel, so drop any absolute offsets the old API carried. */
function stripPosition(style?: CSSProperties): CSSProperties {
  if (!style) return {};
  const { position, top, right, bottom, left, transform, ...rest } = style;
  void position;
  void top;
  void right;
  void bottom;
  void left;
  void transform;
  return rest;
}
