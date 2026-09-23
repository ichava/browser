// Structured logger (plan Part E). Leveled + namespaced channels, a ring buffer,
// and sinks: the browser console (gated by the resolved level) + subscribers (the
// DevTools "Logs" tab). Replaces ad-hoc console.* so a production build stays quiet
// unless debug is explicitly enabled. LOGIC only — no `any`.

import type { AppConfig, LogLevel } from './config';
import { resolveMode, isDebugEnabled } from './env';

export type { LogLevel };
export type LogChannel = 'boot' | 'api' | 'store' | 'devtools' | 'motion' | 'auth' | 'app';

export interface LogEntry {
  ts: number;
  level: Exclude<LogLevel, 'silent'>;
  channel: LogChannel;
  message: string;
  data?: unknown;
}

const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

type Sub = (e: LogEntry) => void;


class Logger {
  private level: LogLevel = 'debug';
  private cap = 300;
  private buf: LogEntry[] = [];
  private subs = new Set<Sub>();

  /** Apply the resolved level + buffer cap once config is known. */
  configure(config?: Pick<AppConfig, 'env' | 'debug' | 'features' | 'limits'> | null): void {
    if (config?.limits?.logBuffer) this.cap = config.limits.logBuffer;
    const configured = config?.debug?.logLevel;
    if (configured) this.level = configured;
    else this.level = isDebugEnabled(config) ? 'debug' : resolveMode(config) === 'production' ? 'warn' : 'debug';
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
  getLevel(): LogLevel {
    return this.level;
  }

  subscribe(fn: Sub): () => void {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }

  buffer(): readonly LogEntry[] {
    return this.buf;
  }
  clear(): void {
    this.buf = [];
  }

  private write(level: Exclude<LogLevel, 'silent'>, channel: LogChannel, message: string, data?: unknown): void {
    const entry: LogEntry = { ts: Date.now(), level, channel, message, data };
    // ring buffer regardless of level so the DevTools Logs tab can show everything
    this.buf.push(entry);
    if (this.buf.length > this.cap) this.buf.splice(0, this.buf.length - this.cap);
    this.subs.forEach((fn) => {
      try {
        fn(entry);
      } catch {
        /* isolate sink errors */
      }
    });
    if (ORDER[level] >= ORDER[this.level] && this.level !== 'silent') {
      const tag = `[ichava:${channel}]`;
      const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : level === 'info' ? console.info : console.debug;
      if (data !== undefined) fn(tag, message, data);
      else fn(tag, message);
    }
  }

  debug(channel: LogChannel, message: string, data?: unknown): void {
    this.write('debug', channel, message, data);
  }
  info(channel: LogChannel, message: string, data?: unknown): void {
    this.write('info', channel, message, data);
  }
  warn(channel: LogChannel, message: string, data?: unknown): void {
    this.write('warn', channel, message, data);
  }
  error(channel: LogChannel, message: string, data?: unknown): void {
    this.write('error', channel, message, data);
  }
}

export const logger = new Logger();
