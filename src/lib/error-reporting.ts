type ErrorReportOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type ErrorReportingHooks = {
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: ErrorReportOptions,
  ) => void;
};

declare global {
  interface Window {
    // Wire up a real provider (Sentry, Bugsnag, a custom endpoint, etc.) by
    // assigning to this before the app boots, e.g. in an inline script.
    __errorReportingHooks?: ErrorReportingHooks;
  }
}

/**
 * Reports a caught error to whatever telemetry hook is registered on
 * `window.__errorReportingHooks`. No-ops if nothing is registered, so this
 * is safe to call unconditionally from error boundaries and loaders.
 */
export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.__errorReportingHooks?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context,
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error",
    },
  );
}
