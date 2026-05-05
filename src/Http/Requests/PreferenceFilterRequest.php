<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * PreferenceFilterRequest
 * 
 * Validates filter-only updates (packages, categories, variants)
 */
class PreferenceFilterRequest extends FormRequest
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
            'packages'     => 'sometimes|array',
            'packages.*'   => 'sometimes|string|max:100',
            'categories'   => 'sometimes|array',
            'categories.*' => 'sometimes|string|max:100',
            'variants'     => 'sometimes|array',
            'variants.*'   => 'sometimes|string|max:100',
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
            'packages.*.max' => 'Package name must not exceed 100 characters',
            'categories.*.max' => 'Category name must not exceed 100 characters',
            'variants.*.max' => 'Variant name must not exceed 100 characters',
        ];
    }
}

