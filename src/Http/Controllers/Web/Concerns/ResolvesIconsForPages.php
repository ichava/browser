<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\IconBrowser\Http\Controllers\Web\Concerns;

use Simtabi\Laranail\Ichava\Models\Icon;

/**
 * @property \Simtabi\Laranail\Ichava\Services\IconBrowserService $browserService
 *
 * Consuming controllers provide `$browserService` via constructor promotion;
 * the trait only assumes its presence.
 */
trait ResolvesIconsForPages
{
    /**
     * Load icons by id into the full client shape.
     *
     * Uses the same `transformIcon` shaping as the icon listing so every page
     * hands the frontend one uniform `RawIcon` contract for `propsToCatalog`.
     * Order follows the database, not the input ids; callers that need
     * input order re-sort from the returned `id` fields.
     *
     * @param array<int> $ids
     *
     * @return array<int, array<string, mixed>>
     */
    protected function pageIcons(array $ids): array
    {
        if ($ids === []) {
            return [];
        }

        return Icon::whereIn('id', $ids)
            ->get()
            ->map(fn (Icon $icon) => $this->browserService->transformIcon($icon))
            ->values()
            ->toArray();
    }
}
