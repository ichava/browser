import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Mask, Glyph } from './Glyph';

describe('Glyph', () => {
  it('renders a masked span pointing at the asset', () => {
    const { container } = render(<Mask src="assets/ui/search.svg" size={16} />);
    const span = container.querySelector('span')!;
    expect(span).toBeInTheDocument();
    expect(span.style.getPropertyValue('-webkit-mask-image')).toContain('assets/ui/search.svg');
    expect(span.style.width).toBe('16px');
  });

  it('Ui renders a lucide svg glyph sized via width/height', () => {
    const { container } = render(<Glyph name="grid" size={12} />);
    const svg = container.querySelector('svg')!;
    expect(svg).toBeInTheDocument();
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('width')).toBe('12');
    expect(svg.getAttribute('height')).toBe('12');
  });

  it('Ui fills the "-filled" glyph variants', () => {
    const { container } = render(<Glyph name="heart-filled" size={12} />);
    expect(container.querySelector('svg')!.getAttribute('fill')).toBe('currentColor');
  });

  it('Glyph falls back to a spacer for an unknown glyph', () => {
    const { container } = render(<Glyph name="not-a-real-glyph" size={10} />);
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('span')!.style.width).toBe('10px');
  });
});
