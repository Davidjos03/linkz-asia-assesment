type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  message: string;
  meta?: Record<string, unknown>;
}

const logs: LogEntry[] = [];
const MAX_LOGS = 500;

function write(level: LogLevel, event: string, message: string, meta?: Record<string, unknown>): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    message,
    meta,
  };

  logs.unshift(entry);
  if (logs.length > MAX_LOGS) {
    logs.pop();
  }

  const line = `[${entry.timestamp}] ${level.toUpperCase()} ${event}: ${message}`;
  if (level === 'error') {
    console.error(line, meta ?? '');
  } else if (level === 'warn') {
    console.warn(line, meta ?? '');
  } else {
    console.log(line, meta ?? '');
  }
}

export const logger = {
  info: (event: string, message: string, meta?: Record<string, unknown>) =>
    write('info', event, message, meta),
  warn: (event: string, message: string, meta?: Record<string, unknown>) =>
    write('warn', event, message, meta),
  error: (event: string, message: string, meta?: Record<string, unknown>) =>
    write('error', event, message, meta),
  debug: (event: string, message: string, meta?: Record<string, unknown>) =>
    write('debug', event, message, meta),
  getRecent: (limit = 100): LogEntry[] => logs.slice(0, limit),
};

export type { LogEntry };
