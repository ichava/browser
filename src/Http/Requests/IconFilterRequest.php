<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Icon Filter Request
 *
 * Validates and sanitizes icon filtering, searching, sorting and pagination parameters
 */
class IconFilterRequest extends FormRequest
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
     */
    public function rules(): array
    {
        return [
            // Search
            'search' => ['nullable', 'string', 'max:255', 'min:2'],

            // Filters
            'packages'     => ['nullable', 'array', 'max:20'],
            'packages.*'   => ['required', 'string', 'max:100'],
            'categories'   => ['nullable', 'array', 'max:50'],
            'categories.*' => ['required', 'string', 'max:100'],
            'variants'     => ['nullable', 'array', 'max:20'],
            'variants.*'   => ['required', 'string', 'max:50'],

            // Pagination
            'page'     => ['nullable', 'integer', 'min:1', 'max:10000'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:120'],

            // Sorting
            'sort_by'        => ['nullable', 'string', 'in:name,package,category,created_at'],
            'sort_direction' => ['nullable', 'string', 'in:asc,desc'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'search.min'        => 'Search query must be at least 2 characters.',
            'search.max'        => 'Search query cannot exceed 255 characters.',
            'packages.max'      => 'You cannot select more than 20 packages at once.',
            'categories.max'    => 'You cannot select more than 50 categories at once.',
            'per_page.min'      => 'Results per page must be at least 10.',
            'per_page.max'      => 'Results per page cannot exceed 120.',
            'sort_by.in'        => 'Invalid sort field. Must be one of: name, package, category, created_at.',
            'sort_direction.in' => 'Sort direction must be either asc or desc.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'search'         => 'search query',
            'packages'       => 'package filters',
            'categories'     => 'category filters',
            'variants'       => 'variant filters',
            'page'           => 'page number',
            'per_page'       => 'results per page',
            'sort_by'        => 'sort field',
            'sort_direction' => 'sort direction',
        ];
    }

    /**
     * Get the validated search query
     */
    public function getSearch(): ?string
    {
        return $this->validated('search') ? trim($this->validated('search')) : null;
    }

    /**
     * Get the validated package filters
     */
    public function getPackages(): array
    {
        return $this->validated('packages', []);
    }

    /**
     * Get the validated category filters
     */
    public function getCategories(): array
    {
        return $this->validated('categories', []);
    }

    /**
     * Get the validated variant filters
     */
    public function getVariants(): array
    {
        return $this->validated('variants', []);
    }

    /**
     * Get the validated page number
     */
    public function getPage(): int
    {
        return (int) $this->validated('page', 1);
    }

    /**
     * Get the validated per page value
     */
    public function getPerPage(): int
    {
        return (int) $this->validated('per_page', 60);
    }

    /**
     * Get the validated sort by field
     */
    public function getSortBy(): string
    {
        return $this->validated('sort_by', 'name');
    }

    /**
     * Get the validated sort direction
     */
    public function getSortDirection(): string
    {
        return $this->validated('sort_direction', 'asc');
    }

    /**
     * Check if a search query is present
     */
    public function hasSearch(): bool
    {
        return ! empty($this->getSearch());
    }

    /**
     * Check if any filters are applied
     */
    public function hasFilters(): bool
    {
        return ! empty($this->getPackages())
            || ! empty($this->getCategories())
            || ! empty($this->getVariants());
    }
}