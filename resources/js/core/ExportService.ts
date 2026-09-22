import { zipSync, strToU8 } from 'fflate';
import { getSvgParts } from './svgCache';
import { iconRef } from './SnippetFactory';
import type { Icon } from './model';

export type ExportFormat = 'files' | 'sprite' | 'manifest' | 'zip';

/**
 * ExportService — real client-side multi-select export (plan §C / plan.new-features),
 * replacing the previous toast-only stub. Produces an SVG sprite, a JSON manifest,
 * or a zip bundling the sprite + manifest + one SVG file per icon. No backend.
 */
export class ExportService {
  private async parts(icons: Icon[]): Promise<{ icon: Icon; body: string; viewBox: string }[]> {
    return Promise.all(
      icons.map(async (icon) => {
        const p = await Promise.resolve(getSvgParts(icon));
        return { icon, body: p.body, viewBox: p.viewBox };
      }),
    );
  }

  buildSprite(entries: { icon: Icon; body: string; viewBox: string }[]): string {
    const symbols = entries
      .map((e) => `  <symbol id="${slug(e.icon)}" viewBox="${e.viewBox}">\n    ${e.body}\n  </symbol>`)
      .join('\n');
    return `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${symbols}\n</svg>\n`;
  }

  buildManifest(icons: Icon[]): string {
    return JSON.stringify(
      {
        generated: 'ichava-browser',
        count: icons.length,
        icons: icons.map((i) => ({ id: i.id, ref: iconRef(i), name: i.name, package: i.package, category: i.category, variant: i.variant })),
      },
      null,
      2,
    );
  }

  buildStandaloneSvg(e: { icon: Icon; body: string; viewBox: string }): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${e.viewBox}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">\n  ${e.body}\n</svg>\n`;
  }

  async export(format: ExportFormat, icons: Icon[]): Promise<void> {
    if (!icons.length) return;
    if (format === 'manifest') {
      download('ichava-manifest.json', this.buildManifest(icons), 'application/json');
      return;
    }
    const entries = await this.parts(icons);
    if (format === 'sprite') {
      download('ichava-sprite.svg', this.buildSprite(entries), 'image/svg+xml');
      return;
    }
    if (format === 'files') {
      // "Individual .svg downloads" — one .svg per icon, bundled in a zip (browsers
      // block many simultaneous downloads; a single icon downloads the raw .svg).
      if (entries.length === 1) {
        download(`${slug(entries[0]!.icon)}.svg`, this.buildStandaloneSvg(entries[0]!), 'image/svg+xml');
        return;
      }
      const svgs: Record<string, Uint8Array> = {};
      for (const e of entries) svgs[`${slug(e.icon)}.svg`] = strToU8(this.buildStandaloneSvg(e));
      downloadBytes('ichava-svgs.zip', zipSync(svgs, { level: 6 }), 'application/zip');
      return;
    }
    // zip: sprite + manifest + per-icon svgs
    const files: Record<string, Uint8Array> = {
      'sprite.svg': strToU8(this.buildSprite(entries)),
      'manifest.json': strToU8(this.buildManifest(icons)),
    };
    for (const e of entries) files[`svg/${slug(e.icon)}.svg`] = strToU8(this.buildStandaloneSvg(e));
    const zipped = zipSync(files, { level: 6 });
    downloadBytes('ichava-icons.zip', zipped, 'application/zip');
  }
}

function slug(icon: Icon): string {
  return `${icon.package.replace(/^ichava\//, '').replace(/-icons$/, '')}-${icon.name}`;
}

function download(name: string, content: string, type: string): void {
  downloadBytes(name, strToU8(content), type);
}
function downloadBytes(name: string, bytes: Uint8Array, type: string): void {
  const blob = new Blob([bytes as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export const exporter = new ExportService();
