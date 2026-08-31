/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Ichava Icon Browser - Main Entry Point (v4 Architecture)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Laravel-integrated Vue.js application with v4 TypeScript architecture.
 * Uses the new layout components (AppHeader, AppSidebar, ToolbarMain) with shadcn-vue.
 *
 * @version 4.0.0
 */

import { createApp, reactive } from 'vue'
import { createPinia } from 'pinia'
import emitter from 'tiny-emitter/instance'
import _ from 'lodash'

// Import new App component (v4 layout)
import App from './components/App.vue'

// Import v4 TypeScript module
import { useIchava, createHttpClient } from './ichava-ts'

// Import layout components
import AppHeader from './components/layout/AppHeader.vue'
import AppSidebar from './components/layout/AppSidebar.vue'
import ToolbarMain from './components/layout/ToolbarMain.vue'

// Import feature components (kept from previous version)
import IconCard from './components/IconCard.vue'
import IconGrid from './components/IconGrid.vue'
import IconModal from './components/IconModal.vue'
import IconPreview from './components/IconPreview.vue'

// Import UI components (shadcn-vue) - using alias path
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Toggle } from '@/components/ui/toggle'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@/components/ui/command'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Toaster } from '@/components/ui/sonner'

// ═══════════════════════════════════════════════════════════════════════════════
// ICHAVA VUE APP CLASS (v4 Architecture with Laravel Integration)
// ═══════════════════════════════════════════════════════════════════════════════

class IchavaVueApp {
    constructor() {
        // Create Vue app with new App component
        this.vue = createApp(App)

        // Install global properties plugin
        this.vue.use({
            install: (app) => {
                // Translation helper
                app.config.globalProperties.__ = (key) => {
                    if (typeof window.trans === 'undefined') {
                        return key
                    }
                    return _.get(window.trans, key, key)
                }
            },
        })

        // Event bus
        this.eventBus = {
            $on: (...args) => window.$ichavaEvent?.on(...args),
            $once: (...args) => window.$ichavaEvent?.once(...args),
            $off: (...args) => window.$ichavaEvent?.off(...args),
            $emit: (...args) => window.$ichavaEvent?.emit(...args),
        }

        // Create Pinia instance
        this.pinia = createPinia()

        // Plugin registry (pinia is added by default)
        this.vuePlugins = [this.pinia]

        // Lifecycle callbacks
        this.bootingCallbacks = []
        this.bootedCallbacks = []

        // Boot status
        this.hasBooted = false
    }

    registerVuePlugin(plugin) {
        this.vuePlugins.push(plugin)
    }

    booting(callback) {
        this.bootingCallbacks.push(callback)
    }

    booted(callback) {
        this.bootedCallbacks.push(callback)
    }

    boot() {
        // Run booting callbacks (component registration)
        for (const callback of this.bootingCallbacks) {
            callback(this.vue)
        }

        // Install registered Vue plugins
        for (const plugin of this.vuePlugins) {
            this.vue.use(plugin)
        }

        // Run booted callbacks
        for (const callback of this.bootedCallbacks) {
            callback(this)
        }

        // Mount to DOM element
        const appElement = document.getElementById('ichava-app')
        if (appElement) {
            this.vue.mount('#ichava-app')
            console.log('✅ Ichava Vue App mounted (v4)')
        } else {
            console.warn('[Ichava] #ichava-app element not found')
        }

        this.hasBooted = true
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

// Create a global event emitter
window.$ichavaEvent = emitter

// Create an HTTP client for API calls
window.$ichavaApi = createHttpClient({ baseUrl: '/ichava/api' })

// Initialize CSRF cookie for Laravel Sanctum stateful API
// This should be done ONCE during app initialization
window.$ichavaApi.initializeCsrf().then(() => {
  console.debug('[Ichava] CSRF initialized for stateful API')
}).catch(error => {
  console.warn('[Ichava] CSRF initialization failed, will use meta tag fallback:', error)
})

// Create global app instance
window.ichavaApp = new IchavaVueApp()

// Register all components via booting hook
window.ichavaApp.booting((vue) => {
    // Layout components (v4)
    vue.component('v-app-header', AppHeader)
    vue.component('v-app-sidebar', AppSidebar)
    vue.component('v-toolbar-main', ToolbarMain)

    // Feature components
    vue.component('v-icon-card', IconCard)
    vue.component('v-icon-grid', IconGrid)
    vue.component('v-icon-modal', IconModal)
    vue.component('v-icon-preview', IconPreview)

    // UI Components (shadcn-vue)
    vue.component('v-button', Button)
    vue.component('v-card', Card)
    vue.component('v-card-content', CardContent)
    vue.component('v-card-description', CardDescription)
    vue.component('v-card-footer', CardFooter)
    vue.component('v-card-header', CardHeader)
    vue.component('v-card-title', CardTitle)
    vue.component('v-input', Input)
    vue.component('v-badge', Badge)
    vue.component('v-checkbox', Checkbox)
    vue.component('v-slider', Slider)
    vue.component('v-switch', Switch)
    vue.component('v-toggle', Toggle)
    vue.component('v-skeleton', Skeleton)
    vue.component('v-progress', Progress)
    vue.component('v-separator', Separator)
    vue.component('v-scroll-area', ScrollArea)
    vue.component('v-scroll-bar', ScrollBar)
    vue.component('v-tooltip', Tooltip)
    vue.component('v-tooltip-content', TooltipContent)
    vue.component('v-tooltip-provider', TooltipProvider)
    vue.component('v-tooltip-trigger', TooltipTrigger)
    vue.component('v-dialog', Dialog)
    vue.component('v-dialog-close', DialogClose)
    vue.component('v-dialog-content', DialogContent)
    vue.component('v-dialog-description', DialogDescription)
    vue.component('v-dialog-footer', DialogFooter)
    vue.component('v-dialog-header', DialogHeader)
    vue.component('v-dialog-title', DialogTitle)
    vue.component('v-dialog-trigger', DialogTrigger)
    vue.component('v-dropdown-menu', DropdownMenu)
    vue.component('v-dropdown-menu-checkbox-item', DropdownMenuCheckboxItem)
    vue.component('v-dropdown-menu-content', DropdownMenuContent)
    vue.component('v-dropdown-menu-group', DropdownMenuGroup)
    vue.component('v-dropdown-menu-item', DropdownMenuItem)
    vue.component('v-dropdown-menu-label', DropdownMenuLabel)
    vue.component('v-dropdown-menu-radio-group', DropdownMenuRadioGroup)
    vue.component('v-dropdown-menu-radio-item', DropdownMenuRadioItem)
    vue.component('v-dropdown-menu-separator', DropdownMenuSeparator)
    vue.component('v-dropdown-menu-shortcut', DropdownMenuShortcut)
    vue.component('v-dropdown-menu-sub', DropdownMenuSub)
    vue.component('v-dropdown-menu-sub-content', DropdownMenuSubContent)
    vue.component('v-dropdown-menu-sub-trigger', DropdownMenuSubTrigger)
    vue.component('v-dropdown-menu-trigger', DropdownMenuTrigger)
    vue.component('v-sheet', Sheet)
    vue.component('v-sheet-close', SheetClose)
    vue.component('v-sheet-content', SheetContent)
    vue.component('v-sheet-description', SheetDescription)
    vue.component('v-sheet-footer', SheetFooter)
    vue.component('v-sheet-header', SheetHeader)
    vue.component('v-sheet-title', SheetTitle)
    vue.component('v-sheet-trigger', SheetTrigger)
    vue.component('v-tabs', Tabs)
    vue.component('v-tabs-content', TabsContent)
    vue.component('v-tabs-list', TabsList)
    vue.component('v-tabs-trigger', TabsTrigger)
    vue.component('v-alert', Alert)
    vue.component('v-alert-description', AlertDescription)
    vue.component('v-alert-title', AlertTitle)
    vue.component('v-select', Select)
    vue.component('v-select-content', SelectContent)
    vue.component('v-select-group', SelectGroup)
    vue.component('v-select-item', SelectItem)
    vue.component('v-select-label', SelectLabel)
    vue.component('v-select-separator', SelectSeparator)
    vue.component('v-select-trigger', SelectTrigger)
    vue.component('v-select-value', SelectValue)
    vue.component('v-popover', Popover)
    vue.component('v-popover-content', PopoverContent)
    vue.component('v-popover-trigger', PopoverTrigger)
    vue.component('v-command', Command)
    vue.component('v-command-dialog', CommandDialog)
    vue.component('v-command-empty', CommandEmpty)
    vue.component('v-command-group', CommandGroup)
    vue.component('v-command-input', CommandInput)
    vue.component('v-command-item', CommandItem)
    vue.component('v-command-list', CommandList)
    vue.component('v-command-separator', CommandSeparator)
    vue.component('v-command-shortcut', CommandShortcut)
    vue.component('v-accordion', Accordion)
    vue.component('v-accordion-content', AccordionContent)
    vue.component('v-accordion-item', AccordionItem)
    vue.component('v-accordion-trigger', AccordionTrigger)
    vue.component('v-hover-card', HoverCard)
    vue.component('v-hover-card-content', HoverCardContent)
    vue.component('v-hover-card-trigger', HoverCardTrigger)
    vue.component('v-toaster', Toaster)
})

// Auto-boot on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    if (!window.ichavaApp.hasBooted) {
        window.ichavaApp.boot()
    }
})

// Export for external use
export { IchavaVueApp }
export default window.ichavaApp
