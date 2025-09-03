"use client";

import { listWorkspaces, Workspace } from "@/lib/api/workspaces";
import { useEffect, useState } from "react";

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
 */
export function useWorkspaces(): UseWorkspacesResult {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch workspaces";
      setError(message);
      console.error("Error fetching workspaces:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  return {
    workspaces,
    loading,
    error,
    refetch: fetchWorkspaces,
  };
}
