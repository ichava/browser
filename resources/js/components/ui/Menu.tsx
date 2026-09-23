import type { ReactElement, ReactNode } from 'react';
import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuTrigger as AriaMenuTrigger,
  Popover as AriaPopover,
  Pressable,
} from 'react-aria-components';

/**
 * Menu — an action menu on react-aria, replacing the shadcn/Radix `DropdownMenu`.
 *
 * A menu rather than a popover full of buttons, because the semantics differ and screen
 * readers act on them: `role="menu"` announces an item count, Home/End jump, and
 * typeahead selects. A popover of buttons gives none of that.
 *
 * `Pressable` wraps the trigger for the same reason as in `Popover` and `Tooltip`: the
 * call sites pass plain styled `<button>`s, and adapting them beats rewriting each one as
 * a react-aria `Button` and losing its styling.
 */
export function Menu({
  trigger,
  items,
  align = 'left',
  label = 'Menu',
}: {
  trigger: ReactElement;
  items: { id: string; label: ReactNode; onAction: () => void; danger?: boolean }[];
  align?: 'left' | 'right';
  label?: string;
}) {
  return (
    <AriaMenuTrigger>
      <Pressable>{trigger as never}</Pressable>
      <AriaPopover
        placement={`bottom ${align === 'right' ? 'end' : 'start'}` as never}
        offset={6}
        className="z-(--z-popover)"
        style={{ fontSize: 'var(--app-font, 13.5px)' }}
      >
        <AriaMenu
          aria-label={label}
          className="ich-pop min-w-36 overflow-y-auto p-1 outline-hidden"
          style={{
            maxHeight: '72vh',
            background: 'var(--pop)',
            border: '1px solid var(--border)',
            borderRadius: 'min(calc(var(--radius) + 2px), 10px)',
            boxShadow: 'var(--shadow-elevated)',
          }}
        >
          {items.map((item) => (
            <AriaMenuItem
              key={item.id}
              onAction={item.onAction}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden select-none data-focused:bg-secondary"
              style={{ color: item.danger ? 'var(--danger)' : 'var(--fg)' }}
            >
              {item.label}
            </AriaMenuItem>
          ))}
        </AriaMenu>
      </AriaPopover>
    </AriaMenuTrigger>
  );
}
