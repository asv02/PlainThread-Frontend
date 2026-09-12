type LogLevel = "debug" | "info" | "error";

const rank: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  error: 30,
};

function activeLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ?? "").toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "error") return raw;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function emit(level: LogLevel, scope: string, message: string, extra?: Record<string, unknown>) {
  if (rank[level] < rank[activeLevel()]) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    scope,
    message,
    ...(extra && Object.keys(extra).length > 0 ? { extra } : {}),
  };
  const text = JSON.stringify(line);
  if (level === "error") console.error(text);
  else if (level === "info") console.info(text);
  else console.debug(text);
}

export const log = {
  debug(scope: string, message: string, extra?: Record<string, unknown>) {
    emit("debug", scope, message, extra);
  },
  info(scope: string, message: string, extra?: Record<string, unknown>) {
    emit("info", scope, message, extra);
  },
  error(scope: string, message: string, extra?: Record<string, unknown>) {
    emit("error", scope, message, extra);
  },
};

export function errMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
