<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * PreferenceUpdateRequest
 *
 * Validates bulk preference updates for icon browser
 */
class PreferenceUpdateRequest extends FormRequest
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
            // Allow all fields to pass through - they'll be validated by the service
            '*' => 'sometimes',
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
            'sorting.sort_by.in' => 'Invalid sort field. Must be: name, package, category, created_at, or updated_at',
            'sorting.sort_direction.in' => 'Invalid sort direction. Must be: asc or desc',
            'preferences.view_mode.in' => 'Invalid view mode. Must be: grid or list',
            'preferences.icon_size.min' => 'Icon size must be at least 24px',
            'preferences.icon_size.max' => 'Icon size must not exceed 640px',
            'preferences.per_page.min' => 'Per page must be at least 12',
            'preferences.per_page.max' => 'Per page must not exceed 120',
            'preferences.is_dark.boolean' => 'Theme preference must be a boolean',
        ];
    }
}
