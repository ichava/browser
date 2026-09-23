// Pure, timer-free math extracted from useBootsplash so it can be tested without
// fake-timer choreography. Transcribed from the vendored @ichava/bootsplash v2.1.0
// engine (R7) -- _advance/_runProgress's accumulator+curve, _logWindow's rolling-log
// windowing, and _statusMap's parent-status derivation, all verbatim in behaviour.

import { type BootTaskDef, leaves, totalWeight } from './bootsplashConfig';

export type NodeStatus = 'pending' | 'running' | 'done' | 'error';

/** easeOutCubic, matching the original's inline `ease`. */
export function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

/**
 * One progress-curve sample. `acc` is the ACTIVE-time accumulator (ms), already
 * capped per-tick by the caller so a backgrounded tab resumes smoothly instead of
 * teleporting to 100 -- see useBootsplash's tick loop, which owns the interval and
 * the CAP; this function is pure given the accumulator value.
 *
 * `waiting`: true while source!=='config' and the endpoint fetch hasn't resolved --
 * the curve ceilings at 72% and re-bases (`waitBase`) once the fetch lands so the
 * final ramp to 100 stays smooth instead of snapping.
 */
export function progressCurve(args: {
  acc: number;
  prevPct: number;
  waiting: boolean;
  waitBase: number;
  durationMs: number;
}): { pct: number; waitBase: number } {
  const { acc, prevPct, waiting, durationMs } = args;
  let waitBase = args.waitBase;
  let ceil: number;
  let curve: number;
  if (waiting) {
    ceil = 72;
    curve = 72 * easeOutCubic(Math.min(1, acc / durationMs));
    waitBase = -1;
  } else {
    if (waitBase < 0) waitBase = acc;
    ceil = 100;
    curve = prevPct + (100 - prevPct) * easeOutCubic(Math.min(1, (acc - waitBase) / 600));
  }
  return { pct: Math.min(ceil, Math.max(prevPct, curve)), waitBase };
}

export interface TaskAdvanceResult {
  nodeState: Record<string, NodeStatus>;
  stepTimes: Record<string, number>;
  stats: Record<string, number>;
  started: string[];
  finished: string[];
}

/**
 * Recomputes every leaf's status as progress crosses its threshold, and folds in
 * `add` stat increments for newly-finished leaves. Pure: takes the PREVIOUS
 * nodeState/stepTimes/stats and returns new ones plus which ids just transitioned,
 * so the caller can fire onTaskStart/onTaskDone without the function itself having
 * side effects.
 */
export function advanceTasks(
  pct: number,
  tasks: BootTaskDef[],
  prev: { nodeState: Record<string, NodeStatus>; stepTimes: Record<string, number>; stats: Record<string, number> },
  elapsedMs: number,
): TaskAdvanceResult {
  const ls = leaves(tasks);
  const total = totalWeight(ls);
  const nodeState = { ...prev.nodeState };
  const stepTimes = { ...prev.stepTimes };
  const stats = { ...prev.stats };
  const started: string[] = [];
  const finished: string[] = [];

  let acc = 0;
  for (const t of ls) {
    const start = acc;
    acc += t.weight ?? 1;
    const thr = (acc / total) * 100;
    const startThr = (start / total) * 100;
    const prevStatus = prev.nodeState[t.id];
    const status: NodeStatus = pct >= thr - 0.5 ? 'done' : pct >= startThr - 0.5 ? 'running' : 'pending';
    if (status !== prevStatus) {
      nodeState[t.id] = status;
      if (status === 'running') started.push(t.id);
      if (status === 'done') {
        stepTimes[t.id] = elapsedMs;
        if (t.add) for (const k of Object.keys(t.add)) stats[k] = (stats[k] ?? 0) + t.add[k]!;
        finished.push(t.id);
      }
    }
  }
  return { nodeState, stepTimes, stats, started, finished };
}

/** Parent status is derived from its children: error > all-done > any-active > pending. */
export function statusMap(tasks: BootTaskDef[], leafState: Record<string, NodeStatus>): Record<string, NodeStatus> {
  const map: Record<string, NodeStatus> = {};
  const walk = (t: BootTaskDef): NodeStatus => {
    if (!t.children || t.children.length === 0) {
      const s = leafState[t.id] ?? 'pending';
      map[t.id] = s;
      return s;
    }
    const kids = t.children.map(walk);
    const s: NodeStatus = kids.includes('error') ? 'error' : kids.every((k) => k === 'done') ? 'done' : kids.includes('running') || kids.includes('done') ? 'running' : 'pending';
    map[t.id] = s;
    return s;
  };
  tasks.forEach(walk);
  return map;
}

/** Flattened leaves for the 'steps' variant's rolling log -- label only, no breadcrumb. */
export function logItemsSteps(tasks: BootTaskDef[]): Array<{ id: string; label: string; stat?: string }> {
  return leaves(tasks).map((t) => ({ id: t.id, label: t.label, stat: t.stat }));
}

/** Flattened leaves for the 'tree' variant's rolling log -- breadcrumb-prefixed label. */
export function logItemsTree(tasks: BootTaskDef[]): Array<{ id: string; label: string; stat?: string }> {
  const out: Array<{ id: string; label: string; stat?: string }> = [];
  const walk = (list: BootTaskDef[], parent: string) => {
    for (const t of list) {
      if (t.children && t.children.length) walk(t.children, t.label);
      else out.push({ id: t.id, label: parent ? `${parent} › ${t.label}` : t.label, stat: t.stat });
    }
  };
  walk(tasks, '');
  return out;
}

/** The visible window of the rolling log: keeps one finished item above the active one for continuity. */
export function logWindow(pct: number, len: number, maxVisible: number): { start: number; end: number; activeIndex: number } {
  const activeIndex = Math.min(len - 1, Math.floor(pct / (100 / (len || 1))));
  const start = Math.max(0, Math.min(activeIndex - 1, Math.max(0, len - maxVisible)));
  return { start, end: Math.min(len - 1, start + maxVisible - 1), activeIndex };
}

export function rowStatus(pct: number, index: number, len: number, isError: boolean): 'done' | 'active' | 'error' | '' {
  const startThr = (index / len) * 100;
  const thr = ((index + 1) / len) * 100;
  if (isError && pct >= startThr - 0.5 && pct < thr) return 'error';
  if (pct >= thr - 0.5) return 'done';
  if (pct >= startThr - 0.5) return 'active';
  return '';
}
