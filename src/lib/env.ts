// Centralized environment variable helpers for the frontend.
// Throws early in development if required vars are missing.

export function validatePublicEnv(): string[] {
  // Next.js inlines NEXT_PUBLIC_ env vars at build time, so direct reference works but dynamic access doesn't
  const envValues = {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const missing = Object.entries(envValues)
    .filter(([, value]) => !value)
    .map(([key]) => key);

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
