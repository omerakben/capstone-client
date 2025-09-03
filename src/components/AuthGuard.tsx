"use client";

import { useAuth } from "@/contexts/AuthContext";
import { redirect } from "next/navigation";
import { ReactNode, useEffect } from "react";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * AuthGuard wrapper component for protected pages
 *
 * Shows loading state while checking authentication
 * Redirects to login if user is not authenticated
 * Renders children if user is authenticated
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Only redirect after loading is complete and no user
    if (!loading && !user) {
      redirect("/login");
    }
  }, [user, loading]);

  // Show loading state while checking auth
  if (loading) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                Loading...
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Verifying authentication...
            </p>
          </div>
        </div>
      )
    );
  }

  // Don't render anything if not authenticated (redirect will happen)
  if (!user) {
    return null;
  }

  // User is authenticated, render protected content
  return <>{children}</>;
}
