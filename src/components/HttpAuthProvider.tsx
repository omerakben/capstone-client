"use client";

import { useAuth } from "@/contexts/AuthContext";
import { attachAuth } from "@/lib/api/http";
import { useEffect } from "react";

/**
 * Component that wires up HTTP client authentication with AuthContext
 * Should be mounted once under AuthProvider to initialize axios interceptors
 */
export function HttpAuthProvider({ children }: { children: React.ReactNode }) {
  const { getIdToken, signOut } = useAuth();

  useEffect(() => {
    // Wire up the HTTP client with Firebase authentication
    attachAuth(getIdToken, signOut);

    // Response interceptor now handles 401 errors by attempting token refresh
    // and calling signOut() when token refresh fails
  }, [getIdToken, signOut]);

  return <>{children}</>;
}
