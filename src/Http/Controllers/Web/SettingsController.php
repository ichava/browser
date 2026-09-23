<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\IconBrowser\Http\Controllers\Web;

use Exception;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Simtabi\Laranail\Ichava\Services\IchavaLogger;
use Simtabi\Laranail\Ichava\Services\IconPreferenceService;
use Simtabi\Laranail\Ichava\IconBrowser\Http\Requests\PreferenceFilterRequest;
use Simtabi\Laranail\Ichava\IconBrowser\Http\Requests\PreferenceSearchRequest;
use Simtabi\Laranail\Ichava\IconBrowser\Http\Requests\PreferenceUpdateRequest;

final class SettingsController extends BaseInertiaController
{
    public function __construct(
        protected IconPreferenceService $preferenceService,
        IchavaLogger $logger,
    ) {
        parent::__construct($logger);
    }

    public function index(): Response
    {
        $this->logger->debug('Inertia settings page accessed');

        try {
            $preferences = $this->preferenceService->getAll();
            $validated = $this->preferenceService->validate($preferences);

            if ($validated !== $preferences) {
                $this->preferenceService->update($validated);
            }

            $props = ['preferences' => $validated];
        } catch (Exception $e) {
            $this->logger->error('Failed to load Inertia settings', $e);

            $props = ['preferences' => []];
        }

        return Inertia::render('Settings/Index', $props);
    }

    public function update(PreferenceUpdateRequest $request): RedirectResponse
    {
        $preferences = $this->preferenceService->update($request->validated());
        $cleaned = $this->preferenceService->validate($preferences);
        $this->preferenceService->update($cleaned);

        $this->logger->info('Preferences updated from web');

        return redirect()->back()->with('success', 'Preferences updated successfully.');
    }

    public function updateSearch(PreferenceSearchRequest $request): RedirectResponse
    {
        $search = $request->validated('search') ?? '';
        $this->preferenceService->setSearch($search);

        return redirect()->back()->with('success', 'Search query updated successfully.');
    }

    public function updateFilters(PreferenceFilterRequest $request): RedirectResponse
    {
        $filters = array_merge($this->preferenceService->getFilters(), $request->validated());
        $this->preferenceService->setFilters($filters);

        return redirect()->back()->with('success', 'Filters updated successfully.');
    }

    public function clear(): RedirectResponse
    {
        $this->preferenceService->clear();
        $this->logger->info('Preferences cleared from web');

        return redirect()->back()->with('success', 'Preferences cleared successfully.');
    }
}
