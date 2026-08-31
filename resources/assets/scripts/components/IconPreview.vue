<!--
═══════════════════════════════════════════════════════════════════════════════
Enhanced Icon Preview Modal - Framework Design
═══════════════════════════════════════════════════════════════════════════════

Multi-tab preview with Blade (Clean/Generic), Helper, and SVG syntaxes.
Matches framework screenshot design.

@version 2.0.0
-->

<template>
    <Teleport to="body" :disabled="!isMounted">
        <div v-if="isMounted" class="modal modal-open" @click.self="$emit('close')">
            <div class="modal-box max-w-4xl">
                <!-- Header -->
                <div class="flex items-start justify-between mb-6">
                    <div>
                        <h3 class="font-bold text-2xl mb-1">{{ icon.name }}.svg</h3>
                        <div class="flex flex-wrap gap-2 text-sm">
                            <span class="badge badge-outline">
                                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                                </svg>
                                {{ icon.package }}
                            </span>
                            <span v-if="icon.category" class="badge badge-outline">
                                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>
                                </svg>
                                {{ icon.category }}
                            </span>
                            <span class="badge badge-outline">
                                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
                                </svg>
                                {{ filePath }}
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="btn btn-sm btn-circle btn-ghost"
                        @click="$emit('close')"
                    >
                        ✕
                    </button>
                </div>

                <!-- Icon Preview -->
                <div class="flex justify-center p-12 bg-base-200 rounded-lg mb-6">
                    <div v-html="sanitizedIconSvg" class="w-32 h-32"></div>
                </div>

                <!-- Tabs -->
                <div class="tabs tabs-boxed mb-4">
                    <button
                        v-for="tab in tabs"
                        :key="tab"
                        type="button"
                        class="tab"
                        :class="{ 'tab-active': activeTab === tab }"
                        @click="activeTab = tab"
                    >
                        {{ tab }}
                    </button>
                </div>

                <!-- Tab Content -->
                <div class="bg-base-200 rounded-lg p-4 max-h-96 overflow-auto custom-scrollbar">
                    <!-- Blade Tab -->
                    <div v-if="activeTab === 'Blade'" class="space-y-4">
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs font-semibold text-base-content/60">CLEAN SYNTAX</span>
                                <span class="badge badge-success badge-xs">Recommended</span>
                            </div>
                            <pre class="bg-base-300 p-3 rounded text-sm overflow-x-auto"><code>{{ bladeCleanSyntax }}</code></pre>
                        </div>
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs font-semibold text-base-content/60">GENERIC SYNTAX</span>
                            </div>
                            <pre class="bg-base-300 p-3 rounded text-sm overflow-x-auto"><code>{{ bladeGenericSyntax }}</code></pre>
                        </div>
                    </div>

                    <!-- Helper Tab -->
                    <div v-if="activeTab === 'Helper'" class="space-y-3">
                        <div>
                            <div class="text-xs font-semibold text-base-content/60 mb-2">PHP HELPER FUNCTION</div>
                            <pre class="bg-base-300 p-3 rounded text-sm overflow-x-auto"><code>{{ helperSyntax }}</code></pre>
                        </div>
                        <div class="alert alert-info">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                            </svg>
                            <span class="text-sm">Use this helper in PHP/Blade templates or controllers</span>
                        </div>
                    </div>

                    <!-- SVG Tab -->
                    <div v-if="activeTab === 'SVG'">
                        <pre class="bg-base-300 p-3 rounded text-sm overflow-x-auto"><code>{{ icon.svg }}</code></pre>
                    </div>
                </div>

                <!-- Actions -->
                <div class="modal-action">
                    <button
                        type="button"
                        class="btn btn-sm gap-2"
                        @click="copyCode"
                    >
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z"/>
                            <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z"/>
                        </svg>
                        {{ copied ? 'Copied!' : 'Copy Code' }}
                    </button>
                    <button
                        type="button"
                        class="btn btn-sm btn-primary gap-2"
                        @click="downloadSvg"
                    >
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
                        </svg>
                        Download SVG
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { sanitizeSvg } from '@/ichava-ts/utils/sanitizeSvg';

export default {
    name: 'IconPreview',

    props: {
        icon: {
            type: Object,
            required: true
        }
    },

    emits: ['close'],

    setup(props) {
        const activeTab = ref('Blade');
        const copied = ref(false);
        const tabs = ['Blade', 'Helper', 'SVG'];
        const isMounted = ref(false);

        onMounted(() => {
            isMounted.value = true;
        });

        const filePath = computed(() => {
            return `${props.icon.package}::${props.icon.category || 'default'}/${props.icon.name}`;
        });

        // Defense-in-depth SVG sanitisation for v-html rendering.
        const sanitizedIconSvg = computed(() => sanitizeSvg(props.icon?.svg ?? ''));

        const bladeCleanSyntax = computed(() => {
            return `<x-ichava::${props.icon.package} name="${props.icon.name}" category="${props.icon.category || ''}" class="w-6 h-6" />`;
        });

        const bladeGenericSyntax = computed(() => {
            return `<x-ichava::icon name="${filePath.value}" class="w-6 h-6" />`;
        });

        const helperSyntax = computed(() => {
            return `{{ ichava('${filePath.value}', ['class' => 'w-6 h-6']) }}`;
        });

        const copyCode = async () => {
            let code = '';
            
            switch (activeTab.value) {
                case 'Blade':
                    code = bladeCleanSyntax.value;
                    break;
                case 'Helper':
                    code = helperSyntax.value;
                    break;
                case 'SVG':
                    code = props.icon.svg;
                    break;
            }

            try {
                await navigator.clipboard.writeText(code);
                copied.value = true;
                setTimeout(() => {
                    copied.value = false;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        };

        const downloadSvg = () => {
            const blob = new Blob([props.icon.svg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${props.icon.name}.svg`;
            a.click();
            URL.revokeObjectURL(url);
        };

        return {
            activeTab,
            tabs,
            copied,
            isMounted,
            filePath,
            sanitizedIconSvg,
            bladeCleanSyntax,
            bladeGenericSyntax,
            helperSyntax,
            copyCode,
            downloadSvg
        };
    }
};
</script>

<style scoped>
.custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: oklch(var(--bc) / 0.2) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: oklch(var(--bc) / 0.2);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: oklch(var(--bc) / 0.3);
}

pre {
    white-space: pre;
    word-wrap: normal;
}

code {
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 0.875rem;
    line-height: 1.5;
}
</style>
