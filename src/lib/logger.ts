type LogLevel = "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

const SENSITIVE_KEY_PATTERN =
  /(password|passwd|secret|token|jwt|authorization|cookie|api[_-]?key|api[_-]?secret|database_url|hash|session|credential|invite[_-]?code|\bsig\b)/i;

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === "object") {
    return sanitize(value as LogFields) ?? {};
  }

  return value;
}

/** Exported for unit tests. */
export function sanitize(fields?: LogFields): LogFields | undefined {
  if (!fields) {
    return undefined;
  }

  const cleaned: LogFields = {};

  for (const [key, value] of Object.entries(fields)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      cleaned[key] = "[redacted]";
      continue;
    }
    cleaned[key] = sanitizeValue(value);
  }

  return cleaned;
}

function write(level: LogLevel, message: string, fields?: LogFields): void {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...sanitize(fields),
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}

export const logger = {
  info(message: string, fields?: LogFields) {
    write("info", message, fields);
  },
  warn(message: string, fields?: LogFields) {
    write("warn", message, fields);
  },
  error(message: string, fields?: LogFields) {
    write("error", message, fields);
  },
};
