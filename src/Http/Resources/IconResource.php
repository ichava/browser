<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;
use Simtabi\Laranail\Ichava\Models\Icon;

/**
 * IconResource - Transform Icon model to API response
 *
 * Provides consistent JSON structure for icon data across all API endpoints.
 * Includes SVG metadata, rendering helpers, and relationships.
 *
 * @mixin Icon
 */
class IconResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Icon $icon */
        $icon = $this->resource;

        return [
            'id' => $icon->id,
            'package' => $icon->package,
            'name' => $icon->name,
            
            // Category & Variant (from relationships)
            'category' => $icon->primary_category?->slug,
            'variant' => $icon->primary_variant?->slug,
            
            // Paths
            'path' => $icon->icon_path,
            'icon_path' => $icon->icon_path,
            'file_path' => $icon->path ?? '',
            
            // SVG Content & URL
            'svg_content' => $icon->svg_content,
            'svg_url' => route('ichava.api.icons.svg', ['id' => $icon->id], false),
            
            // SVG Attributes (from JSON)
            'viewbox' => $icon->viewbox,
            'width' => $icon->width,
            'height' => $icon->height,
            
            // Blade Component Helpers
            'blade_clean' => $this->generateBladeClean($icon),
            'blade_generic' => $this->generateBladeGeneric($icon),
            'helper' => $this->generateHelper($icon),
            
            // Metadata
            'set' => $icon->package,
            'tags' => $icon->tags ?? [],
            'keywords' => $icon->keywords ?? [],
            
            // Timestamps
            'created_at' => $icon->created_at?->toIso8601String(),
            'updated_at' => $icon->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Generate clean Blade component syntax
     */
    protected function generateBladeClean(Icon $icon): string
    {
        $packageName = $icon->package;
        $category = $icon->primary_category?->slug ?? '';

        if (!Str::contains($packageName, '/')) {
            return "<x-ichava::icon name=\"{$icon->icon_path}\" class=\"w-6 h-6\" />";
        }

        $vendor = Str::before($packageName, '/');
        $packagePart = Str::after($packageName, '/');

        if ($vendor === 'ichava' && $packagePart) {
            $componentName = 'ichava-' . str_replace('-icons', '', $packagePart);
            $attrs = "name=\"{$icon->name}\"";
            
            if ($category) {
                $attrs .= " category=\"{$category}\"";
            }
            
            $attrs .= " class=\"w-6 h-6\"";

            return "<x-ichava::{$componentName} {$attrs} />";
        }

        return "<x-ichava::icon name=\"{$icon->icon_path}\" class=\"w-6 h-6\" />";
    }

    /**
     * Generate generic Blade component syntax
     */
    protected function generateBladeGeneric(Icon $icon): string
    {
        return "<x-ichava::icon name=\"{$icon->icon_path}\" class=\"w-6 h-6\" />";
    }

    /**
     * Generate helper function syntax
     */
    protected function generateHelper(Icon $icon): string
    {
        return "ichava('{$icon->icon_path}', ['class' => 'w-6 h-6'])";
    }
}

