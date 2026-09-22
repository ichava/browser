import type { CSSProperties, ReactNode } from 'react';
import { X } from '@untitledui/icons';
import { Button as AriaButton } from 'react-aria-components';

import { Dialog, Modal as UuiModal, ModalOverlay } from '@js/components/application/modals/modal';

/**
 * Modal — overlay + centred panel, on Untitled UI.
 *
 * The public API (`onClose`/`width`/`align`/`panelStyle`/`label`) is unchanged, so all
 * sixteen dialog components are untouched by the swap.
 *
 * This was Radix Dialog, and mixing it with react-aria overlays was a real bug, not just
 * an inconsistency. **Radix sets `pointer-events: none` on the body while a dialog is
 * open** and re-enables it only inside the dialog subtree. Every react-aria popover --
 * every migrated Select, the motion combo box -- portals to `<body>`, i.e. outside that
 * subtree, so its options rendered, were visible, and could not be clicked. Playwright's
 * account was literally `<html> intercepts pointer events`. Selects inside modals were
 * unusable, which is what the dropdowns-don't-work reports were describing.
 *
 * On one overlay system the stacking and pointer-events agree, and the fix is structural
 * rather than a z-index that happens to win today.
 *
 * The border is gone too. The old panel carried `border-[var(--border)]` over `--pop`, which read
 * as a hard dark outline in dark mode and did not match any other surface. Untitled UI
 * separates a modal from the page with elevation -- `shadow-xl` over a dimmed, blurred
 * overlay -- which is the design system's own answer and needs no border.
 */
export function Modal({
  onClose,
  children,
  width,
  align = 'center',
  panelStyle,
  label = 'Dialog',
  showClose = true,
  closeLabel = 'Close',
}: {
  onClose: () => void;
  children: ReactNode;
  width: number;
  align?: 'center' | 'top';
  panelStyle?: CSSProperties;
  label?: string;
  /**
   * Render the shared close button. Defaults to true, so a dialog gets one by simply
   * existing rather than by remembering to add one -- five of them had no close
   * affordance at all beyond Escape, which is invisible to a pointer user.
   *
   * Set false only where the dialog already draws its own in a header row.
   */
  showClose?: boolean;
  closeLabel?: string;
}) {
  return (
    <ModalOverlay
      isOpen
      onOpenChange={(open) => !open && onClose()}
      // Click-outside and Escape both close, which is what every call site assumed Radix
      // was doing for it.
      isDismissable
      className={align === 'top' ? 'items-start sm:items-start' : undefined}
    >
      {/*
       * `--surface`, not the design system's default `bg-primary`.
       *
       * Untitled UI puts modals on `bg-primary` because their page sits on `bg-secondary`.
       * This app assigns those two tokens by ROLE per theme (see `--canvas`/`--surface`),
       * so in dark the page is already `bg-primary` and a modal using it would be the
       * exact colour of the canvas behind it -- elevated by shadow alone. Using the raised
       * token keeps a modal consistent with every other raised surface, in both themes.
       */}
      <UuiModal
        style={{ width, maxWidth: '94vw', fontSize: 'var(--app-font, 13.5px)' }}
        // `overflow-hidden` so children are CLIPPED to the panel's rounded shape. Dialog
        // headers and footers are `position: sticky` with an opaque background, and
        // without clipping they paint their own square corners straight over the panel's
        // rounded ones -- which is the sharp-corner symptom. The inner Dialog owns
        // scrolling, so the panel itself never needs to scroll.
        className={`overflow-hidden bg-[var(--surface)] ${align === 'top' ? 'mt-[8vh]' : ''}`}
      >
        {/*
         * `aria-label` on the Dialog rather than a visually-hidden title element: the
         * previous implementation needed a `<DialogTitle className="sr-only">` because
         * Radix warns without one, and that extra node then had to be skipped by every
         * layout. react-aria takes the accessible name directly.
         *
         * Focus lands on the dialog, not its first focusable descendant. Radix's default
         * sent it to whatever control came first in the DOM -- in the icon detail dialog
         * the secondary "Copy permalink" button, which announced a copy action instead of
         * the dialog and popped that button's tooltip with no pointer or keyboard intent.
         * That also made the visual baseline non-deterministic, because the tooltip has a
         * 350ms open delay and its presence depended on how the capture raced it.
         */}
        <Dialog aria-label={label} className="flex max-h-[inherit] flex-col gap-0" style={panelStyle}>
          {/*
           * One close affordance, owned here.
           *
           * Seven dialogs each drew their own X and five drew none, so placement, size and
           * hit area all differed and some were closeable only by Escape. Absolutely
           * positioned rather than placed in a header, because these dialogs do not share
           * a header component -- this way it lands in the same corner regardless of what
           * the dialog puts at the top.
           */}
          {showClose && (
            <AriaButton
              onPress={onClose}
              aria-label={closeLabel}
              className="absolute end-3 top-3 z-1 flex size-8 cursor-pointer items-center justify-center rounded-lg text-fg-quaternary outline-hidden transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:ring-2 focus-visible:ring-brand"
            >
              <X className="size-4 stroke-[2.25px]" />
            </AriaButton>
          )}
          {children}
        </Dialog>
      </UuiModal>
    </ModalOverlay>
  );
}
