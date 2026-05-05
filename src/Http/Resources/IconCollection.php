<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

/**
 * IconCollection - Transform Icon collections with metadata
 *
 * Provides paginated icon collections with grouping support.
 */
class IconCollection extends ResourceCollection
{
    /**
     * The resource that this resource collects.
     *
     * @var string
     */
    public $collects = IconResource::class;

    /**
     * The grouping key (package, category, etc.)
     */
    protected ?string $groupBy = null;

    /**
     * Set the grouping key
     */
    public function groupBy(?string $key): self
    {
        $this->groupBy = $key;
        return $this;
    }

    /**
     * Transform the resource collection into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = parent::toArray($request);

        // Add grouped data if grouping is enabled
        if ($this->groupBy && !empty($data)) {
            $data['grouped'] = $this->groupIcons($data, $this->groupBy);
        }

        return $data;
    }

    /**
     * Group icons by a specific key
     */
    protected function groupIcons(array $data, string $groupBy): array
    {
        $grouped = [];

        foreach ($data as $icon) {
            if (!is_array($icon)) {
                continue;
            }

            $key = match($groupBy) {
                'package' => $icon['package'] ?? 'Unknown',
                'category' => $icon['category'] ?? 'Uncategorized',
                default => $icon['package'] ?? 'Unknown',
            };

            $grouped[$key][] = $icon;
        }

        return $grouped;
    }
}

