"use client";

import { useAuth } from "@/contexts/AuthContext";
import { listWorkspaces, Workspace } from "@/lib/api/workspaces";
import { useCallback, useEffect, useState } from "react";

interface UseWorkspacesResult {
  workspaces: Workspace[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching and managing workspace data
 *
 * Provides workspaces list with loading and error states
 * Includes refetch capability for manual refresh
 * Only fetches data when user is authenticated
 */
export function useWorkspaces(): UseWorkspacesResult {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  const fetchWorkspaces = useCallback(async () => {
    // Don't fetch if user is not authenticated
    if (!user) {
      setWorkspaces([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await listWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch workspaces";
      setError(message);
      if (process.env.NODE_ENV !== "production") {
        console.error("Error fetching workspaces:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Wait for auth to be ready before attempting to fetch
    if (authLoading) return;

    fetchWorkspaces();
  }, [fetchWorkspaces, authLoading]); // Re-fetch when user authentication state changes

  return {
    workspaces,
    loading: loading || authLoading, // Show loading if either data or auth is loading
    error,
    refetch: fetchWorkspaces,
  };
}
