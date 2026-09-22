/**
 * raster — render an SVG string to a PNG blob via canvas (Vue-parity:
 * `Download.svgToPng`). Client-side, no backend. Used by the detail dialog's
 * PNG download option.
 */
export async function svgToPng(svg: string, size = 512, background: string | null = null): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('svg decode failed'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, size, size);
    }
    ctx.drawImage(img, 0, 0, size, size);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadBlob(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
