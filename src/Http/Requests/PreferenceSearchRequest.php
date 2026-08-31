<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * PreferenceSearchRequest
 *
 * Validates search query updates
 */
class PreferenceSearchRequest extends FormRequest
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
            'search' => 'nullable|string|max:255',
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
            'search.max' => 'Search query must not exceed 255 characters',
        ];
    }
}
