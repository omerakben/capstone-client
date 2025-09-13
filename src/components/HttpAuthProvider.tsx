"use client";

import { useAuth } from "@/contexts/AuthContext";
import { attachAuth } from "@/lib/api/http";
import { useEffect, useRef } from "react";

/**
 * Component that wires up HTTP client authentication with AuthContext
 * Should be mounted once under AuthProvider to initialize axios interceptors
 */
export function HttpAuthProvider({ children }: { children: React.ReactNode }) {
  const { getIdToken, signOut, loading, configError } = useAuth();
  const attachedRef = useRef(false);

  useEffect(() => {
    if (attachedRef.current) return;
    if (loading) return; // wait for auth init
    if (configError) return; // don't attach if config broken
    attachAuth(getIdToken, signOut);
    attachedRef.current = true;
  }, [getIdToken, signOut, loading, configError]);

  return <>{children}</>;
}
