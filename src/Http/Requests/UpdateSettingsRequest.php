<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UpdateSettingsRequest
 *
 * Validates settings modal updates for icon browser application settings
 */
class UpdateSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // Display Settings
            'display' => 'sometimes|array',
            'display.show_labels' => 'sometimes|boolean',
            'display.animate_on_hover' => 'sometimes|boolean',
            'display.stroke_width' => 'sometimes|numeric|min:1|max:5',

            // Performance Settings
            'performance' => 'sometimes|array',
            'performance.lazy_loading' => 'sometimes|boolean',
            'performance.virtual_scrolling' => 'sometimes|boolean',

            // Caching Settings
            'caching' => 'sometimes|array',
            'caching.enabled' => 'sometimes|boolean',
            'caching.duration' => 'sometimes|integer|min:60|max:86400',
            'caching.size' => 'sometimes|integer|min:10|max:1000',

            // Export Settings
            'export' => 'sometimes|array',
            'export.default_format' => 'sometimes|string|in:svg,png,jpeg',
            'export.default_size' => 'sometimes|integer|min:16|max:2048',

            // Accessibility Settings
            'accessibility' => 'sometimes|array',
            'accessibility.reduce_motion' => 'sometimes|boolean',
            'accessibility.high_contrast' => 'sometimes|boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'display.stroke_width.min' => 'Stroke width must be at least 1',
            'display.stroke_width.max' => 'Stroke width must not exceed 5',

            'caching.duration.min' => 'Cache duration must be at least 60 seconds (1 minute)',
            'caching.duration.max' => 'Cache duration must not exceed 86400 seconds (24 hours)',
            'caching.size.min' => 'Cache size must be at least 10 items',
            'caching.size.max' => 'Cache size must not exceed 1000 items',

            'export.default_format.in' => 'Invalid export format. Must be: svg, png, or jpeg',
            'export.default_size.min' => 'Export size must be at least 16px',
            'export.default_size.max' => 'Export size must not exceed 2048px',
        ];
    }

    /**
     * Get default values for settings
     *
     * @return array<string, mixed>
     */
    public function defaults(): array
    {
        return [
            'display' => [
                'show_labels' => true,
                'animate_on_hover' => true,
                'stroke_width' => 2,
            ],
            'performance' => [
                'lazy_loading' => true,
                'virtual_scrolling' => true,
            ],
            'caching' => [
                'enabled' => true,
                'duration' => 3600,
                'size' => 100,
            ],
            'export' => [
                'default_format' => 'svg',
                'default_size' => 512,
            ],
            'accessibility' => [
                'reduce_motion' => false,
                'high_contrast' => false,
            ],
        ];
    }
}
