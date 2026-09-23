import { describe, expect, it } from 'vitest';
import { advanceTasks, logWindow, progressCurve, rowStatus, statusMap } from './bootsplashEngine';
import type { BootTaskDef } from './bootsplashConfig';

const TASKS: BootTaskDef[] = [
  { id: 'a', label: 'A', children: [
    { id: 'a1', label: 'A1', weight: 1 },
    { id: 'a2', label: 'A2', weight: 1, add: { icons: 100 } },
  ] },
  { id: 'b', label: 'B', children: [
    { id: 'b1', label: 'B1', weight: 2 },
  ] },
];

describe('progressCurve', () => {
  it('ceilings at 72% while waiting on the endpoint', () => {
    const { pct } = progressCurve({ acc: 100_000, prevPct: 0, waiting: true, waitBase: -1, durationMs: 3400 });
    expect(pct).toBeLessThanOrEqual(72);
  });

  it('never regresses below the previous pct', () => {
    const { pct } = progressCurve({ acc: 0, prevPct: 40, waiting: false, waitBase: 0, durationMs: 3400 });
    expect(pct).toBeGreaterThanOrEqual(40);
  });

  it('rebases waitBase the first tick after the endpoint resolves, so the ramp to 100 does not snap', () => {
    // still waiting for a while, then the fetch lands (waiting: false) with a fresh waitBase of -1
    const first = progressCurve({ acc: 1000, prevPct: 50, waiting: false, waitBase: -1, durationMs: 3400 });
    expect(first.waitBase).toBe(1000); // rebased to the accumulator at the moment waiting flips off
    const second = progressCurve({ acc: 1100, prevPct: first.pct, waiting: false, waitBase: first.waitBase, durationMs: 3400 });
    expect(second.waitBase).toBe(1000); // held steady on subsequent ticks
    expect(second.pct).toBeGreaterThanOrEqual(first.pct);
  });

  it('reaches 100 once enough active time has accumulated past waitBase', () => {
    const { pct } = progressCurve({ acc: 10_000, prevPct: 90, waiting: false, waitBase: 0, durationMs: 3400 });
    expect(pct).toBe(100);
  });
});

describe('advanceTasks', () => {
  const empty = { nodeState: {}, stepTimes: {}, stats: {} };

  it('marks a leaf running once progress crosses its start threshold, done once it crosses its end threshold', () => {
    // weights: a1=1, a2=1, b1=2 -> total 4. a1 spans [0,25), a2 [25,50), b1 [50,100)
    const running = advanceTasks(10, TASKS, empty, 100);
    expect(running.nodeState.a1).toBe('running');
    expect(running.nodeState.a2).toBe('pending');

    const a1Done = advanceTasks(26, TASKS, empty, 100);
    expect(a1Done.nodeState.a1).toBe('done');
    expect(a1Done.nodeState.a2).toBe('running');
  });

  it('folds a leaf\'s `add` stats in exactly once, on the tick it transitions to done', () => {
    const step1 = advanceTasks(30, TASKS, empty, 100); // a2 not done yet
    expect(step1.stats.icons ?? 0).toBe(0);

    const step2 = advanceTasks(51, TASKS, step1, 200); // a2 crosses into done
    expect(step2.stats.icons).toBe(100);
    expect(step2.stepTimes.a2).toBe(200);

    // a third call with the SAME pct must not re-add the stat (status unchanged -> no transition)
    const step3 = advanceTasks(51, TASKS, step2, 300);
    expect(step3.stats.icons).toBe(100);
  });

  it('reports exactly the ids that transitioned, not every leaf', () => {
    const step1 = advanceTasks(10, TASKS, empty, 100);
    expect(step1.started).toEqual(['a1']);
    expect(step1.finished).toEqual([]);

    const step2 = advanceTasks(30, TASKS, step1, 200);
    expect(step2.started).toEqual(['a2']);
    expect(step2.finished).toEqual(['a1']);
  });
});

describe('statusMap', () => {
  it('derives a parent as done only when every child is done', () => {
    const leafState = { a1: 'done', a2: 'done', b1: 'pending' } as const;
    const map = statusMap(TASKS, leafState as never);
    expect(map.a).toBe('done');
    expect(map.b).toBe('pending');
  });

  it('derives a parent as running when any child is running or done but not all done', () => {
    const leafState = { a1: 'done', a2: 'running', b1: 'pending' } as const;
    const map = statusMap(TASKS, leafState as never);
    expect(map.a).toBe('running');
  });

  it('derives a parent as error if any child errored, even if others are done', () => {
    const leafState = { a1: 'done', a2: 'error', b1: 'pending' } as const;
    const map = statusMap(TASKS, leafState as never);
    expect(map.a).toBe('error');
  });
});

describe('logWindow', () => {
  it('keeps one already-done row above the active one for continuity', () => {
    // 10 items, maxVisible 4, active at index 5 -> window should start at 4 (5-1)
    const w = logWindow(55, 10, 4);
    expect(w.activeIndex).toBe(5);
    expect(w.start).toBe(4);
    expect(w.end).toBe(7);
  });

  it('never starts before 0 or scrolls past the last item', () => {
    const atStart = logWindow(0, 10, 4);
    expect(atStart.start).toBe(0);
    const atEnd = logWindow(100, 10, 4);
    expect(atEnd.end).toBe(9);
  });
});

describe('rowStatus', () => {
  it('reports error only for the row currently spanning the error point, not earlier or later ones', () => {
    // 4 items, error at pct 60 -> item index 2 spans [50,75)
    expect(rowStatus(60, 1, 4, true)).toBe('done');
    expect(rowStatus(60, 2, 4, true)).toBe('error');
    expect(rowStatus(60, 3, 4, true)).toBe('');
  });
});
