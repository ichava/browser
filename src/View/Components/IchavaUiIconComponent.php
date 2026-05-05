<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\View\Components;

use Simtabi\Laranail\Ichava\Browser\Constants\IchavaUiIconsConstants;
use Simtabi\Laranail\Ichava\View\Components\IconComponent as BaseIconComponent;

/**
 * IchavaUiIconComponent
 *
 * Blade component for rendering UI icons from the base ichava package.
 * These icons are used for the icon browser interface and navigation.
 * Icons are organized in the 'ui-icons' subdirectory (category).
 *
 * Recommended Usage (full path syntax):
 * <x-ichava::icon name="ichava/ui-icons::search" />
 * <x-ichava::icon name="ichava/ui-icons::filter" class="w-5 h-5" />
 * <x-ichava::icon name="ichava/ui-icons::moon" />
 * <x-ichava::icon name="ichava/ui-icons::sun" />
 *
 * @package Simtabi\Laranail\Ichava\Browser\View\Components
 */
class IchavaUiIconComponent extends BaseIconComponent
{
    /**
     * Create a new component instance.
     * Sets default category to 'ui-icons' subdirectory.
     */
    public function __construct(
        string $name,
        ?string $set = null,
        ?string $variant = null,
        ?string $category = 'ui-icons', // Default category
        ?string $size = null,
        ?string $width = null,
        ?string $height = null,
        bool $lockAspectRatio = true,
    ) {
        parent::__construct(
            $name,
            $set,
            $variant,
            $category,
            $size,
            $width,
            $height,
            $lockAspectRatio
        );
    }

    /**
     * Get the UI icon set name
     */
    protected function getIconSet(): string
    {
        return IchavaUiIconsConstants::getName();
    }

    /**
     * Get the full vendor/package path
     */
    protected function getVendorPackage(): string
    {
        return IchavaUiIconsConstants::getVendorPackage();
    }
}

