import { describe, expect, it } from 'vitest';
import { snippets, iconRef } from './SnippetFactory';
import { mkIcon } from '@js/test/fixtures';

const icon = mkIcon({ id: 1, name: 'home' });
const opts = { size: 24, unit: 'px', color: null };

describe('SnippetFactory', () => {
  it('derives a set:name ref from the package', () => {
    expect(iconRef(icon)).toBe('tabler:home');
    expect(iconRef(mkIcon({ id: 2, name: 'x', package: 'ichava/ui-icons' }))).toBe('ui:x');
  });

  it('uses the server-provided helper/blade strings verbatim (parity)', () => {
    expect(snippets.build('helper', icon, opts)).toBe("ichava('tabler:home')");
    expect(snippets.build('blade', icon, opts)).toBe('<x-ichava::tabler name="home" />');
    expect(snippets.build('bladeGeneric', icon, opts)).toBe('<x-ichava-icon name="tabler:home" />');
  });

  it('generates client framework formats', () => {
    expect(snippets.build('name', icon, opts)).toBe('tabler:home');
    expect(snippets.build('vue', icon, opts)).toContain('name="tabler:home"');
    expect(snippets.build('react', icon, opts)).toContain('size={24}');
    expect(snippets.build('api', icon, opts)).toContain('/ichava/api/icons/1/svg');
  });

  it('rewrites a fetched SVG body with size/stroke/color', () => {
    const body = '<svg width="24" height="24" stroke="currentColor" stroke-width="2"><path/></svg>';
    const out = snippets.build('svg', icon, { size: 40, unit: 'px', color: '#ff0000', strokeWidth: 3 }, body);
    expect(out).toContain('width="40"');
    expect(out).toContain('stroke-width="3"');
    expect(out).toContain('stroke="#ff0000"');
  });

  it('keeps own-colour fills in the SVG format (multicolor safe)', () => {
    const color = mkIcon({ id: 3, name: 'flag-mc', ownColor: true });
    const body = '<svg width="24" height="24"><path fill="#00ff00"/><path fill="#0000ff"/></svg>';
    const out = snippets.build('svg', color, { size: 32, unit: 'px', color: '#ff0000' }, body);
    expect(out).toContain('fill="#00ff00"');
    expect(out).toContain('fill="#0000ff"');
    expect(out).not.toContain('#ff0000');
  });

  it('svgFromParts builds real markup (monochrome recolours, own-colour preserved)', () => {
    const mono = snippets.svgFromParts(icon, { body: '<path d="M0 0"/>', viewBox: '0 0 24 24' }, { size: 20, unit: 'px', color: '#123456', strokeWidth: 2 });
    expect(mono).toContain('<svg');
    expect(mono).toContain('width="20"');
    expect(mono).toContain('stroke="#123456"');
    expect(mono).toContain('<path d="M0 0"/>');
    const color = mkIcon({ id: 4, name: 'mc', ownColor: true });
    const mc = snippets.svgFromParts(color, { body: '<path fill="#abcdef"/>', viewBox: '0 0 24 24' }, { size: 20, unit: 'px', color: '#123456' });
    expect(mc).toContain('fill="#abcdef"');
    expect(mc).not.toContain('#123456');
    // empty body → the commented placeholder shell (never blank)
    expect(snippets.svgFromParts(icon, { body: '', viewBox: '0 0 24 24' }, opts)).toContain('<!--');
  });
});
