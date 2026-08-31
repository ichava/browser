<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Constants;

use Simtabi\Laranail\Ichava\Constants\JsonConfigConstants;
use Simtabi\Laranail\Ichava\Support\PathResolver;

/**
 * IchavaUiIconsConstants
 *
 * Constants for the ichava/browser-ui icon set.
 * All values automatically extracted from config.json via base class.
 *
 * @see JsonConfigConstants
 */
final class IchavaUiIconsConstants extends JsonConfigConstants
{
    /**
     * Get path to config.json directory
     */
    protected static function getConfigPath(): string
    {
        return PathResolver::resolvePackagePath(self::class, levelsUp: 3, append: 'resources/assets/svg/ui-icons');
    }
}
