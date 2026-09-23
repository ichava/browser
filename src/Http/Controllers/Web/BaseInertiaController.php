<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\IconBrowser\Http\Controllers\Web;

use DateTime;
use Exception;
use Throwable;
use Illuminate\Routing\Controller;
use Simtabi\Laranail\Ichava\Models\Icon;
use Simtabi\Laranail\Ichava\Services\IchavaLogger;

abstract class BaseInertiaController extends Controller
{
    protected IchavaLogger $logger;

    public function __construct(IchavaLogger $logger)
    {
        $this->logger = $logger;
    }

    protected function iconExists(int $iconId): bool
    {
        return Icon::where('id', $iconId)->exists();
    }

    protected function formatTimeAgo(string $timestamp): string
    {
        try {
            $date = new DateTime($timestamp);
            $diff = (new DateTime)->diff($date);

            if ($diff->y > 0) {
                return $diff->y . 'y ago';
            }
            if ($diff->m > 0) {
                return $diff->m . 'mo ago';
            }
            if ($diff->d > 0) {
                return $diff->d . 'd ago';
            }
            if ($diff->h > 0) {
                return $diff->h . 'h ago';
            }
            if ($diff->i > 0) {
                return $diff->i . 'm ago';
            }

            return 'Just now';
        } catch (Exception) {
            return $timestamp;
        }
    }

    protected function logDebug(string $message, array $context = []): void
    {
        $this->logger->debug($message, $context);
    }

    protected function logInfo(string $message, array $context = []): void
    {
        $this->logger->info($message, $context);
    }

    protected function logWarning(string $message, array $context = []): void
    {
        $this->logger->warning($message, $context);
    }

    protected function logError(string $message, Throwable $exception, array $context = []): void
    {
        $this->logger->error($message, $exception, $context);
    }
}
