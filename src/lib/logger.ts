type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const isDev = import.meta.env.DEV

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }
const MIN_LEVEL: LogLevel = isDev ? 'debug' : 'warn'

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[MIN_LEVEL]
}

function timestamp(): string {
  return new Date().toISOString().slice(11, 23) // HH:mm:ss.ms
}

function format(level: LogLevel, context: string, message: string): string {
  return `[${timestamp()}] [${level.toUpperCase()}] [${context}] ${message}`
}

function makeLogger(context: string) {
  return {
    debug(message: string, data?: unknown) {
      if (!shouldLog('debug')) return
      data !== undefined
        ? console.debug(format('debug', context, message), data)
        : console.debug(format('debug', context, message))
    },
    info(message: string, data?: unknown) {
      if (!shouldLog('info')) return
      data !== undefined
        ? console.info(format('info', context, message), data)
        : console.info(format('info', context, message))
    },
    warn(message: string, data?: unknown) {
      if (!shouldLog('warn')) return
      data !== undefined
        ? console.warn(format('warn', context, message), data)
        : console.warn(format('warn', context, message))
    },
    error(message: string, err?: unknown) {
      if (!shouldLog('error')) return
      if (err instanceof Error) {
        console.error(format('error', context, message), {
          name: err.name,
          message: err.message,
          // Supabase errors carry a `status` and `code` field
          ...(err as unknown as Record<string, unknown>),
        })
      } else if (err !== undefined) {
        console.error(format('error', context, message), err)
      } else {
        console.error(format('error', context, message))
      }
    },
  }
}

export const logger = { for: makeLogger }
