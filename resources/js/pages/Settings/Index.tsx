import { Link, useForm, usePage } from '@inertiajs/react';
import { FlashBanner } from '@js/components/FlashBanner';
import type { SharedProps } from '@js/types';

interface PreferenceGroups {
  preferences?: { view_mode?: string; icon_size?: number; per_page?: number };
  sorting?: { sort_by?: string; sort_direction?: string };
  [key: string]: unknown;
}

interface SettingsIndexProps extends SharedProps {
  preferences: PreferenceGroups;
}

const inputClass = 'theme-bg-input rounded-md border theme-border px-2.5 py-1.5 text-sm theme-text-primary w-full';
const labelClass = 'theme-text-muted text-xs font-medium uppercase';

export default function SettingsIndex() {
  const { props } = usePage<SettingsIndexProps>();
  const stored = props.preferences ?? {};

  const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
    preferences: {
      view_mode: stored.preferences?.view_mode ?? 'grid',
      icon_size: stored.preferences?.icon_size ?? 48,
      per_page: stored.preferences?.per_page ?? 60,
    },
    sorting: {
      sort_by: stored.sorting?.sort_by ?? 'name',
      sort_direction: stored.sorting?.sort_direction ?? 'asc',
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    put(props.ichava.routes.settings, { preserveState: true });
  };

  const fieldErrors = errors as Record<string, string | undefined>;
  const fieldError = (key: string) =>
    fieldErrors[key] ? <p className="mt-1 text-xs text-red-400">{fieldErrors[key]}</p> : null;

  return (
    <div className="theme-bg-page theme-text-primary min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        <p className="theme-text-muted text-xs uppercase">Configuration</p>
        <h1 className="mt-1 text-2xl font-semibold">Settings</h1>

        <FlashBanner />

        <form onSubmit={submit} className="theme-bg-card mt-6 rounded-xl border theme-border space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="view-mode">View mode</label>
              <select
                id="view-mode"
                className={`${inputClass} mt-1.5`}
                value={data.preferences.view_mode}
                onChange={(e) => setData('preferences.view_mode', e.target.value)}
              >
                <option value="grid">Grid</option>
                <option value="list">List</option>
              </select>
              {fieldError('preferences.view_mode')}
            </div>

            <div>
              <label className={labelClass} htmlFor="icon-size">Icon size (px)</label>
              <input
                id="icon-size"
                type="number"
                min={24}
                max={640}
                className={`${inputClass} mt-1.5`}
                value={data.preferences.icon_size}
                onChange={(e) => setData('preferences.icon_size', Number(e.target.value))}
              />
              {fieldError('preferences.icon_size')}
            </div>

            <div>
              <label className={labelClass} htmlFor="per-page">Results per page</label>
              <input
                id="per-page"
                type="number"
                min={12}
                max={120}
                className={`${inputClass} mt-1.5`}
                value={data.preferences.per_page}
                onChange={(e) => setData('preferences.per_page', Number(e.target.value))}
              />
              {fieldError('preferences.per_page')}
            </div>

            <div>
              <label className={labelClass} htmlFor="sort-by">Sort by</label>
              <select
                id="sort-by"
                className={`${inputClass} mt-1.5`}
                value={data.sorting.sort_by}
                onChange={(e) => setData('sorting.sort_by', e.target.value)}
              >
                <option value="name">Name</option>
                <option value="package">Package</option>
                <option value="category">Category</option>
                <option value="created_at">Newest</option>
              </select>
              {fieldError('sorting.sort_by')}
            </div>

            <div>
              <label className={labelClass} htmlFor="sort-direction">Direction</label>
              <select
                id="sort-direction"
                className={`${inputClass} mt-1.5`}
                value={data.sorting.sort_direction}
                onChange={(e) => setData('sorting.sort_direction', e.target.value)}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              {fieldError('sorting.sort_direction')}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={processing}
              className="theme-bg-accent theme-text-inverse rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {processing ? 'Saving…' : 'Save settings'}
            </button>
            {recentlySuccessful && <span className="text-sm text-green-400">Saved.</span>}
            <span className="flex-1" />
            <Link href={props.ichava.routes.browser} className="theme-text-accent text-sm hover:underline">
              ← Back to browser
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
