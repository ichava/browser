<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\View\Components\Layouts;

use Illuminate\View\Component;
use Illuminate\View\View;

/**
 * Browser Layout Component
 *
 * Main layout wrapper for the Ichava icon browser.
 * Extends the base app layout with browser-specific header and structure.
 */
class Browser extends Component
{
    /**
     * Create a new component instance.
     *
     * @param  string  $title  Page title
     * @param  array|null  $statistics  Icon statistics data
     */
    public function __construct(
        public string $title = 'Icon Browser',
        public ?array $statistics = null
    ) {}

    /**
     * Get the view / contents that represent the component.
     */
    public function render(): View
    {
        return view('ichava::components.layouts.browser');
    }
}
