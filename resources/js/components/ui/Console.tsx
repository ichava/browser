import { type ReactNode, useState } from 'react';
import { Glyph } from './Glyph';
import { useT } from '@js/hooks/useT';

/**
 * Console — a terminal-styled code surface: traffic-light chrome, a line-number
 * gutter, and lightweight token colouring. Used for the detail dialog's emitted
 * snippet + keyframes so input and output read as one console. Colours come from
 * --console-* tokens (theme.css); no external highlighter dependency.
 */

// One-pass tokenizer → coloured React spans. Order matters (comment/string first).
const RULES: { type: string; re: RegExp }[] = [
  { type: 'comment', re: /\/\/[^\n]*/y },
  { type: 'string', re: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/y },
  { type: 'number', re: /-?\b\d+(?:\.\d+)?\b/y },
  { type: 'keyword', re: /\b(?:const|let|def|import|from|export|return|function|new|true|false|null|Infinity)\b/y },
  { type: 'punct', re: /[{}[\]():;,=<>/]+/y },
  { type: 'space', re: /\s+/y },
  { type: 'text', re: /[^\s{}[\]():;,=<>/"'0-9]+/y },
];
const COLOR: Record<string, string> = {
  comment: 'var(--console-comment)',
  string: 'var(--console-string)',
  number: 'var(--console-number)',
  keyword: 'var(--console-keyword)',
  punct: 'var(--console-punct)',
  text: 'var(--console-fg)',
  space: 'var(--console-fg)',
};

function colorize(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  let guard = 0;
  while (i < line.length && guard++ < 500) {
    let matched = false;
    for (const { type, re } of RULES) {
      re.lastIndex = i;
      const m = re.exec(line);
      if (m && m.index === i && m[0].length) {
        if (type === 'space') out.push(m[0]);
        else out.push(<span key={i} style={{ color: COLOR[type] }}>{m[0]}</span>);
        i += m[0].length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out.push(line[i]);
      i += 1;
    }
  }
  return out;
}

export function Console({
  title,
  code,
  onCopy,
  height = 300,
}: {
  title: string;
  code: string;
  onCopy?: () => void;
  height?: number | string;
}) {
  const [copied, setCopied] = useState(false);
  const t = useT();
  const lines = code.split('\n');
  const copy = () => {
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div
      style={{
        height,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--console-border)',
        borderRadius: 'calc(var(--radius) - 2px)',
        overflow: 'hidden',
        background: 'var(--console-bg)',
      }}
    >
      <div className="h-[30px] flex-none flex items-center gap-1.5 py-0 px-2.5 bg-[var(--console-chrome)] border-b border-b-[var(--console-border)]">
        <Dot c="#f87171" /><Dot c="#fbbf24" /><Dot c="#34d399" />
        <span className="flex-1 text-center font-[family-name:'Geist_Mono',monospace] text-[10px] text-[var(--console-comment)]">{title}</span>
        {onCopy && (
          <button
            onClick={copy}
            aria-label={t('console.copyCode')}
            className="h-5 py-0 px-2 border border-[var(--console-border)] rounded-[5px] bg-[var(--console-chrome)] text-[10.5px] cursor-pointer text-[var(--console-fg)] flex items-center gap-[5px]"
          >
            <Glyph name={copied ? 'check' : 'copy'} size={9} color="currentColor" /> {copied ? t('console.copied') : t('console.copy')}
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto flex font-[family-name:'Geist_Mono',monospace] text-[11px] leading-[1.7]">
        <div aria-hidden className="flex-none pt-2.5 pr-2 pb-2.5 pl-2.5 text-right text-[var(--console-gutter)] select-none bg-[var(--console-bg)]">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <pre className="m-0 py-2.5 px-3 text-[var(--console-fg)] whitespace-pre-wrap [word-break:break-word] flex-1">
          {lines.map((ln, i) => (
            <div key={i}>{ln ? colorize(ln) : ' '}</div>
          ))}
        </pre>
      </div>
    </div>
  );
}

function Dot({ c }: { c: string }) {
  return <span style={{ width: 9, height: 9, borderRadius: '50%', background: c, flex: 'none' }} />;
}
