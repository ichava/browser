<!--
═══════════════════════════════════════════════════════════════════════════════
Responsive Modal Base Component
═══════════════════════════════════════════════════════════════════════════════

A flexible, responsive modal that adapts to content size and screen dimensions.

Features:
- Automatic height adaptation based on content
- Responsive width based on screen size
- Sticky header and footer
- Scrollable content area
- Mobile-friendly with proper spacing
- Supports custom sizes: sm, md, lg, xl, full

@version 1.0.0
-->

<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useIchava } from '@/ichava-ts'

// Props
const props = defineProps<{
  open: boolean
  title?: string
  description?: string
  icon?: any // Lucide icon component
  iconColor?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showHeader?: boolean
  showFooter?: boolean
  maxHeight?: string // Custom max height (e.g., '90vh', '600px')
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'close'): void
}>()

// Composable
const { isDark } = useIchava()

// Size mappings for responsive design
const sizeClasses = computed(() => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]'
  }
  return sizes[props.size || 'md']
})

// Calculate content max height
const contentMaxHeight = computed(() => {
  if (props.maxHeight) return props.maxHeight
  
  // Default responsive heights
  const headerHeight = props.showHeader !== false ? '120px' : '0px'
  const footerHeight = props.showFooter ? '80px' : '0px'
  const padding = '80px' // Top/bottom padding for safe areas
  
  return `calc(100vh - ${headerHeight} - ${footerHeight} - ${padding})`
})

// Handle close
const handleClose = () => {
  emit('update:open', false)
  emit('close')
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent 
      :class="[
        sizeClasses,
        '!flex !flex-col',
        'max-h-[95vh] sm:max-h-[90vh]',
        'w-[95vw] sm:w-full',
        '!p-0 !gap-0',
        isDark ? 'bg-[#1c1f2e] border-[#2a2d3e]' : 'bg-white border-gray-200'
      ]"
    >
      <!-- Header -->
      <div 
        v-if="showHeader !== false"
        class="flex-shrink-0 px-6 pt-6 pb-4 border-b"
        :class="[
          isDark ? 'bg-[#1c1f2e] border-[#2a2d3e]' : 'bg-white border-gray-200'
        ]"
      >
        <DialogHeader class="flex-row items-start gap-3 space-y-0">
          <!-- Icon -->
          <div 
            v-if="icon"
            class="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
            :class="isDark ? 'bg-purple-500/20' : 'bg-purple-50'"
          >
            <component 
              :is="icon" 
              :size="24" 
              :class="iconColor || 'text-purple-500'" 
            />
          </div>

          <!-- Title & Description -->
          <div class="flex-1 min-w-0">
            <DialogTitle 
              v-if="title"
              class="text-xl sm:text-2xl truncate"
              :class="isDark ? 'text-white' : 'text-gray-900'"
            >
              {{ title }}
            </DialogTitle>
            <DialogDescription 
              v-if="description"
              class="text-sm mt-1"
              :class="isDark ? 'text-gray-400' : 'text-gray-500'"
            >
              {{ description }}
            </DialogDescription>
            
            <!-- Custom header slot -->
            <slot name="header-extra" />
          </div>

          <!-- Close button (mobile-friendly) -->
          <Button
            variant="ghost"
            size="icon"
            class="flex-shrink-0 h-8 w-8 rounded-full"
            :class="isDark ? 'hover:bg-[#252837]' : 'hover:bg-gray-100'"
            @click="handleClose"
          >
            <X :size="18" />
            <span class="sr-only">Close</span>
          </Button>
        </DialogHeader>
      </div>

      <!-- Scrollable Content -->
      <div 
        class="flex-1 overflow-y-auto px-6 py-4"
        :style="{ maxHeight: contentMaxHeight }"
      >
        <slot />
      </div>

      <!-- Footer -->
      <div 
        v-if="showFooter || $slots.footer"
        class="flex-shrink-0 px-6 py-4 border-t"
        :class="[
          isDark ? 'bg-[#1c1f2e] border-[#2a2d3e]' : 'bg-white border-gray-200'
        ]"
      >
        <slot name="footer" />
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
/* Ensure smooth scrolling */
.overflow-y-auto {
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

/* Mobile optimizations */
@media (max-width: 640px) {
  /* Reduce padding on mobile */
  .px-6 {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
