import type { FC, ReactNode } from 'react';
import { ChevronRight } from '@untitledui/icons';
import {
  Button as AriaButton,
  Tree as AriaTree,
  TreeItem as AriaTreeItem,
  TreeItemContent as AriaTreeItemContent,
  type TreeProps as AriaTreeProps,
  type TreeItemProps as AriaTreeItemProps,
} from 'react-aria-components';

import { Checkbox } from '@js/components/base/checkbox/checkbox';
import { cx } from '@js/lib/utils/cx';

/**
 * TreeView — Untitled UI's tree, on react-aria's `Tree` primitives.
 *
 * Written here rather than pulled with `npx untitledui add tree-view`, which gates this
 * component behind a PRO login that cannot be completed non-interactively. The prop
 * surface deliberately matches the official one -- `size`, `showConnectors`,
 * `selectionMode`, `items`, `defaultExpandedKeys`, `TreeView.Item`,
 * `TreeView.ItemContent` -- so running the CLI later overwrites this file and every call
 * site keeps working.
 *
 * It replaces the vendored `kibo-ui` tree, which hand-rolled expansion state, indentation
 * and connector lines in 340 lines of `div`s with no tree semantics at all: no
 * `role="tree"`, no arrow-key navigation, no typeahead, and selection that existed only as
 * the checkboxes each row happened to render. react-aria supplies all of that.
 */

/**
 * Row metrics per size.
 *
 * Emitted as CSS custom properties rather than classes because the row lives inside a
 * render callback that has no access to the root's props -- and because it keeps padding,
 * icon size and indent as one decision instead of three that can drift.
 */
const sizes = {
  sm: { row: '0.375rem', icon: '1rem', indent: '20px' },
  md: { row: '0.5rem', icon: '1.25rem', indent: '24px' },
} as const;

interface TreeViewProps<T extends object> extends Omit<AriaTreeProps<T>, 'className' | 'children'> {
  /** Row density. Matches the design system's two tree sizes. */
  size?: keyof typeof sizes;
  /** Draw the vertical guide lines that connect a parent to its descendants. */
  showConnectors?: boolean;
  className?: string;
  children: ReactNode | ((item: T) => ReactNode);
}

function TreeViewRoot<T extends object>({
  size = 'sm',
  showConnectors = false,
  className,
  ...props
}: TreeViewProps<T>) {
  return (
    <AriaTree
      {...(props as AriaTreeProps<T>)}
      // Data attributes rather than context: the item rows need the size and connector
      // decision, and CSS can read them without every row subscribing to a provider.
      data-size={size}
      data-connectors={showConnectors ? '' : undefined}
      className={cx('ich-tree w-full outline-hidden', className)}
      // Row padding and icon size come from the same table as the indent, so `size` is one
      // decision rather than three that can drift apart.
      style={{ ['--ich-tree-row' as string]: sizes[size].row, ['--ich-tree-icon' as string]: sizes[size].icon }}
    />
  );
}

interface ItemProps extends Omit<AriaTreeItemProps, 'className'> {
  className?: string;
}

/** A row. Nest a `<Collection>` inside for children, exactly as react-aria expects. */
function Item({ className, ...props }: ItemProps) {
  return (
    <AriaTreeItem
      {...props}
      className={cx(
        'ich-tree-item outline-hidden',
        'data-focus-visible:ring-2 data-focus-visible:ring-brand',
        className,
      )}
    />
  );
}

/**
 * The visible contents of a row: chevron, optional selection checkbox, optional icon, and
 * the label.
 *
 * Indentation comes from react-aria's `level` render prop rather than from nesting
 * padding, so a deeply nested row still aligns when its ancestors are collapsed.
 */
function ItemContent({
  icon: Icon,
  children,
  className,
}: {
  icon?: FC<{ className?: string }>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AriaTreeItemContent>
      {({ isExpanded, hasChildItems, level, selectionMode }) => (
        <div
          className={cx(
            'group/row relative flex cursor-pointer items-center gap-1.5 rounded-md px-1.5',
            'hover:bg-[var(--muted2)]',
            className,
          )}
          style={{
            // `level` is 1-based; the first level sits flush.
            paddingInlineStart: `calc(${level - 1} * var(--ich-tree-indent, 20px) + 6px)`,
            paddingBlock: 'var(--ich-tree-row, 0.375rem)',
          }}
        >
          {/*
           * Connector guides: one vertical rule per ancestor level.
           *
           * Rendered as elements rather than a repeating background so each sits at an
           * exact indent step, and shown or hidden purely by CSS from the root's
           * `data-connectors` -- the prop then actually does something instead of setting
           * an attribute nothing reads.
           */}
          {Array.from({ length: level - 1 }, (_, i) => (
            <span
              key={i}
              aria-hidden
              className="ich-tree-guide pointer-events-none absolute top-0 bottom-0 w-px"
              style={{ insetInlineStart: `calc(${i} * var(--ich-tree-indent, 20px) + 13px)` }}
            />
          ))}
          {hasChildItems ? (
            <AriaButton
              slot="chevron"
              className="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded text-fg-quaternary outline-hidden hover:text-fg-quaternary_hover"
            >
              <ChevronRight
                className={cx('size-3.5 transition-transform duration-150', isExpanded && 'rotate-90')}
              />
            </AriaButton>
          ) : (
            // A spacer, so labels line up whether or not a row can expand.
            <span aria-hidden className="size-4 shrink-0" />
          )}

          {selectionMode === 'multiple' && <Checkbox slot="selection" />}

          {Icon && (
            <span className="shrink-0 text-fg-quaternary" style={{ width: 'var(--ich-tree-icon, 1rem)', height: 'var(--ich-tree-icon, 1rem)' }}>
              <Icon className="size-full" />
            </span>
          )}

          <span className="min-w-0 flex-1 truncate">{children}</span>
        </div>
      )}
    </AriaTreeItemContent>
  );
}

export const TreeView = Object.assign(TreeViewRoot, { Item, ItemContent });
