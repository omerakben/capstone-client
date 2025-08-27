"use client";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  getIdToken,
  onAuthStateChanged,
  signInWithEmailAndPassword,
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
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  getIdToken(force?: boolean): Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const auth = getFirebaseAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // cache last token to avoid redundant async lookups within short bursts
  const lastTokenRef = useRef<{ token: string; ts: number } | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, [auth]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      await signInWithEmailAndPassword(auth, email, password);
    },
    [auth]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      await createUserWithEmailAndPassword(auth, email, password);
    },
    [auth]
  );

  const signOut = useCallback(async () => {
    lastTokenRef.current = null;
    await fbSignOut(auth);
  }, [auth]);

  const getTokenCached = useCallback(
    async (force?: boolean): Promise<string | null> => {
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
    [user]
  );

  const value: AuthContextValue = {
    user,
    loading,
    signIn,
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
