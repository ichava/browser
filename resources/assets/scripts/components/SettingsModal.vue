<script setup lang="ts">
import { ref, watch } from 'vue'
import { useIchava } from '@/ichava-ts'
import { toast } from 'vue-sonner'
import { 
  Settings,
  Eye,
  Zap,
  RefreshCw,
  Download,
} from 'lucide-vue-next'
import ResponsiveModal from '@/components/base/ResponsiveModal.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Props
const props = defineProps<{
  open: boolean
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

// Composable
const { isDark } = useIchava()

// Settings state
const settings = ref({
  display: {
    showLabels: true,
    animateOnHover: true,
    strokeWidth: 2,
  },
  performance: {
    lazyLoading: true,
    virtualScrolling: true,
  },
  caching: {
    enabled: true,
    duration: 3600,
    size: 100,
  },
  export: {
    defaultFormat: 'svg',
    defaultSize: 512,
  },
  accessibility: {
    reduceMotion: false,
    highContrast: false,
  },
})

const isSaving = ref(false)

// Storage key
const SETTINGS_KEY = 'ichava_settings'

// Load settings
const loadSettings = () => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      settings.value = { ...settings.value, ...JSON.parse(stored) }
      console.debug('[SettingsModal] Loaded settings from localStorage')
    }
  } catch (error) {
    console.error('[SettingsModal] Failed to load settings:', error)
  }
}

// Save settings
const saveSettingsToStorage = () => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
    console.debug('[SettingsModal] Saved settings to localStorage')
  } catch (error) {
    console.error('[SettingsModal] Failed to save settings:', error)
  }
}

// Watch for modal open
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    loadSettings()
  }
})

// Reset to defaults
const resetToDefaults = () => {
  settings.value = {
    display: {
      showLabels: true,
      animateOnHover: true,
      strokeWidth: 2,
    },
    performance: {
      lazyLoading: true,
      virtualScrolling: true,
    },
    caching: {
      enabled: true,
      duration: 3600,
      size: 100,
    },
    export: {
      defaultFormat: 'svg',
      defaultSize: 512,
    },
    accessibility: {
      reduceMotion: false,
      highContrast: false,
    },
  }
  saveSettingsToStorage()
  toast.success('Settings reset to defaults')
}

// Save and close
const saveSettings = () => {
  try {
    isSaving.value = true
    saveSettingsToStorage()
    toast.success('Settings saved successfully')
    emit('update:open', false)
  } catch (error) {
    console.error('[SettingsModal] Failed to save settings:', error)
    toast.error('Failed to save settings')
  } finally {
    isSaving.value = false
  }
}

// Auto-save on change
watch(settings, () => {
  if (props.open) {
    saveSettingsToStorage()
  }
}, { deep: true })
</script>

<template>
  <ResponsiveModal
    :open="open"
    @update:open="emit('update:open', $event)"
    title="Settings"
    description="Customize your icon browser experience"
    :icon="Settings"
    size="md"
    :show-footer="true"
  >
    <!-- Settings Content -->
    <div class="space-y-8">
      <!-- Display Section -->
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <Eye :size="20" class="text-purple-500" />
          <h3 class="text-lg font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">
            Display
          </h3>
        </div>
        
        <div class="space-y-4 pl-7">
          <!-- Show Labels -->
          <div class="flex items-center justify-between py-2 gap-4">
            <div class="space-y-0.5 flex-1 min-w-0">
              <Label class="text-sm font-medium" :class="isDark ? 'text-gray-200' : 'text-gray-900'">
                Show Labels
              </Label>
              <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-500'">
                Display icon names below icons
              </p>
            </div>
            <Switch v-model:checked="settings.display.showLabels" />
          </div>

          <!-- Animate on Hover -->
          <div class="flex items-center justify-between py-2 gap-4">
            <div class="space-y-0.5 flex-1 min-w-0">
              <Label class="text-sm font-medium" :class="isDark ? 'text-gray-200' : 'text-gray-900'">
                Animate on Hover
              </Label>
              <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-500'">
                Scale icons when hovering
              </p>
            </div>
            <Switch v-model:checked="settings.display.animateOnHover" />
          </div>

          <!-- Stroke Width -->
          <div class="space-y-3 py-2">
            <div class="flex items-center justify-between">
              <Label class="text-sm font-medium" :class="isDark ? 'text-gray-200' : 'text-gray-900'">
                Stroke Width
              </Label>
              <span class="text-sm font-medium" :class="isDark ? 'text-gray-400' : 'text-gray-600'">
                {{ settings.display.strokeWidth }}
              </span>
            </div>
            <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-500'">
              Default SVG stroke width
            </p>
            <Slider 
              :model-value="[settings.display.strokeWidth]"
              @update:model-value="(val) => settings.display.strokeWidth = val[0]"
              :min="1"
              :max="5"
              :step="0.5"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- Performance Section -->
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <Zap :size="20" class="text-yellow-500" />
          <h3 class="text-lg font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">
            Performance
          </h3>
        </div>
        
        <div class="space-y-4 pl-7">
          <div class="flex items-center justify-between py-2 gap-4">
            <div class="space-y-0.5 flex-1 min-w-0">
              <Label class="text-sm font-medium" :class="isDark ? 'text-gray-200' : 'text-gray-900'">
                Lazy Loading
              </Label>
              <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-500'">
                Load icons as they come into view
              </p>
            </div>
            <Switch v-model:checked="settings.performance.lazyLoading" />
          </div>

          <div class="flex items-center justify-between py-2 gap-4">
            <div class="space-y-0.5 flex-1 min-w-0">
              <Label class="text-sm font-medium" :class="isDark ? 'text-gray-200' : 'text-gray-900'">
                Virtual Scrolling
              </Label>
              <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-500'">
                Only render visible icons for large sets
              </p>
            </div>
            <Switch v-model:checked="settings.performance.virtualScrolling" />
          </div>
        </div>
      </div>

      <!-- Caching Section -->
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <RefreshCw :size="20" class="text-blue-500" />
          <h3 class="text-lg font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">
            Caching
          </h3>
        </div>
        
        <div class="space-y-4 pl-7">
          <div class="flex items-center justify-between py-2 gap-4">
            <div class="space-y-0.5 flex-1 min-w-0">
              <Label class="text-sm font-medium" :class="isDark ? 'text-gray-200' : 'text-gray-900'">
                Enable Caching
              </Label>
              <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-500'">
                Cache icon data to improve performance
              </p>
            </div>
            <Switch v-model:checked="settings.caching.enabled" />
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
            <div class="space-y-0.5 flex-1 min-w-0">
              <Label class="text-sm font-medium" :class="isDark ? 'text-gray-200' : 'text-gray-900'">
                Cache Duration
              </Label>
              <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-500'">
                Time in seconds before cache expires
              </p>
            </div>
            <div class="flex items-center gap-2">
              <Input 
                v-model.number="settings.caching.duration"
                type="number"
                class="w-24 h-9 text-right"
                :class="isDark ? 'bg-[#252837] border-[#2a2d3e] text-gray-200' : 'bg-gray-50 border-gray-200'"
              />
              <span class="text-sm whitespace-nowrap" :class="isDark ? 'text-gray-500' : 'text-gray-500'">
                seconds
              </span>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
            <div class="space-y-0.5 flex-1 min-w-0">
              <Label class="text-sm font-medium" :class="isDark ? 'text-gray-200' : 'text-gray-900'">
                Cache Size
              </Label>
              <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-500'">
                Maximum number of items to cache
              </p>
            </div>
            <Input 
              v-model.number="settings.caching.size"
              type="number"
              class="w-24 h-9 text-right"
              :class="isDark ? 'bg-[#252837] border-[#2a2d3e] text-gray-200' : 'bg-gray-50 border-gray-200'"
            />
          </div>
        </div>
      </div>

      <!-- Export Defaults Section -->
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <Download :size="20" class="text-green-500" />
          <h3 class="text-lg font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">
            Export Defaults
          </h3>
        </div>
        
        <div class="space-y-4 pl-7">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
            <div class="space-y-0.5 flex-1 min-w-0">
              <Label class="text-sm font-medium" :class="isDark ? 'text-gray-200' : 'text-gray-900'">
                Default Format
              </Label>
            </div>
            <Select v-model="settings.export.defaultFormat">
              <SelectTrigger 
                class="w-full sm:w-32 h-9"
                :class="isDark ? 'bg-[#252837] border-[#2a2d3e] text-gray-200' : 'bg-gray-50 border-gray-200'"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="svg">SVG</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpeg">JPEG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
            <div class="space-y-0.5 flex-1 min-w-0">
              <Label class="text-sm font-medium" :class="isDark ? 'text-gray-200' : 'text-gray-900'">
                Default Size
              </Label>
              <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-500'">
                For raster formats (PNG, JPEG)
              </p>
            </div>
            <div class="flex items-center gap-2">
              <Input 
                v-model.number="settings.export.defaultSize"
                type="number"
                class="w-24 h-9 text-right"
                :class="isDark ? 'bg-[#252837] border-[#2a2d3e] text-gray-200' : 'bg-gray-50 border-gray-200'"
              />
              <span class="text-sm whitespace-nowrap" :class="isDark ? 'text-gray-500' : 'text-gray-500'">
                px
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Accessibility Section -->
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <Eye :size="20" class="text-orange-500" />
          <h3 class="text-lg font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">
            Accessibility
          </h3>
        </div>
        
        <div class="space-y-4 pl-7">
          <div class="flex items-center justify-between py-2 gap-4">
            <div class="space-y-0.5 flex-1 min-w-0">
              <Label class="text-sm font-medium" :class="isDark ? 'text-gray-200' : 'text-gray-900'">
                Reduce Motion
              </Label>
              <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-500'">
                Disable non-essential animations
              </p>
            </div>
            <Switch v-model:checked="settings.accessibility.reduceMotion" />
          </div>

          <div class="flex items-center justify-between py-2 gap-4">
            <div class="space-y-0.5 flex-1 min-w-0">
              <Label class="text-sm font-medium" :class="isDark ? 'text-gray-200' : 'text-gray-900'">
                High Contrast Mode
              </Label>
              <p class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-500'">
                Enhance contrast for better readability
              </p>
            </div>
            <Switch v-model:checked="settings.accessibility.highContrast" />
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
        <Button 
          variant="outline" 
          @click="resetToDefaults"
          :disabled="isSaving"
          class="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20 hover:border-red-500/40 w-full sm:w-auto"
        >
          Reset to Defaults
        </Button>
        <Button 
          @click="saveSettings"
          :disabled="isSaving"
          class="bg-purple-500 hover:bg-purple-600 text-white w-full sm:w-auto sm:px-8"
        >
          {{ isSaving ? 'Saving...' : 'Done' }}
        </Button>
      </div>
    </template>
  </ResponsiveModal>
</template>
