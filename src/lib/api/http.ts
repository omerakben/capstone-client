import axios from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export const http = axios.create({ baseURL });

// Token injector (will be wired with AuthContext later)
export function attachAuth(getToken: () => Promise<string | null>) {
  http.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  http.interceptors.response.use(
    (r) => r,
    async (error) => {
      // Placeholder for refresh / sign-out logic implemented later
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
