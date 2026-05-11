<!--
═══════════════════════════════════════════════════════════════════════════════
Icon Card Component - Framework Aligned
═══════════════════════════════════════════════════════════════════════════════

Individual icon card with quick-copy button and modal preview.
Matches framework design with hover effects and lazy loading support.

@version 2.0.0
-->

<template>
    <div 
        class="icon-card group relative flex flex-col items-center rounded-xl bg-card border border-border hover:shadow-md transition-all cursor-pointer hover:border-primary/50"
        :data-icon-id="icon.id"
        :data-icon-name="icon.name"
        :data-icon-package="icon.package"
        :data-icon-category="icon.category || ''"
        :data-icon-path="icon.path"
        :data-file-path="icon.file_path || ''"
        :data-svg-url="icon.svg_url || ''"
        :data-blade-code="bladeCode"
        :data-blade-clean="icon.blade_clean || ''"
        :data-blade-generic="icon.blade_generic || ''"
        :data-helper-code="icon.helper || ''"
        tabindex="0"
        role="button"
        :aria-label="`Icon ${icon.name} from ${icon.package}`"
        @click="$emit('select', icon)"
        @keydown.enter="$emit('select', icon)"
        @keydown.space.prevent="$emit('select', icon)"
    >
        <!-- Quick Copy Button -->
        <Button
            variant="ghost"
            size="sm"
            class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity z-10 h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
            title="Quick copy Blade code"
            :aria-label="`Copy ${icon.name}`"
            @click.stop="handleQuickCopy"
        >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
        </Button>

        <!-- Icon Display -->
        <div 
            class="w-full flex items-center justify-center" 
            :style="`padding: var(--card-padding, 24px) var(--card-padding, 24px) calc(var(--card-padding, 24px) / 2);`"
        >
            <div 
                class="flex items-center justify-center icon-svg-container" 
                :style="`width: var(--icon-size, ${size}px); height: var(--icon-size, ${size}px);`"
            >
                <div v-if="icon.svg_content" class="w-full h-full flex items-center justify-center" v-html="processedSvg"></div>
                <img 
                    v-else-if="icon.svg_url" 
                    :src="icon.svg_url" 
                    :alt="icon.name" 
                    class="w-full h-full object-contain" 
                    loading="lazy"
                    @error="handleImageError"
                >
                <div v-else class="w-full h-full flex items-center justify-center text-muted-foreground">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
            </div>
        </div>

        <!-- Icon Info -->
        <div class="w-full text-center space-y-1" :style="`padding: 0 var(--card-padding, 24px) var(--card-padding, 24px);`">
            <div class="text-xs font-medium truncate text-foreground">{{ icon.name }}</div>
            <div class="text-xs text-muted-foreground truncate">{{ icon.category || icon.package }}</div>
        </div>
    </div>
</template>

<script>
import { computed } from 'vue';
import { Button } from '@/components/ui/button';
import { sanitizeSvg } from '@/ichava-ts/utils/sanitizeSvg';

export default {
    name: 'IconCard',

    components: {
        Button,
    },

    props: {
        icon: {
            type: Object,
            required: true
        },
        size: {
            type: Number,
            default: 48
        }
    },

    emits: ['select', 'quick-copy'],

    setup(props, { emit }) {
        const bladeCode = computed(() => {
            return props.icon.blade_clean || generateBladeComponent(props.icon);
        });

        const processedSvg = computed(() => {
            if (!props.icon.svg_content) return '';

            let svg = props.icon.svg_content.trim();

            // Remove width/height attributes
            svg = svg.replace(/\s+(width|height)=["'][^"']*["']/gi, '');

            // Add viewBox if missing
            if (!svg.includes('viewBox')) {
                const widthMatch = props.icon.svg_content.match(/width=["'](\d+)["']/);
                const heightMatch = props.icon.svg_content.match(/height=["'](\d+)["']/);
                const width = widthMatch ? widthMatch[1] : '24';
                const height = heightMatch ? heightMatch[1] : '24';
                svg = svg.replace('<svg', `<svg viewBox="0 0 ${width} ${height}"`);
            }

            // Add responsive attributes
            svg = svg.replace('<svg', '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet"');

            // Defense-in-depth: server already sanitises but we filter again
            // on the v-html boundary to protect against poisoned caches and
            // any future regression on the API side.
            return sanitizeSvg(svg);
        });

        const generateBladeComponent = (icon) => {
            const packageName = icon.package || '';
            const iconName = icon.name || '';
            const category = icon.category || '';
            const iconPath = icon.path || '';

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

        const handleQuickCopy = async () => {
            emit('quick-copy', {
                code: bladeCode.value,
                name: props.icon.name
            });
        };

        const handleImageError = (event) => {
            event.target.parentElement.innerHTML = '<div class="text-error text-xs">Failed to load</div>';
        };

        return {
            bladeCode,
            processedSvg,
            handleQuickCopy,
            handleImageError
        };
    }
};
</script>
