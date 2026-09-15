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

/** Numbered step logger for an API/payment request. Never put secrets in `extra`. */
export function startFlow(scope: string, extra?: Record<string, unknown>) {
  const started = Date.now();
  let step = 0;
  emit("info", scope, "start", extra);
  return {
    step(message: string, data?: Record<string, unknown>) {
      step += 1;
      emit("info", scope, message, { step, ...data });
    },
    debug(message: string, data?: Record<string, unknown>) {
      emit("debug", scope, message, { step, ...data });
    },
    done(message: string, data?: Record<string, unknown>) {
      emit("info", scope, message, { steps: step, ms: Date.now() - started, ...data });
    },
    fail(message: string, data?: Record<string, unknown>) {
      emit("error", scope, message, { steps: step, ms: Date.now() - started, ...data });
    },
  };
}

export function errMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
