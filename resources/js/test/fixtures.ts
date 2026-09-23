import type { Icon } from '@/core/model';
import type { Catalog } from '@/core/IconRepository';

export function mkIcon(p: Partial<Icon> & { id: number; name: string }): Icon {
  return {
    id: p.id,
    package: p.package ?? 'ichava/tabler-icons',
    name: p.name,
    category: p.category ?? 'general',
    sub: p.sub,
    variant: p.variant ?? 'outline',
    kind: p.kind ?? 'icon',
    svgContent: p.svgContent ?? null,
    svgUrl: p.svgUrl ?? `assets/tabler/${p.name}.svg`,
    viewBox: p.viewBox ?? '0 0 24 24',
    bladeClean: p.bladeClean ?? `<x-ichava::tabler name="${p.name}" />`,
    bladeGeneric: p.bladeGeneric ?? `<x-ichava-icon name="tabler:${p.name}" />`,
    helper: p.helper ?? `ichava('tabler:${p.name}')`,
    tags: p.tags ?? [],
    keywords: p.keywords ?? [],
    ownColor: p.ownColor ?? false,
  };
}

export const catalog: Catalog = {
  meta: { total_ecosystem: 1000, generated: '2026-01-01' },
  packages: [
    { id: 'ichava/tabler-icons', label: 'tabler-icons', count: 4, installed: true, loaded: true },
    { id: 'ichava/ui-icons', label: 'ui-icons', count: 1, installed: true, loaded: true },
  ],
  icons: [
    mkIcon({ id: 1, name: 'home', category: 'general', tags: ['house'] }),
    mkIcon({ id: 2, name: 'user', category: 'general', tags: ['person', 'account'] }),
    mkIcon({ id: 3, name: 'mail', category: 'communication', tags: ['email'] }),
    mkIcon({ id: 4, name: 'bell', category: 'communication', variant: 'filled' }),
    mkIcon({ id: 5, name: 'search', package: 'ichava/ui-icons', category: 'interface', svgUrl: 'assets/ui/search.svg' }),
  ],
};
