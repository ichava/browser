<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\View\Components\Layouts;

use Illuminate\View\Component;
use Illuminate\View\View;

/**
 * App Layout Component
 *
 * Base layout wrapper for all Ichava pages.
 * Provides common HTML structure, meta tags, and asset loading.
 */
class App extends Component
{
    /**
     * Create a new component instance.
     *
     * @param  string  $title  Page title
     * @param  string|null  $description  Page meta description
     */
    public function __construct(
        public string $title = 'Ichava',
        public ?string $description = null
    ) {}

    /**
     * Get the view / contents that represent the component.
     */
    public function render(): View
    {
        return view('ichava::components.layouts.app');
    }
}
