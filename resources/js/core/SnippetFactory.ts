import type { Icon } from './model';

export type SnippetFormat =
  | 'svg'
  | 'motion'
  | 'helper'
  | 'blade'
  | 'bladeGeneric'
  | 'livewire'
  | 'alpine'
  | 'vue'
  | 'react'
  | 'svelte'
  | 'webcomponent'
  | 'api'
  | 'name';

export interface SnippetMotion {
  id: string;
  label: string;
  keyframes: Keyframe[];
  base: number;
  easing: string;
  easingLabel?: string;
  speed: number;
  direction?: string;
  iterations?: number;
}

export interface SnippetOptions {
  size: number;
  unit: string;
  color: string | null;
  strokeWidth?: number;
  baseUrl?: string;
  motion?: SnippetMotion;
}

/** Detail-dialog tabs. Server-provided formats first (parity), client extras after. */
export const SNIPPET_TABS: { id: SnippetFormat; label: string }[] = [
  { id: 'svg', label: 'SVG' },
  { id: 'motion', label: 'Motion' },
  { id: 'helper', label: 'Helper' },
  { id: 'blade', label: 'Blade' },
  { id: 'bladeGeneric', label: 'Blade (generic)' },
  { id: 'livewire', label: 'Livewire' },
  { id: 'alpine', label: 'Alpine' },
  { id: 'vue', label: 'Vue' },
  { id: 'react', label: 'React' },
  { id: 'svelte', label: 'Svelte' },
  { id: 'webcomponent', label: 'Web Component' },
  { id: 'api', label: 'API' },
  { id: 'name', label: 'Name' },
];

/** `set:name` reference derived from package + name (e.g. tabler:home). */
export function iconRef(icon: Icon): string {
  const short = icon.package.replace(/^ichava\//, '').replace(/-icons$/, '');
  return `${short}:${icon.name}`;
}

/**
 * SnippetFactory — strategy over copy formats. The Laravel `IconResource` already
 * ships `helper`, `blade_clean`, `blade_generic`; those are used verbatim (parity).
 * The rest (Vue/React/Svelte/Web Component/API/SVG/Name) are client enhancements.
 */
export class SnippetFactory {
  build(format: SnippetFormat, icon: Icon, o: SnippetOptions, svgBody?: string | null): string {
    const ref = iconRef(icon);
    switch (format) {
      case 'name':
        return ref;
      case 'helper':
        return icon.helper || `ichava('${ref}')`;
      case 'blade':
        return icon.bladeClean || `<x-ichava-icon name="${ref}" class="w-6 h-6" />`;
      case 'bladeGeneric':
        return icon.bladeGeneric || `<x-ichava-icon name="${ref}" class="w-6 h-6" />`;
      case 'svg':
        return this.svg(icon, o, svgBody);
      case 'motion':
        return this.motion(icon, o);
      case 'livewire':
        return `<x-ichava-icon\n    name="${ref}"\n    wire:click="select('${ref}')"\n    class="w-6 h-6"\n/>`;
      case 'alpine':
        return `<template x-if="open">\n    <x-ichava-icon name="${ref}" x-bind:style="{ width: size + 'px' }" />\n</template>`;
      case 'vue':
        return `<script setup lang="ts">\nimport { Icon } from '@ichava/vue'\n</script>\n\n<template>\n  <Icon name="${ref}" :size="${o.size}" />\n</template>`;
      case 'react':
        return `import { Icon } from '@ichava/react'\n\nexport function Example() {\n  return <Icon name="${ref}" size={${o.size}} />\n}`;
      case 'svelte':
        return `<script>\n  import { Icon } from '@ichava/svelte'\n</script>\n\n<Icon name="${ref}" size={${o.size}} />`;
      case 'webcomponent':
        return `<ichava-icon name="${ref}" size="${o.size}${o.unit}"></ichava-icon>\n<script type="module" src="https://cdn.jsdelivr.net/npm/@ichava/element"></script>`;
      case 'api':
        return `${o.baseUrl ?? ''}/ichava/api/icons/${icon.id}/svg`;
      default:
        return ref;
    }
  }

  /** Emit the selected motion preset as an @ichava/motion JSON definition. */
  private motion(_icon: Icon, o: SnippetOptions): string {
    const m = o.motion;
    if (!m || m.id === 'none') {
      return `// Pick a motion preset to export its definition.\n// Play with ichava-motion.js — IchavaMotion.fromJSON(el, def).`;
    }
    const iters = m.iterations === Infinity || m.iterations == null ? 'infinite' : m.iterations;
    const speedLabel = `${m.speed.toFixed(m.speed < 1 ? 2 : m.speed < 10 ? 1 : 0)}×`;
    const def = {
      keyframes: m.keyframes,
      duration: Math.max(80, Math.round(m.base / Math.max(0.1, m.speed))),
      easing: m.easing,
      direction: m.direction ?? 'normal',
      iterations: iters,
    };
    return (
      `// Ichava Motion — "${m.id}" · ${m.easingLabel ?? m.easing} · ${speedLabel}\n` +
      `// Play with ichava-motion.js\n` +
      `//   IchavaMotion.fromJSON(el, def, { trigger: 'loop' })\n` +
      `const def = ${JSON.stringify(def, null, 2)};`
    );
  }

  private svg(icon: Icon, o: SnippetOptions, svgBody?: string | null): string {
    const color = o.color ?? 'currentColor';
    const stroke = o.strokeWidth ?? 1.5;
    if (svgBody) {
      let out = svgBody
        .replace(/\swidth="[^"]*"/, ` width="${o.size}"`)
        .replace(/\sheight="[^"]*"/, ` height="${o.size}"`);
      // Multicolor / own-colour icons keep their own fills; only monochrome icons
      // are recoloured to the chosen preview colour + stroke width.
      if (!icon.ownColor) {
        out = out
          .replace(/stroke-width="[^"]*"/g, `stroke-width="${stroke}"`)
          .replace(/(stroke|fill)="(?!none)[^"]*"/g, (_m, p1) => `${p1}="${color}"`);
      }
      return out;
    }
    return `<svg width="${o.size}" height="${o.size}" viewBox="${icon.viewBox}" fill="none"\n     stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">\n  <!-- ${iconRef(icon)} -->\n</svg>`;
  }

  /**
   * Build a complete, standalone SVG string from parsed parts (inner body +
   * viewBox). Own-colour icons keep their fills; monochrome icons get the chosen
   * colour + stroke. This is the real markup used by copy/download so the default
   * "SVG" format is never an empty placeholder.
   */
  svgFromParts(icon: Icon, parts: { body: string; viewBox: string }, o: SnippetOptions): string {
    const size = o.size;
    const vb = parts.viewBox || icon.viewBox;
    if (!parts.body) {
      // No markup available — fall back to the commented placeholder shell.
      return this.svg(icon, o);
    }
    if (icon.ownColor) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${vb}">\n  ${parts.body}\n</svg>`;
    }
    const color = o.color ?? 'currentColor';
    const stroke = o.strokeWidth ?? 1.5;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${vb}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">\n  ${parts.body}\n</svg>`;
  }
}

export const snippets = new SnippetFactory();
