// Guard: every static glyph reference must have a matching entry in the GLYPH map, so
// a missing glyph fails CI instead of rendering a blank spacer.
//
// The map is backed by @untitledui/icons. Dynamic names -- `name={variable}`, config and
// notification `icon` fields -- cannot be checked here; `e2e/glyphs.spec.ts` covers those
// by failing on the runtime warning.
//
// The scanner extracts EVERY quoted token from a `name=` value, not just the first.
// That is deliberate: `name={theme === 'dark' ? 'sun' : 'moon'}` references two glyphs,
// and a first-token-only regex reports `moon` as used and `sun` as dead. Nine names --
// every toggle pair, grid/list, play/pause, sort-asc/desc -- are only ever written that
// way, so the naive form makes the unreachable-entry check unusable without a
// hand-maintained allowlist that rots.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GLYPH } from './Glyph';

// The migrated tree root: resources/js (components, core, hooks, lib, pages,
// store, ...). `walk` skips `test/` (fixtures), `base/` and `foundations/`.
const ROOT = join(__dirname, '..', '..');
const SRC = ROOT;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'test') continue; // fixtures carry data-icon names, not UI glyphs
    // Vendored Untitled UI components use `icon:` for Tailwind class strings
    // (`icon: "size-4"`), sharing the key name but none of the vocabulary.
    if (entry === 'base' || entry === 'foundations') continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(p);
  }
  return out;
}

/**
 * Every glyph name referenced anywhere: `name="x"`, `name={'x'}`, both arms of
 * `name={c ? 'a' : 'b'}`, and `icon: 'x'` fields on context-menu / notification / tour
 * items. Truly dynamic values (`name={row.icon}`) cannot be resolved statically and are
 * covered by the runtime check instead.
 */
function referencedGlyphs(): Map<string, string> {
  const refs = new Map<string, string>();
  // Anchored to <Glyph>, then every quoted token inside that element's `name` value.
  // Anchoring matters: an unanchored `name=` also matches <meta name>, a `size-4`
  // className and the csrf-token header, none of which are glyphs.
  const glyphName = /<Glyph\b[\s\S]{0,240}?\bname=(\{(?:[^{}]|\{[^{}]*\})*\}|"[^"]*"|'[^']*')/g;
  const iconField = /\bicon["']?\s*:\s*(\{(?:[^{}]|\{[^{}]*\})*\}|"[a-z][a-z0-9-]*"|'[a-z][a-z0-9-]*')/g;
  for (const file of walk(SRC)) {
    const text = readFileSync(file, 'utf8');
    // `<Glyph name=…>` only where Glyph is imported; `icon:` fields anywhere, because
    // config, notification seeds and tour steps declare glyph names without rendering
    // them (core/config.ts names `stats` and `cube` for toolbar entries).
    const importsGlyph = /from ['"](@\/components\/ui\/Glyph|\.\/Glyph)['"]/.test(text);
    for (const holder of importsGlyph ? [glyphName, iconField] : [iconField]) {
      for (const h of text.matchAll(holder)) {
        // In a conditional, read only the BRANCHES. `name={theme === 'dark' ? 'sun' :
        // 'moon'}` references sun and moon; `dark` is the comparison operand, and
        // treating it as a glyph name reports a phantom missing entry.
        const value = h[1]!;
        const branches = value.includes('?') ? value.slice(value.indexOf('?')) : value;
        for (const tok of branches.matchAll(/["']([a-z][a-z0-9-]*)["']/g)) {
          // `size-9` and friends are Tailwind sizing classes that happen to sit under an
          // `icon:` key in cva variants. Never a glyph name.
          if (/^size-\d+$/.test(tok[1]!)) continue;
          refs.set(tok[1]!, file);
        }
      }
    }
  }
  return refs;
}

describe('UI glyph coverage', () => {
  it('every referenced <Glyph> glyph is mapped in GLYPH', () => {
    const missing: string[] = [];
    for (const [glyph, file] of referencedGlyphs()) {
      if (!GLYPH[glyph]) missing.push(`${glyph} (referenced in ${file.replace(ROOT + '/', '')})`);
    }
    expect(missing, `unmapped UI glyphs:\n${missing.join('\n')}`).toEqual([]);
  });

  it('maps the link + play/pause glyphs', () => {
    expect(GLYPH.link).toBeDefined();
    expect(GLYPH.play).toBeDefined();
    expect(GLYPH.pause).toBeDefined();
  });

  it('carries no unreachable entries', () => {
    // The previous map declared 58 names, 15 of them never referenced. The whole map is
    // imported eagerly, so dead entries ship. Anything added here must be used.
    const referenced = new Set(referencedGlyphs().keys());
    const unreachable = Object.keys(GLYPH).filter((g) => !referenced.has(g));
    expect(unreachable, `unreachable GLYPH entries:\n${unreachable.join('\n')}`).toEqual([]);
  });
});
