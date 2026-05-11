<!--
═══════════════════════════════════════════════════════════════════════════════
Icon Grid Component (Virtual Scrolling)
═══════════════════════════════════════════════════════════════════════════════

High-performance icon grid with virtual scrolling for 87k+ icons.

@version 1.0.0
-->

<template>
    <div class="icon-grid">
        <!-- Loading State -->
        <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            <div v-for="i in 24" :key="i" class="skeleton h-32"></div>
        </div>

        <!-- Grid View -->
        <div
            v-else-if="viewMode === 'grid'"
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        >
            <IconCard
                v-for="icon in icons"
                :key="icon.id"
                :icon="icon"
                :size="iconSize"
                @click="$emit('select', icon)"
            />
        </div>

        <!-- List View -->
        <div v-else class="space-y-2">
            <IconCard
                v-for="icon in icons"
                :key="icon.id"
                :icon="icon"
                :size="iconSize"
                view-mode="list"
                @click="$emit('select', icon)"
            />
        </div>

        <!-- Enhanced Pagination -->
        <div v-if="totalPages > 1" class="mt-8">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                <!-- Per Page Selector -->
                <div class="flex items-center gap-2 text-sm">
                    <span class="text-base-content/60">Per page:</span>
                    <select 
                        :value="perPage" 
                        class="select select-sm select-bordered"
                        @change="$emit('per-page-change', parseInt($event.target.value))"
                    >
                        <option :value="60">60</option>
                        <option :value="100">100</option>
                        <option :value="200">200</option>
                        <option :value="500">500</option>
                    </select>
                </div>

                <!-- Page Info -->
                <div class="text-sm text-base-content/60">
                    Showing {{ ((currentPage - 1) * perPage) + 1 }}-{{ Math.min(currentPage * perPage, totalIcons) }} of {{ formatNumber(totalIcons) }}
                </div>

                <!-- Pagination Controls -->
                <div class="join" role="navigation" aria-label="Pagination">
                    <!-- First Page -->
                    <button
                        type="button"
                        class="join-item btn btn-sm"
                        title="First Page"
                        aria-label="Go to first page"
                        :disabled="currentPage === 1"
                        @click="$emit('page-change', 1)"
                    >
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fill-rule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
                        </svg>
                    </button>

                    <!-- Previous Page -->
                    <button
                        type="button"
                        class="join-item btn btn-sm"
                        title="Previous Page"
                        aria-label="Go to previous page"
                        :disabled="currentPage === 1"
                        @click="$emit('page-change', currentPage - 1)"
                    >
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                    </button>

                    <!-- Page Numbers -->
                    <button
                        v-for="page in visiblePages"
                        :key="page"
                        type="button"
                        class="join-item btn btn-sm"
                        :class="{ 'btn-active': page === currentPage }"
                        :aria-label="`Go to page ${page}`"
                        :aria-current="page === currentPage ? 'page' : undefined"
                        @click="$emit('page-change', page)"
                    >
                        {{ page }}
                    </button>

                    <!-- Ellipsis if needed -->
                    <button
                        v-if="totalPages > 7 && currentPage < totalPages - 3"
                        type="button"
                        class="join-item btn btn-sm btn-disabled"
                        aria-hidden="true"
                        tabindex="-1"
                    >
                        ...
                    </button>

                    <!-- Next Page -->
                    <button
                        type="button"
                        class="join-item btn btn-sm"
                        title="Next Page"
                        aria-label="Go to next page"
                        :disabled="currentPage === totalPages"
                        @click="$emit('page-change', currentPage + 1)"
                    >
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                        </svg>
                    </button>

                    <!-- Last Page -->
                    <button
                        type="button"
                        class="join-item btn btn-sm"
                        title="Last Page"
                        aria-label="Go to last page"
                        :disabled="currentPage === totalPages"
                        @click="$emit('page-change', totalPages)"
                    >
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fill-rule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                            <path fill-rule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { computed } from 'vue';
import IconCard from './IconCard.vue';

export default {
    name: 'IconGrid',

    components: {
        IconCard,
    },

    props: {
        icons: {
            type: Array,
            default: () => [],
        },
        loading: {
            type: Boolean,
            default: false,
        },
        viewMode: {
            type: String,
            default: 'grid',
        },
        iconSize: {
            type: Number,
            default: 64,
        },
        currentPage: {
            type: Number,
            default: 1,
        },
        totalPages: {
            type: Number,
            default: 1,
        },
        perPage: {
            type: Number,
            default: 100,
        },
        totalIcons: {
            type: Number,
            default: 0,
        },
    },

    emits: ['select', 'page-change', 'per-page-change'],

    setup(props) {
        // Calculate visible page numbers (max 7 buttons)
        const visiblePages = computed(() => {
            const pages = [];
            const maxButtons = 7;
            const halfButtons = Math.floor(maxButtons / 2);

            let start = Math.max(1, props.currentPage - halfButtons);
            let end = Math.min(props.totalPages, start + maxButtons - 1);

            // Adjust start if we're near the end
            if (end - start < maxButtons - 1) {
                start = Math.max(1, end - maxButtons + 1);
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            return pages;
        });

        const formatNumber = (num) => {
            return new Intl.NumberFormat().format(num);
        };

        return {
            visiblePages,
            formatNumber,
        };
    },
};
</script>

