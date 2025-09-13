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
      if (configError) return null;
      if (!user) return null;
      const now = Date.now();
      if (
        !force &&
        lastTokenRef.current &&
        now - lastTokenRef.current.ts < 60_000
      ) {
        return lastTokenRef.current.token;
      }
      try {
        const token = await getIdToken(user, force);
        if (token) {
          lastTokenRef.current = { token, ts: now };
        }
        return token;
      } catch {
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
