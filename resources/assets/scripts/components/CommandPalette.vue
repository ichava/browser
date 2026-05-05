<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useIchava } from '@/ichava-ts'
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
} from '@headlessui/vue'
import {
  Search,
  Heart,
  Clock,
  Layers,
  Settings,
  RefreshCw,
  Folder,
  Sun,
  Moon,
} from 'lucide-vue-next'

// Props
const props = defineProps<{
  open: boolean
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'show-favorites'): void
  (e: 'show-history'): void
  (e: 'show-collections'): void
  (e: 'show-settings'): void
  (e: 'toggle-theme'): void
  (e: 'reset-filters'): void
}>()

// Composable
const {
  isDark,
  recentCommands,
  loadCommandHistory,
  addCommandHistory,
} = useIchava()

// Local state
const query = ref('')
const selectedItem = ref<any>(null)

// Quick actions configuration with keyboard shortcuts
const quickActions = computed(() => [
  { 
    id: 'search-icons', 
    name: 'Search icons', 
    icon: Search,
    shortcut: ['⌘', 'F'],
    keys: ['Meta', 'f'],
    action: () => {
      closeAndFocusSearch()
      addCommandHistory('Search icons', 'action')
    }
  },
  { 
    id: 'view-favorites', 
    name: 'View favorites', 
    icon: Heart,
    shortcut: ['⌘', '1'],
    keys: ['Meta', '1'],
    action: () => {
      emit('show-favorites')
      addCommandHistory('View favorites', 'action')
    }
  },
  { 
    id: 'view-history', 
    name: 'View history', 
    icon: Clock,
    shortcut: ['⌘', '2'],
    keys: ['Meta', '2'],
    action: () => {
      emit('show-history')
      addCommandHistory('View history', 'action')
    }
  },
  { 
    id: 'view-collections', 
    name: 'View collections', 
    icon: Layers,
    shortcut: ['⌘', '3'],
    keys: ['Meta', '3'],
    action: () => {
      emit('show-collections')
      addCommandHistory('View collections', 'action')
    }
  },
  { 
    id: 'open-settings', 
    name: 'Open settings', 
    icon: Settings,
    shortcut: ['⌘', ','],
    keys: ['Meta', ','],
    action: () => {
      emit('show-settings')
      addCommandHistory('Open settings', 'action')
    }
  },
  { 
    id: 'toggle-theme', 
    name: `Switch to ${isDark.value ? 'light' : 'dark'} mode`, 
    icon: isDark.value ? Sun : Moon,
    shortcut: ['⌘', 'T'],
    keys: ['Meta', 't'],
    action: () => {
      emit('toggle-theme')
      addCommandHistory('Toggle theme', 'action')
    }
  },
  { 
    id: 'reset-filters', 
    name: 'Reset filters', 
    icon: RefreshCw,
    shortcut: ['⌘', 'R'],
    keys: ['Meta', 'r'],
    action: () => {
      emit('reset-filters')
      addCommandHistory('Reset filters', 'action')
    }
  },
])

// Computed
const filteredResults = computed(() => {
  const lowerQuery = query.value.toLowerCase()
  
  if (!lowerQuery) return []
  
  // Filter quick actions
  const actions = quickActions.value.filter(action => 
    action.name.toLowerCase().includes(lowerQuery)
  )
  
  // Filter recent commands
  const recent = recentCommands.value?.filter((cmd: any) => 
    cmd.command.toLowerCase().includes(lowerQuery)
  ) || []
  
  return [...actions, ...recent]
})

// Detect OS for keyboard shortcuts display
const isMac = computed(() => {
  return typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
})

// Methods
const closeAndFocusSearch = () => {
  emit('update:open', false)
  setTimeout(() => {
    document.querySelector('[data-unified-search]')?.focus()
  }, 100)
}

const onSelect = (item: any) => {
  if (!item) return
  
  if (item.action) {
    // Quick action
    item.action()
  } else if (item.command) {
    // Recent command - replay it
    const action = quickActions.find(a => a.name === item.command)
    if (action) action.action()
  }
  
  emit('update:open', false)
  query.value = ''
}

const handleClose = () => {
  emit('update:open', false)
  query.value = ''
}

// Load command history when opened
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    loadCommandHistory()
  }
})

// Keyboard shortcuts handler
const handleKeydown = (event: KeyboardEvent) => {
  // Cmd/Ctrl + K to toggle command palette
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault()
    emit('update:open', !props.open)
    return
  }

  // Only handle shortcuts when palette is open
  if (!props.open) return

  // ESC to close (already handled by Dialog, but explicit for clarity)
  if (event.key === 'Escape') {
    event.preventDefault()
    handleClose()
    return
  }

  // Check quick action shortcuts
  for (const action of quickActions.value) {
    if (!action.keys) continue
    
    const [modifier, key] = action.keys
    const modifierPressed = modifier === 'Meta' 
      ? (event.metaKey || event.ctrlKey) 
      : event.getModifierState(modifier)
    
    if (modifierPressed && event.key.toLowerCase() === key.toLowerCase()) {
      event.preventDefault()
      action.action()
      handleClose()
      return
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <TransitionRoot 
    :show="open" 
    as="template" 
    @after-leave="query = ''" 
    appear
  >
    <Dialog 
      class="relative z-50" 
      @close="handleClose"
    >
      <!-- Backdrop -->
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div 
          class="fixed inset-0 bg-gray-500/25 transition-opacity backdrop-blur-[2px]" 
          :class="isDark ? 'dark:bg-gray-900/50' : ''"
        />
      </TransitionChild>

      <!-- Dialog Panel -->
      <div class="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 md:p-20">
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0 scale-95"
          enter-to="opacity-100 scale-100"
          leave="ease-in duration-200"
          leave-from="opacity-100 scale-100"
          leave-to="opacity-0 scale-95"
        >
          <DialogPanel 
            class="mx-auto max-w-2xl transform divide-y overflow-hidden rounded-xl shadow-2xl outline outline-1 backdrop-blur-sm backdrop-filter transition-all"
            :class="[
              isDark 
                ? 'divide-white/10 bg-gray-900/80 -outline-offset-1 outline-white/10' 
                : 'divide-gray-500/10 bg-white/80 outline-black/5'
            ]"
          >
            <Combobox @update:modelValue="onSelect">
              <!-- Search Input -->
              <div class="grid grid-cols-1">
                <ComboboxInput
                  class="col-start-1 row-start-1 h-12 w-full bg-transparent pr-4 pl-11 text-base outline-hidden"
                  :class="isDark ? 'text-white placeholder:text-gray-400' : 'text-gray-900 placeholder:text-gray-500'"
                  placeholder="Type a command or search..."
                  @change="query = $event.target.value"
                  @blur="query = ''"
                />
                <Search
                  :size="20"
                  class="pointer-events-none col-start-1 row-start-1 ml-4 self-center"
                  :class="isDark ? 'text-gray-500' : 'text-gray-900/40'"
                  aria-hidden="true"
                />
              </div>

              <!-- Results -->
              <ComboboxOptions
                v-if="query === '' || filteredResults.length > 0"
                static
                as="ul"
                class="max-h-80 scroll-py-2 divide-y overflow-y-auto"
                :class="isDark ? 'divide-white/5' : 'divide-gray-500/10'"
              >
                <!-- Recent Searches (when no query) -->
                <li v-if="query === '' && recentCommands.length > 0" class="p-2">
                  <h2 
                    class="mt-4 mb-2 px-3 text-xs font-semibold"
                    :class="isDark ? 'text-white' : 'text-gray-900'"
                  >
                    Recent searches
                  </h2>
                  <ul 
                    class="text-sm"
                    :class="isDark ? 'text-gray-300' : 'text-gray-700'"
                  >
                    <ComboboxOption
                      v-for="cmd in recentCommands.slice(0, 5)"
                      :key="cmd.timestamp"
                      :value="cmd"
                      as="template"
                      v-slot="{ active }"
                    >
                      <li 
                        :class="[
                          'flex cursor-default items-center rounded-md px-3 py-2 select-none',
                          active && (isDark ? 'bg-white/5 text-white outline-hidden' : 'bg-gray-900/5 text-gray-900 outline-hidden')
                        ]"
                      >
                        <Folder
                          :size="24"
                          :class="[
                            'flex-none',
                            !active && (isDark ? 'text-gray-500' : 'text-gray-900/40'),
                            active && (isDark ? 'text-white' : 'text-gray-900')
                          ]"
                          aria-hidden="true"
                        />
                        <span class="ml-3 flex-auto truncate">{{ cmd.command }}</span>
                        <span 
                          v-if="active" 
                          class="ml-3 flex-none text-xs"
                          :class="isDark ? 'text-gray-400' : 'text-gray-500'"
                        >
                          Jump to...
                        </span>
                      </li>
                    </ComboboxOption>
                  </ul>
                </li>

                <!-- Quick Actions (when no query) -->
                <li v-if="query === ''" class="p-2">
                  <h2 class="sr-only">Quick actions</h2>
                  <ul 
                    class="text-sm"
                    :class="isDark ? 'text-gray-300' : 'text-gray-700'"
                  >
                    <ComboboxOption
                      v-for="action in quickActions"
                      :key="action.id"
                      :value="action"
                      as="template"
                      v-slot="{ active }"
                    >
                      <li 
                        :class="[
                          'flex cursor-default items-center rounded-md px-3 py-2 select-none',
                          active && (isDark ? 'bg-white/5 text-white outline-hidden' : 'bg-gray-900/5 text-gray-900 outline-hidden')
                        ]"
                      >
                        <component
                          :is="action.icon"
                          :size="24"
                          :class="[
                            'flex-none',
                            !active && (isDark ? 'text-gray-500' : 'text-gray-900/40'),
                            active && (isDark ? 'text-white' : 'text-gray-900')
                          ]"
                          aria-hidden="true"
                        />
                        <span class="ml-3 flex-auto truncate">{{ action.name }}</span>
                        <!-- Keyboard shortcut badge -->
                        <span 
                          v-if="action.shortcut && action.shortcut.length > 0" 
                          class="ml-3 flex-none flex items-center gap-1"
                        >
                          <kbd 
                            v-for="(key, idx) in action.shortcut"
                            :key="idx"
                            class="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border px-1 font-sans text-[10px] font-medium"
                            :class="[
                              active 
                                ? (isDark ? 'border-white/20 bg-white/10 text-white' : 'border-gray-900/20 bg-gray-900/10 text-gray-900')
                                : (isDark ? 'border-white/10 bg-white/5 text-gray-400' : 'border-gray-900/10 bg-gray-900/5 text-gray-500')
                            ]"
                          >
                            {{ key }}
                          </kbd>
                        </span>
                      </li>
                    </ComboboxOption>
                  </ul>
                </li>

                <!-- Filtered Results (when searching) -->
                <li v-if="query !== '' && filteredResults.length > 0" class="p-2">
                  <ul 
                    class="text-sm"
                    :class="isDark ? 'text-gray-300' : 'text-gray-700'"
                  >
                    <ComboboxOption
                      v-for="result in filteredResults"
                      :key="result.id || result.timestamp"
                      :value="result"
                      as="template"
                      v-slot="{ active }"
                    >
                      <li 
                        :class="[
                          'flex cursor-default items-center rounded-md px-3 py-2 select-none',
                          active && (isDark ? 'bg-white/5 text-white outline-hidden' : 'bg-gray-900/5 text-gray-900 outline-hidden')
                        ]"
                      >
                        <component
                          :is="result.icon || Folder"
                          :size="24"
                          :class="[
                            'flex-none',
                            !active && (isDark ? 'text-gray-500' : 'text-gray-900/40'),
                            active && (isDark ? 'text-white' : 'text-gray-900')
                          ]"
                          aria-hidden="true"
                        />
                        <span class="ml-3 flex-auto truncate">{{ result.name || result.command }}</span>
                      </li>
                    </ComboboxOption>
                  </ul>
                </li>
              </ComboboxOptions>

              <!-- No Results -->
              <div 
                v-if="query !== '' && filteredResults.length === 0" 
                class="px-6 py-14 text-center sm:px-14"
              >
                <Folder
                  :size="24"
                  class="mx-auto"
                  :class="isDark ? 'text-gray-500' : 'text-gray-900/40'"
                  aria-hidden="true"
                />
                <p 
                  class="mt-4 text-sm"
                  :class="isDark ? 'text-gray-300' : 'text-gray-900'"
                >
                  We couldn't find any projects with that term. Please try again.
                </p>
              </div>

              <!-- Footer with keyboard shortcuts -->
              <div 
                class="flex flex-wrap items-center gap-x-3 gap-y-2 border-t px-4 py-3 text-xs"
                :class="[
                  isDark 
                    ? 'border-white/10 bg-gray-900/50 text-gray-400' 
                    : 'border-gray-900/10 bg-gray-50/80 text-gray-600'
                ]"
              >
                <!-- ESC to close -->
                <div class="flex items-center gap-1.5">
                  <kbd 
                    class="inline-flex h-5 min-w-[2.5rem] items-center justify-center rounded border px-1.5 font-sans text-[10px] font-medium"
                    :class="[
                      isDark 
                        ? 'border-white/10 bg-white/5 text-gray-300' 
                        : 'border-gray-900/10 bg-white text-gray-700'
                    ]"
                  >
                    ESC
                  </kbd>
                  <span>to close</span>
                </div>

                <!-- Separator -->
                <span 
                  class="text-gray-300 dark:text-gray-700"
                  aria-hidden="true"
                >
                  •
                </span>

                <!-- Enter to select -->
                <div class="flex items-center gap-1.5">
                  <kbd 
                    class="inline-flex h-5 min-w-[2.5rem] items-center justify-center rounded border px-1.5 font-sans text-[10px] font-medium"
                    :class="[
                      isDark 
                        ? 'border-white/10 bg-white/5 text-gray-300' 
                        : 'border-gray-900/10 bg-white text-gray-700'
                    ]"
                  >
                    ↵
                  </kbd>
                  <span>to select</span>
                </div>

                <!-- Separator -->
                <span 
                  class="text-gray-300 dark:text-gray-700"
                  aria-hidden="true"
                >
                  •
                </span>

                <!-- Arrow keys to navigate -->
                <div class="flex items-center gap-1.5">
                  <div class="flex items-center gap-0.5">
                    <kbd 
                      class="inline-flex h-5 w-5 items-center justify-center rounded border font-sans text-[10px] font-medium"
                      :class="[
                        isDark 
                          ? 'border-white/10 bg-white/5 text-gray-300' 
                          : 'border-gray-900/10 bg-white text-gray-700'
                      ]"
                    >
                      ↑
                    </kbd>
                    <kbd 
                      class="inline-flex h-5 w-5 items-center justify-center rounded border font-sans text-[10px] font-medium"
                      :class="[
                        isDark 
                          ? 'border-white/10 bg-white/5 text-gray-300' 
                          : 'border-gray-900/10 bg-white text-gray-700'
                      ]"
                    >
                      ↓
                    </kbd>
                  </div>
                  <span>to navigate</span>
                </div>

                <!-- Spacer -->
                <div class="flex-1 min-w-0" />

                <!-- Command palette shortcut -->
                <div class="flex items-center gap-1.5">
                  <span class="hidden sm:inline">Open:</span>
                  <div class="flex items-center gap-0.5">
                    <kbd 
                      class="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border px-1 font-sans text-[10px] font-medium"
                      :class="[
                        isDark 
                          ? 'border-white/10 bg-white/5 text-gray-300' 
                          : 'border-gray-900/10 bg-white text-gray-700'
                      ]"
                    >
                      {{ isMac ? '⌘' : 'Ctrl' }}
                    </kbd>
                    <kbd 
                      class="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border px-1 font-sans text-[10px] font-medium"
                      :class="[
                        isDark 
                          ? 'border-white/10 bg-white/5 text-gray-300' 
                          : 'border-gray-900/10 bg-white text-gray-700'
                      ]"
                    >
                      K
                    </kbd>
                  </div>
                </div>
              </div>
            </Combobox>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

