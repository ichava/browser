import { usePage } from '@inertiajs/react';
import type { SharedProps } from '../../types';

interface BrowserIndexProps extends SharedProps {
    statistics: {
        total_icons: number;
        total_packages: number;
        total_categories: number;
        total_variants: number;
    } | null;
}

export default function BrowserIndex() {
    const { auth, flash, ichava, statistics } = usePage<BrowserIndexProps>().props;

    return (
        <div className="min-h-screen theme-bg-page theme-text-primary p-8">
            <header className="mb-8">
                <h1 className="text-2xl font-semibold">
                    Ichava <span className="theme-text-accent">Inertia</span> Browser
                </h1>
                <p className="theme-text-secondary mt-1 text-sm">
                    Phase 1 placeholder — served via Inertia from Laravel, rendered in React.
                </p>
            </header>

            {flash.success && (
                <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-400">
                    {flash.success}
                </div>
            )}

            {flash.error && (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
                    {flash.error}
                </div>
            )}

            <dl className="grid max-w-2xl grid-cols-2 gap-4">
                <div className="theme-bg-card rounded-lg border theme-border p-4">
                    <dt className="theme-text-muted text-xs uppercase">Icons</dt>
                    <dd className="text-xl font-semibold">{statistics?.total_icons ?? '—'}</dd>
                </div>
                <div className="theme-bg-card rounded-lg border theme-border p-4">
                    <dt className="theme-text-muted text-xs uppercase">Packages</dt>
                    <dd className="text-xl font-semibold">{statistics?.total_packages ?? '—'}</dd>
                </div>
                <div className="theme-bg-card rounded-lg border theme-border p-4">
                    <dt className="theme-text-muted text-xs uppercase">Categories</dt>
                    <dd className="text-xl font-semibold">{statistics?.total_categories ?? '—'}</dd>
                </div>
                <div className="theme-bg-card rounded-lg border theme-border p-4">
                    <dt className="theme-text-muted text-xs uppercase">Variants</dt>
                    <dd className="text-xl font-semibold">{statistics?.total_variants ?? '—'}</dd>
                </div>
            </dl>

            <p className="theme-text-muted mt-8 text-xs">
                {auth ? `Signed in as ${auth.name}` : 'Browsing as guest'} · prefix /{ichava.prefix}
            </p>
        </div>
    );
}
