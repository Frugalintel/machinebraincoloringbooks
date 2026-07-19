/**
 * Lightweight logger utility for the application.
 * In production, this can be extended to send logs to external services like Sentry.
 * In development, it provides formatted console output.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogData {
  [key: string]: unknown;
}

const isDevelopment = process.env.NODE_ENV === "development";

function formatMessage(
  level: LogLevel,
  message: string,
  data?: LogData,
): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  return data
    ? `${prefix} ${message} ${JSON.stringify(data)}`
    : `${prefix} ${message}`;
}

export const logger = {
  /**
   * Log informational messages (only in development)
   */
  info: (message: string, data?: LogData): void => {
    if (isDevelopment && typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.info(formatMessage("info", message, data));
    }
  },

  /**
   * Log warning messages
   */
  warn: (message: string, data?: LogData): void => {
    if (isDevelopment && typeof window !== "undefined") {
      console.warn(formatMessage("warn", message, data));
    }
    // In production, warnings could be sent to monitoring service
  },

  /**
   * Log error messages - these are always logged and should be tracked
   */
  error: (message: string, error?: Error | unknown, data?: LogData): void => {
    const errorData = {
      ...data,
      ...(error instanceof Error
        ? { errorMessage: error.message, stack: error.stack }
        : { error }),
    };

    if (typeof window !== "undefined") {
      console.error(formatMessage("error", message, errorData));
    }

    // Future: Sentry.captureException(error, { extra: errorData });
    // if (!isDevelopment) {
    //   Sentry.captureException(error, { extra: errorData });
    // }
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (message: string, data?: LogData): void => {
    if (isDevelopment && typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.debug(formatMessage("debug", message, data));
    }
  },
};

export default logger;
