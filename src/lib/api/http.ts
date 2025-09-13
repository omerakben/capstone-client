import axios from "axios";

// Ensure versioned API path matches backend (which exposes /api/v1/...)
const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export const http = axios.create({ baseURL });

// Token injector and response interceptor setup
let signOutCallback: (() => Promise<void>) | null = null;

export function attachAuth(
  getToken: (force?: boolean) => Promise<string | null>,
  signOut?: () => Promise<void>
) {
  // Store signOut callback for 401 handling
  if (signOut) {
    signOutCallback = signOut;
  }

  http.interceptors.request.use(async (config) => {
    const token = await getToken(false); // Don't force on regular requests
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Log when requests are made without authentication (dev only)
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "Making API request without authentication token:",
          config.url
        );
      }
    }
    return config;
  });

  http.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Handle 401 Unauthorized errors
      if (error.response?.status === 401 && signOutCallback) {
        try {
          // Try to get a fresh token first
          const freshToken = await getToken(true); // Force refresh for 401
          if (!freshToken) {
            // No token available, sign out
            await signOutCallback();
            const norm = normalizeError(error);
            const err = Object.assign(new Error(norm.message), norm);
            return Promise.reject(err);
          }

          // Retry the original request with fresh token
          const originalRequest = error.config;
          if (originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;
            originalRequest.headers.Authorization = `Bearer ${freshToken}`;
            return http(originalRequest);
          }
        } catch {
          // Token refresh failed, sign out user
          await signOutCallback();
        }
      }

      // Handle 403: attach a fresh token and retry once (covers CSRF fallback and races)
      if (error.response?.status === 403) {
        try {
          const originalRequest = error.config || {};
          // Avoid infinite loop
          if (originalRequest._retry403) {
            const norm = normalizeError(error);
            const err = Object.assign(new Error(norm.message), norm);
            return Promise.reject(err);
          }

          // Force refresh token for 403 errors
          const freshToken = await getToken(true); // Force refresh
          if (freshToken) {
            originalRequest._retry403 = true;
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${freshToken}`;
            return http(originalRequest);
          } else {
            // No token available, sign out if we have a callback
            if (signOutCallback) {
              await signOutCallback();
            }
          }
        } catch (refreshError) {
          if (process.env.NODE_ENV !== "production") {
            console.error(
              "Token refresh failed during 403 retry:",
              refreshError
            );
          }
          // If we have signOut callback, use it
          if (signOutCallback) {
            await signOutCallback();
          }
        }
      }

      const norm = normalizeError(error);
      const err = Object.assign(new Error(norm.message), norm);
      return Promise.reject(err);
    }
  );
}

export interface NormalizedError {
  code: string;
  message: string;
  details?: unknown;
}

type ErrorData =
  | {
      code?: string | number;
      message?: string;
      detail?: string;
      errors?: Record<string, unknown> | string;
      [key: string]: unknown;
    }
  | undefined;

function normalizeError(err: unknown): NormalizedError {
  const maybe = err as {
    response?: { data?: unknown; status?: number };
    request?: unknown;
    message?: string;
  };
  const data = (maybe.response?.data ?? undefined) as ErrorData;

  // Helper: extract a useful message from DRF/validation shapes
  const extractMessage = (payload: ErrorData | unknown): string | undefined => {
    if (!payload || typeof payload !== "object") return undefined;
    const obj = payload as Record<string, unknown>;
    if (typeof obj.message === "string" && obj.message) return obj.message;
    if (typeof obj.detail === "string" && obj.detail) return obj.detail;
    const errs = obj.errors as Record<string, unknown> | undefined;
    if (errs && typeof errs === "object") {
      const firstKey = Object.keys(errs)[0];
      const val = firstKey ? errs[firstKey] : undefined;
      if (Array.isArray(val) && val.length > 0) return String(val[0]);
      if (typeof val === "string") return val;
    }
    // Flatten field errors e.g. { field: ["msg"] }
    const key = Object.keys(obj)[0];
    const v = key ? obj[key] : undefined;
    if (Array.isArray(v) && v.length > 0) return String(v[0]);
    if (typeof v === "string") return v;
    return undefined;
  };

  if (maybe.response) {
    const message = extractMessage(data) || "Unexpected error";
    const known = (data || {}) as {
      code?: string | number;
      detail?: string;
      errors?: Record<string, unknown> | string;
    };
    return {
      code: String(known.code ?? maybe.response.status ?? "ERROR"),
      message,
      details: known.errors || known.detail || data || undefined,
    };
  }
  if (maybe.request) {
    return {
      code: "NETWORK_ERROR",
      message: "Network error verify connectivity",
    };
  }
  return { code: "UNKNOWN", message: maybe.message || "Unknown error" };
}
