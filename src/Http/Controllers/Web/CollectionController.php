<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\IconBrowser\Http\Controllers\Web;

use Exception;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Simtabi\Laranail\Ichava\Models\Icon;
use Simtabi\Laranail\Ichava\Services\IchavaLogger;
use Simtabi\Laranail\Ichava\Services\IconBrowserService;
use Simtabi\Laranail\Ichava\Services\IconPreferenceService;
use Simtabi\Laranail\Ichava\IconBrowser\Http\Controllers\Web\Concerns\ResolvesIconsForPages;

final class CollectionController extends BaseInertiaController
{
    use ResolvesIconsForPages;

    public function __construct(
        protected IconBrowserService $browserService,
        protected IconPreferenceService $preferenceService,
        IchavaLogger $logger,
    ) {
        parent::__construct($logger);
    }

    public function index(): Response
    {
        $this->logger->debug('Inertia collections page accessed');

        try {
            $props = ['collections' => $this->collectionsWithIcons()];
        } catch (Exception $e) {
            $this->logger->error('Failed to load Inertia collections', $e);

            $props = ['collections' => []];
        }

        return Inertia::render('Collections/Index', $props);
    }

    public function show(string $id): Response|RedirectResponse
    {
        $collection = $this->preferenceService->getCollection($id);

        if (! $collection) {
            return redirect()
                ->route('ichava.inertia.collections.index')
                ->with('error', "Collection [{$id}] not found.");
        }

        $collection['icons'] = $this->pageIcons($collection['icon_ids'] ?? []);

        return Inertia::render('Collections/Show', [
            'collection' => $collection,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:100',
            'color' => 'nullable|string|regex:/^#[a-fA-F0-9]{6}$/',
        ]);

        $collection = $this->preferenceService->createCollection(
            $validated['name'],
            $validated['color'] ?? null,
        );

        $this->logger->debug('Collection created from web', ['collection_id' => $collection['id']]);

        return redirect()
            ->route('ichava.inertia.collections.show', ['id' => $collection['id']])
            ->with('success', 'Collection created successfully.');
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        if (! $this->preferenceService->getCollection($id)) {
            return redirect()
                ->route('ichava.inertia.collections.index')
                ->with('error', "Collection [{$id}] not found.");
        }

        $validated = $request->validate([
            'name'  => 'sometimes|required|string|max:100',
            'color' => 'nullable|string|regex:/^#[a-fA-F0-9]{6}$/',
        ]);

        $this->preferenceService->updateCollection($id, $validated);
        $this->logger->debug('Collection updated from web', ['collection_id' => $id]);

        return redirect()->back()->with('success', 'Collection updated successfully.');
    }

    public function destroy(string $id): RedirectResponse
    {
        if (! $this->preferenceService->getCollection($id)) {
            return redirect()
                ->route('ichava.inertia.collections.index')
                ->with('error', "Collection [{$id}] not found.");
        }

        $this->preferenceService->deleteCollection($id);
        $this->logger->debug('Collection deleted from web', ['collection_id' => $id]);

        return redirect()
            ->route('ichava.inertia.collections.index')
            ->with('success', 'Collection deleted successfully.');
    }

    public function addIcon(string $id, int $iconId): RedirectResponse
    {
        if (! $this->preferenceService->getCollection($id)) {
            return redirect()
                ->route('ichava.inertia.collections.index')
                ->with('error', "Collection [{$id}] not found.");
        }

        if (! Icon::where('id', $iconId)->exists()) {
            return redirect()->back()->with('error', "Icon [{$iconId}] not found.");
        }

        $this->preferenceService->addIconToCollection($id, $iconId);

        $this->logger->debug('Icon added to collection from web', [
            'collection_id' => $id,
            'icon_id'       => $iconId,
        ]);

        return redirect()->back()->with('success', 'Icon added to collection.');
    }

    public function removeIcon(string $id, int $iconId): RedirectResponse
    {
        if (! $this->preferenceService->getCollection($id)) {
            return redirect()
                ->route('ichava.inertia.collections.index')
                ->with('error', "Collection [{$id}] not found.");
        }

        $this->preferenceService->removeIconFromCollection($id, $iconId);

        $this->logger->debug('Icon removed from collection from web', [
            'collection_id' => $id,
            'icon_id'       => $iconId,
        ]);

        return redirect()->back()->with('success', 'Icon removed from collection.');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function collectionsWithIcons(): array
    {
        $collections = $this->preferenceService->getCollections();

        foreach ($collections as &$collection) {
            $collection['icons'] = $this->pageIcons($collection['icon_ids'] ?? []);
        }

        return $collections;
    }
}
