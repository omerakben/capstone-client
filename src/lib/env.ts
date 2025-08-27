// Centralized environment variable helpers for the frontend.
// Throws early in development if required vars are missing.

const REQUIRED_PUBLIC_VARS = [
  "NEXT_PUBLIC_API_BASE_URL",
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

export function validatePublicEnv(): string[] {
  const missing = REQUIRED_PUBLIC_VARS.filter((k) => !process.env[k]);
  // In production build we only log; Next.js inlining may remove undefineds if not referenced.
  if (missing.length && process.env.NODE_ENV !== "production") {
    console.warn("[env] Missing public env vars:", missing.join(", "));
  }
  return missing;
}

export function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return val;
}
