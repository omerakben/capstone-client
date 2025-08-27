import axios from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export const http = axios.create({ baseURL });

// Token injector and response interceptor setup
let signOutCallback: (() => Promise<void>) | null = null;

export function attachAuth(
  getToken: () => Promise<string | null>,
  signOut?: () => Promise<void>
) {
  // Store signOut callback for 401 handling
  if (signOut) {
    signOutCallback = signOut;
  }

  http.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
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
          const freshToken = await getToken();
          if (!freshToken) {
            // No token available, sign out
            await signOutCallback();
            return Promise.reject(normalizeError(error));
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

      return Promise.reject(normalizeError(error));
    }
  );
}

export interface NormalizedError {
  code: string;
  message: string;
  details?: unknown;
}

function normalizeError(err: unknown): NormalizedError {
  const maybe = err as {
    response?: { data?: Record<string, unknown>; status?: number };
    request?: unknown;
    message?: string;
  };
  const data = maybe.response?.data as
    | {
        code?: string | number;
        message?: string;
        detail?: string;
        errors?: unknown;
      }
    | undefined;
  if (maybe.response) {
    return {
      code: String(data?.code ?? maybe.response.status ?? "ERROR"),
      message: data?.message || data?.detail || "Unexpected error",
      details: data?.errors || data?.detail || undefined,
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
