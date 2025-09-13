"use client";
import { validatePublicEnv } from "@/lib/env";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  getIdToken,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  User,
} from "firebase/auth";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configError: string | null;
  missingEnv: string[];
  signIn(email: string, password: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signUp(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  getIdToken(force?: boolean): Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Env validation first
  const missingEnv = validatePublicEnv();
  const [configError, setConfigError] = useState<string | null>(
    missingEnv.length
      ? `Missing required public env vars: ${missingEnv.join(", ")}`
      : null
  );

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const lastTokenRef = useRef<{ token: string; ts: number } | null>(null);

  useEffect(() => {
    if (configError) {
      // Skip Firebase initialization entirely
      setLoading(false);
      return;
    }
    let unsub: (() => void) | null = null;
    try {
      const auth = getFirebaseAuth();
      unsub = onAuthStateChanged(auth, (u) => {
        if (process.env.NODE_ENV !== "production") {
          console.debug(
            "Auth state changed:",
            u ? `User: ${u.uid}` : "User signed out"
          );
        }
        setUser(u);
        setLoading(false);
      });
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e && "message" in e
          ? String((e as { message?: unknown }).message)
          : "Failed to initialize authentication";
      setConfigError(msg);
      setLoading(false);
    }
    return () => {
      if (unsub) unsub();
    };
  }, [configError]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (configError) throw new Error(configError);
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
    },
    [configError]
  );

  const signInWithGoogle = useCallback(async () => {
    if (configError) throw new Error(configError);
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");
    await signInWithPopup(auth, provider);
  }, [configError]);

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (configError) throw new Error(configError);
      const auth = getFirebaseAuth();
      await createUserWithEmailAndPassword(auth, email, password);
    },
    [configError]
  );

  const signOut = useCallback(async () => {
    lastTokenRef.current = null;
    if (configError) return; // nothing to sign out
    const auth = getFirebaseAuth();
    await fbSignOut(auth);
  }, [configError]);

  const getTokenCached = useCallback(
    async (force?: boolean): Promise<string | null> => {
      if (configError) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "Auth: Cannot get token due to config error:",
            configError
          );
        }
        return null;
      }
      if (!user) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Auth: Cannot get token - user not authenticated");
        }
        return null;
      }
      const now = Date.now();

      // Reduce cache time to 30 seconds to be more aggressive about refresh
      if (
        !force &&
        lastTokenRef.current &&
        now - lastTokenRef.current.ts < 30_000
      ) {
        if (process.env.NODE_ENV !== "production") {
          console.debug("Auth: Using cached token");
        }
        return lastTokenRef.current.token;
      }

      try {
        if (process.env.NODE_ENV !== "production") {
          console.debug("Auth: Fetching fresh token, force=", force);
        }
        // Always force refresh if cache is expired or force is requested
        const shouldForceRefresh =
          force ||
          !lastTokenRef.current ||
          now - lastTokenRef.current.ts > 50_000;
        const token = await getIdToken(user, shouldForceRefresh);
        if (token) {
          lastTokenRef.current = { token, ts: now };
          if (process.env.NODE_ENV !== "production") {
            console.debug("Auth: Successfully obtained token");
          }
        } else {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              "Auth: Failed to obtain token - getIdToken returned null"
            );
          }
        }
        return token;
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Failed to get Firebase token:", error);
        }
        // Clear cache on error
        lastTokenRef.current = null;
        return null;
      }
    },
    [user, configError]
  );

  const value: AuthContextValue = {
    user,
    loading,
    configError,
    missingEnv,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    getIdToken: getTokenCached,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
