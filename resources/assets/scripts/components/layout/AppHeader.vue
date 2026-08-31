<script setup lang="ts">
import { computed } from 'vue'
import {
  Command,
  LayoutGrid,
  List,
  Layers,
  Heart,
  Clock,
  Settings,
  Sun,
  Moon,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useIchava } from '@/ichava-ts'

const {
  isDark,
  toggleTheme,
  favoritesCount,
  collectionsCount,
  totalIconCount,
  selectedPackages,
  viewMode,
  toggleViewMode,
  formatNumber
} = useIchava()

const emit = defineEmits<{
  'open-command-palette': []
  'open-favorites': []
  'open-history': []
  'open-settings': []
  'open-collections': []
}>()

const packageCount = computed(() => selectedPackages.value.length)
</script>

<template>
  <TooltipProvider>
    <header
      class="sticky top-0 z-40 w-full border-b theme-transition"
      :class="isDark ? 'border-[#1e2235] bg-[#0a0d1a]' : 'border-gray-200 bg-white'"
    >
      <div class="flex h-14 items-center px-6">
        <!-- Logo & Branding -->
        <div class="flex items-center gap-4 flex-1">
          <div class="flex items-center gap-2">
            <span class="text-lg font-semibold text-purple-400">Ichava 7</span>
            <span class="text-lg font-normal" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Browser</span>
          </div>
          <div class="text-sm" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            {{ formatNumber(totalIconCount) }} icons in {{ packageCount }} packages
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1">
          <!-- Command Palette -->
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                @click="emit('open-command-palette')"
                :class="isDark ? 'hover:bg-[#151823]' : 'hover:bg-gray-100'"
              >
                <Command :size="20" :class="isDark ? 'text-gray-400' : 'text-gray-500'" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Command Palette (⌘K)</p>
            </TooltipContent>
          </Tooltip>

          <!-- View Toggle -->
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                @click="toggleViewMode"
                :class="isDark ? 'hover:bg-[#151823]' : 'hover:bg-gray-100'"
              >
                <LayoutGrid v-if="viewMode === 'grid'" :size="20" :class="isDark ? 'text-gray-400' : 'text-gray-500'" />
                <List v-else :size="20" :class="isDark ? 'text-gray-400' : 'text-gray-500'" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{{ viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View' }}</p>
            </TooltipContent>
          </Tooltip>

          <!-- Collections -->
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="relative"
                @click="emit('open-collections')"
                :class="isDark ? 'hover:bg-[#151823]' : 'hover:bg-gray-100'"
              >
                <Layers :size="20" :class="isDark ? 'text-gray-400' : 'text-gray-500'" />
                <Badge
                  v-if="collectionsCount > 0"
                  class="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 text-[10px] bg-purple-500 text-white border-0"
                >
                  {{ collectionsCount }}
                </Badge>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Collections</p>
            </TooltipContent>
          </Tooltip>

          <!-- Favorites -->
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="relative"
                @click="emit('open-favorites')"
                :class="isDark ? 'hover:bg-[#151823]' : 'hover:bg-gray-100'"
              >
                <Heart
                  :size="20"
                  :fill="favoritesCount > 0 ? 'currentColor' : 'none'"
                  class="transition-colors"
                  :class="favoritesCount > 0 ? 'text-pink-400' : (isDark ? 'text-gray-400' : 'text-gray-500')"
                />
                <Badge
                  v-if="favoritesCount > 0"
                  class="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 text-[10px] bg-pink-500 text-white border-0"
                >
                  {{ favoritesCount }}
                </Badge>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Favorites</p>
            </TooltipContent>
          </Tooltip>

          <!-- History -->
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                @click="emit('open-history')"
                :class="isDark ? 'hover:bg-[#151823]' : 'hover:bg-gray-100'"
              >
                <Clock :size="20" :class="isDark ? 'text-gray-400' : 'text-gray-500'" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>History</p>
            </TooltipContent>
          </Tooltip>

          <!-- Theme Toggle -->
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                @click="toggleTheme"
                class="ring-2 ring-purple-500/50"
                :class="isDark ? 'hover:bg-[#151823]' : 'hover:bg-gray-100'"
              >
                <Sun v-if="isDark" :size="20" class="text-yellow-400" />
                <Moon v-else :size="20" class="text-indigo-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{{ isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode' }}</p>
            </TooltipContent>
          </Tooltip>

          <!-- Settings -->
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                @click="emit('open-settings')"
                :class="isDark ? 'hover:bg-[#151823]' : 'hover:bg-gray-100'"
              >
                <Settings :size="20" :class="isDark ? 'text-gray-400' : 'text-gray-500'" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  </TooltipProvider>
</template>
