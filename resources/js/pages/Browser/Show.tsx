import { useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { IconAsset } from '@js/components/ui/IconAsset';
import { Glyph } from '@js/components/ui/Glyph';
import { FlashBanner } from '@js/components/FlashBanner';
import { useCopy } from '@js/hooks/useClipboard';
import { normalizeRawIcon } from '@js/core/propsToCatalog';
import { toIcon, type RawIcon } from '@js/core/model';
import { snippets, SNIPPET_TABS, type SnippetFormat } from '@js/core/SnippetFactory';
import type { SharedProps } from '@js/types';

interface BrowserShowProps extends SharedProps {
  icon: RawIcon | null;
  related: RawIcon[];
}

export default function BrowserShow() {
  const { props } = usePage<BrowserShowProps>();
  const copy = useCopy();
  const [tab, setTab] = useState<SnippetFormat>('svg');
  const [copied, setCopied] = useState(false);

  const icon = useMemo(() => (props.icon ? toIcon(normalizeRawIcon(props.icon)) : null), [props.icon]);
  const related = useMemo(
    () => props.related.map((r) => toIcon(normalizeRawIcon(r))),
    [props.related],
  );

  const snippet = useMemo(
    () => (icon ? snippets.build(tab, icon, { size: 24, unit: 'px', color: null, strokeWidth: 2 }) : ''),
    [icon, tab],
  );

  if (!icon) {
    return (
      <div className="theme-bg-page theme-text-primary min-h-screen p-8">
        <p className="theme-text-muted text-sm">Icon not found.</p>
      </div>
    );
  }

  const showBase = `/${props.ichava.prefix}/icons`;

  const handleCopy = async () => {
    await copy(snippet, 'Snippet copied');
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="theme-bg-page theme-text-primary min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <Link href={props.ichava.routes.browser} className="theme-text-accent text-sm hover:underline">
          ← Back to browser
        </Link>

        <FlashBanner />

        <div className="mt-4 grid gap-6 md:grid-cols-[280px_1fr]">
          <div className="theme-bg-card rounded-xl border theme-border flex items-center justify-center p-10">
            <IconAsset icon={icon} size={160} inline />
          </div>

          <div>
            <h1 className="text-2xl font-semibold">{icon.name}</h1>
            <p className="theme-text-secondary mt-1 text-sm">
              {icon.package}
              {icon.category ? ` · ${icon.category}` : ''} · {icon.variant}
            </p>
            <button
              onClick={() =>
                router.post(
                  `${props.ichava.routes.favorites}/${icon.id}/toggle`,
                  {},
                  { preserveState: true },
                )
              }
              className="theme-bg-muted theme-text-secondary mt-3 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium"
            >
              <Glyph name="heart" size={13} color="currentColor" />
              Toggle favorite
            </button>

            {icon.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {icon.tags.map((tag) => (
                  <span key={tag} className="theme-bg-muted rounded px-2 py-0.5 text-xs theme-text-secondary">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6">
              <div className="flex gap-1">
                {SNIPPET_TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium theme-transition ${
                      tab === t.id ? 'theme-bg-accent theme-text-inverse' : 'theme-bg-muted theme-text-secondary'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <pre className="theme-bg-card mt-2 overflow-x-auto rounded-lg border theme-border p-4 text-xs">
                {snippet}
              </pre>
              <button
                onClick={handleCopy}
                className="theme-bg-muted mt-2 rounded-md px-3 py-1.5 text-xs font-medium theme-text-secondary"
              >
                {copied ? 'Copied!' : 'Copy snippet'}
              </button>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold">Related</h2>
            <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`${showBase}/${rel.id}`}
                  className="theme-bg-card theme-bg-card-hover rounded-lg border theme-border flex flex-col items-center gap-1 p-3 theme-transition"
                >
                  <IconAsset icon={rel} size={32} />
                  <span className="theme-text-muted w-full truncate text-center text-[11px]">{rel.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
