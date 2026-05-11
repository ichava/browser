<!--
═══════════════════════════════════════════════════════════════════════════════
Icon Modal Component - Using shadcn Dialog
═══════════════════════════════════════════════════════════════════════════════

Tabbed modal for icon preview with multiple syntax options (SVG, Helper, Blade).
Uses shadcn-vue Dialog component.

@version 4.0.0
-->

<template>
    <Dialog :open="isOpen" @update:open="handleOpenChange">
        <DialogContent 
            class="max-w-3xl"
            :class="isDark ? 'bg-[#151823] border-[#1e2235] text-gray-200' : 'bg-white'"
        >
            <DialogHeader>
                <DialogTitle :class="isDark ? 'text-white' : 'text-gray-900'">
                    {{ selectedIcon?.name || 'Icon Preview' }}
                </DialogTitle>
            </DialogHeader>

            <div class="space-y-4">
                <!-- Icon Info -->
                <div class="text-sm space-y-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                    <div>
                        <span class="font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Package:</span>
                        {{ selectedIcon?.package }}
                    </div>
                    <div>
                        <span class="font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Category:</span>
                        {{ selectedIcon?.category || 'N/A' }}
                    </div>
                    <div>
                        <span class="font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Path:</span>
                        <code 
                            class="text-xs px-1 rounded ml-1"
                            :class="isDark ? 'bg-[#1e2235]' : 'bg-gray-100'"
                        >
                            {{ selectedIcon?.path }}
                        </code>
                    </div>
                </div>

                <!-- Icon Preview -->
                <div 
                    class="rounded-lg p-8 flex items-center justify-center min-h-[200px]"
                    :class="isDark ? 'bg-[#1e2235]' : 'bg-gray-100'"
                >
                    <div v-if="loading" class="flex items-center justify-center w-full h-full">
                        <Loader2 :size="32" class="animate-spin" :class="isDark ? 'text-purple-400' : 'text-purple-600'" />
                    </div>
                    <div 
                        v-else-if="processedSvg" 
                        class="w-32 h-32 icon-svg-modal"
                        :class="iconColor ? 'icon-colored' : ''"
                        :style="iconColor ? { color: iconColor } : {}"
                        v-html="processedSvg"
                    ></div>
                    <div v-else class="text-sm" :class="isDark ? 'text-red-400' : 'text-red-600'">
                        No icon available
                    </div>
                </div>

                <!-- Tabs -->
                <div 
                    class="flex gap-1 p-1 rounded-lg"
                    :class="isDark ? 'bg-[#1e2235]' : 'bg-gray-100'"
                >
                    <button 
                        v-for="tab in tabs" 
                        :key="tab.id"
                        class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors"
                        :class="[
                            activeTab === tab.id 
                                ? (isDark ? 'bg-purple-600 text-white' : 'bg-white text-gray-900 shadow')
                                : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                        ]"
                        @click="activeTab = tab.id"
                    >
                        {{ tab.label }}
                    </button>
                </div>

                <!-- Tab Panels -->
                <div class="space-y-3">
                    <!-- SVG Tab -->
                    <div v-show="activeTab === 'svg'">
                        <div 
                            class="rounded-lg overflow-hidden"
                            :class="isDark ? 'bg-[#0a0d1a]' : 'bg-gray-900'"
                        >
                            <pre class="p-4 text-sm overflow-x-auto text-green-400"><code>{{ codeSnippets.svg }}</code></pre>
                        </div>
                        <button 
                            class="mt-2 px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors bg-purple-600 hover:bg-purple-700 text-white"
                            @click="copyCode('svg')"
                        >
                            <Copy :size="16" />
                            Copy SVG
                        </button>
                    </div>

                    <!-- Helper Tab -->
                    <div v-show="activeTab === 'helper'">
                        <div 
                            class="rounded-lg overflow-hidden"
                            :class="isDark ? 'bg-[#0a0d1a]' : 'bg-gray-900'"
                        >
                            <pre class="p-4 text-sm overflow-x-auto text-green-400"><code>{{ codeSnippets.helper }}</code></pre>
                        </div>
                        <button 
                            class="mt-2 px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors bg-purple-600 hover:bg-purple-700 text-white"
                            @click="copyCode('helper')"
                        >
                            <Copy :size="16" />
                            Copy Helper
                        </button>
                    </div>

                    <!-- Blade Clean Tab -->
                    <div v-show="activeTab === 'blade-clean'">
                        <div 
                            class="rounded-lg overflow-hidden"
                            :class="isDark ? 'bg-[#0a0d1a]' : 'bg-gray-900'"
                        >
                            <pre class="p-4 text-sm overflow-x-auto text-green-400"><code>{{ codeSnippets.bladeClean }}</code></pre>
                        </div>
                        <button 
                            class="mt-2 px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors bg-purple-600 hover:bg-purple-700 text-white"
                            @click="copyCode('blade-clean')"
                        >
                            <Copy :size="16" />
                            Copy Blade (Clean)
                        </button>
                    </div>

                    <!-- Blade Generic Tab -->
                    <div v-show="activeTab === 'blade-generic'">
                        <div 
                            class="rounded-lg overflow-hidden"
                            :class="isDark ? 'bg-[#0a0d1a]' : 'bg-gray-900'"
                        >
                            <pre class="p-4 text-sm overflow-x-auto text-green-400"><code>{{ codeSnippets.bladeGeneric }}</code></pre>
                        </div>
                        <button 
                            class="mt-2 px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors bg-purple-600 hover:bg-purple-700 text-white"
                            @click="copyCode('blade-generic')"
                        >
                            <Copy :size="16" />
                            Copy Blade (Generic)
                        </button>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center justify-between pt-4 border-t" :class="isDark ? 'border-[#1e2235]' : 'border-gray-200'">
                    <div class="flex items-center gap-2">
                        <button 
                            class="p-2 rounded-lg transition-colors"
                            :class="[
                                isFavorite 
                                    ? 'text-red-500 bg-red-500/10' 
                                    : (isDark ? 'text-gray-400 hover:bg-[#1e2235]' : 'text-gray-500 hover:bg-gray-100')
                            ]"
                            @click="toggleFavorite"
                            :title="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
                        >
                            <Heart :size="20" :fill="isFavorite ? 'currentColor' : 'none'" />
                        </button>
                        <button 
                            class="p-2 rounded-lg transition-colors"
                            :class="isDark ? 'text-gray-400 hover:bg-[#1e2235]' : 'text-gray-500 hover:bg-gray-100'"
                            @click="downloadSvg"
                            title="Download SVG"
                        >
                            <Download :size="20" />
                        </button>
                    </div>
                    <button 
                        class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                        :class="isDark ? 'bg-[#1e2235] hover:bg-[#2d3348] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'"
                        @click="close"
                    >
                        Close
                    </button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { toast } from 'vue-sonner';
import { sanitizeSvg } from '@/ichava-ts/utils/sanitizeSvg';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle 
} from '@/components/ui/dialog';

export default {
    name: 'IconModal',

    components: {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
    },

    props: {
        selectedIcon: {
            type: Object,
            default: null
        },
        open: {
            type: Boolean,
            default: false
        },
        isDark: {
            type: Boolean,
            default: true
        },
        iconColor: {
            type: String,
            default: ''
        },
        favorites: {
            type: Array,
            default: () => []
        }
    },

    emits: ['update:open', 'close', 'copy', 'toggleFavorite', 'download'],

    setup(props, { emit }) {
        const activeTab = ref('svg');
        const loading = ref(false);
        const svgContent = ref('');

        const isOpen = computed(() => props.open);
        const isFavorite = computed(() => props.favorites.some(f => f?.id === props.selectedIcon?.id));

        const tabs = [
            { id: 'svg', label: 'SVG' },
            { id: 'helper', label: 'Helper' },
            { id: 'blade-clean', label: 'Blade (Clean)' },
            { id: 'blade-generic', label: 'Blade (Generic)' }
        ];

        const generateBladeComponent = (icon, useCleanSyntax = true) => {
            const packageName = icon?.package || '';
            const iconName = icon?.name || '';
            const category = icon?.category || '';
            const iconPath = icon?.path || '';

            if (!useCleanSyntax) {
                return `<x-ichava::icon name="${iconPath}" class="w-6 h-6" />`;
            }

            if (!packageName.includes('/')) {
                return `<x-ichava::icon name="${iconPath}" class="w-6 h-6" />`;
            }

            const [vendor, packagePart] = packageName.split('/');

            if (vendor === 'ichava' && packagePart) {
                if (packagePart.includes('-bundle') && packagePart !== 'icons-bundle') {
                    return `<x-ichava::icon name="${iconPath}" class="w-6 h-6" />`;
                }

                let componentName = packagePart;
                const corePackages = ['test-icons', 'ui-icons'];
                if (!corePackages.includes(packagePart)) {
                    componentName = packagePart.replace(/-icons$/, '');
                }

                const component = `ichava-${componentName}`;
                let code = `<x-ichava::${component} name="${iconName}"`;

                if (category) {
                    const attributeName = packagePart.includes('tabler') ? 'variant' : 'category';
                    code += ` ${attributeName}="${category}"`;
                }

                code += ` class="w-6 h-6" />`;
                return code;
            }

            return `<x-ichava::icon name="${iconPath}" class="w-6 h-6" />`;
        };

        const codeSnippets = computed(() => {
            if (!props.selectedIcon) {
                return {
                    svg: '',
                    helper: '',
                    bladeClean: '',
                    bladeGeneric: ''
                };
            }

            return {
                svg: svgContent.value || '',
                helper: props.selectedIcon.helper || `{{ ichava('${props.selectedIcon.path}')->class('w-6 h-6') }}`,
                bladeClean: props.selectedIcon.blade_clean || generateBladeComponent(props.selectedIcon, true),
                bladeGeneric: props.selectedIcon.blade_generic || generateBladeComponent(props.selectedIcon, false)
            };
        });

        const processedSvg = computed(() => {
            if (!svgContent.value) return '';

            // Sanitise FIRST so the DOM we manipulate is already trusted; the
            // innerHTML assignment below would otherwise be the XSS surface.
            const safeSource = sanitizeSvg(svgContent.value);
            if (!safeSource) return '';

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = safeSource;
            const svg = tempDiv.querySelector('svg');

            if (svg) {
                svg.removeAttribute('width');
                svg.removeAttribute('height');
                svg.removeAttribute('class');
                svg.setAttribute('width', '100%');
                svg.setAttribute('height', '100%');
                svg.style.width = '100%';
                svg.style.height = '100%';
                return svg.outerHTML;
            }

            return safeSource;
        });

        const loadSvgContent = async () => {
            if (!props.selectedIcon) return;

            loading.value = true;

            try {
                // Support both camelCase and snake_case property names
                const iconSvgContent = props.selectedIcon.svg_content || props.selectedIcon.svgContent;
                const iconSvgUrl = props.selectedIcon.svg_url || props.selectedIcon.svgUrl;
                
                if (iconSvgContent) {
                    svgContent.value = iconSvgContent;
                } else if (iconSvgUrl) {
                    const response = await fetch(iconSvgUrl);
                    if (response.ok) {
                        svgContent.value = await response.text();
                    } else {
                        svgContent.value = '';
                    }
                } else if (props.selectedIcon.id) {
                    // Fetch SVG from API using icon ID
                    const response = await fetch(`/ichava/api/icons/${props.selectedIcon.id}/svg`);
                    if (response.ok) {
                        const data = await response.json();
                        svgContent.value = data.data?.svg_content || data.svg_content || '';
                    } else {
                        svgContent.value = '';
                    }
                } else {
                    svgContent.value = '';
                }
            } catch (error) {
                console.error('Failed to load SVG:', error);
                svgContent.value = '';
            } finally {
                loading.value = false;
            }
        };

        watch(() => props.selectedIcon, (newIcon) => {
            if (newIcon) {
                activeTab.value = 'svg';
                loadSvgContent();
            }
        });

        watch(() => props.open, (newOpen) => {
            if (newOpen && props.selectedIcon) {
                loadSvgContent();
            }
        });

        const handleOpenChange = (open) => {
            emit('update:open', open);
            if (!open) {
                emit('close');
            }
        };

        const close = () => {
            emit('update:open', false);
            emit('close');
        };

        const copyCode = async (type) => {
            const keyMap = {
                'svg': 'svg',
                'helper': 'helper',
                'blade-clean': 'bladeClean',
                'blade-generic': 'bladeGeneric'
            };
            const code = codeSnippets.value[keyMap[type]];
            
            if (code) {
                try {
                    await navigator.clipboard.writeText(code);
                    const typeLabels = {
                        'svg': 'SVG',
                        'helper': 'Helper',
                        'blade-clean': 'Blade Clean',
                        'blade-generic': 'Blade Generic'
                    };
                    toast.success(`Copied ${typeLabels[type]}!`, {
                        description: props.selectedIcon?.name,
                        duration: 2000
                    });
                    emit('copy', { code, type });
                } catch (err) {
                    console.error('Failed to copy:', err);
                    toast.error('Failed to copy', {
                        description: 'Please try again'
                    });
                }
            }
        };

        const toggleFavorite = () => {
            if (props.selectedIcon) {
                const wasFavorite = isFavorite.value;
                emit('toggleFavorite', props.selectedIcon.id);
                
                // Immediate optimistic feedback
                if (wasFavorite) {
                    toast.info(`Removed from favorites`, {
                        description: props.selectedIcon.name
                    });
                } else {
                    toast.success(`Added to favorites`, {
                        description: props.selectedIcon.name
                    });
                }
            }
        };

        const downloadSvg = () => {
            if (props.selectedIcon && svgContent.value) {
                emit('download', { 
                    icon: props.selectedIcon, 
                    content: svgContent.value 
                });
                
                toast.success(`Downloaded ${props.selectedIcon.name}.svg`, {
                    description: `${props.selectedIcon.package} package`
                });
            }
        };

        return {
            isOpen,
            isFavorite,
            activeTab,
            loading,
            tabs,
            codeSnippets,
            processedSvg,
            handleOpenChange,
            close,
            copyCode,
            toggleFavorite,
            downloadSvg
        };
    }
};
</script>
