<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\View\Components;

use Simtabi\Laranail\Ichava\Constants\IchavaTestIconsConstants;
use Simtabi\Laranail\Ichava\View\Components\IconComponent as BaseIconComponent;

/**
 * IchavaTestIconComponent
 *
 * Blade component for rendering test icons from the base ichava package.
 * Icons are organized in the 'test-icons' subdirectory (category).
 *
 * Recommended Usage (full path syntax):
 * <x-ichava::icon name="ichava/test-icons::check" />
 * <x-ichava::icon name="ichava/test-icons::circle" class="w-6 h-6" />
 * <x-ichava::icon name="ichava/test-icons::square" />
 *
 * @package Simtabi\Laranail\Ichava\Browser\View\Components
 */
class IchavaTestIconComponent extends BaseIconComponent
{
    /**
     * Create a new component instance.
     * Sets default category to 'test-icons' subdirectory.
     */
    public function __construct(
        string $name,
        ?string $set = null,
        ?string $variant = null,
        ?string $category = 'test-icons', // Default category
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
     * Get the test icon set name
     */
    protected function getIconSet(): string
    {
        return IchavaTestIconsConstants::getName();
    }

    /**
     * Get the full vendor/package path
     */
    protected function getVendorPackage(): string
    {
        return IchavaTestIconsConstants::getVendorPackage();
    }
}
