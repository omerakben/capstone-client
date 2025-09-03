"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NewWorkspaceDialog } from "@/components/workspaces/NewWorkspaceDialog";
import { WorkspaceTable } from "@/components/workspaces/WorkspaceTable";
import { listWorkspaces, type Workspace } from "@/lib/api/workspaces";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewWorkspaceOpen, setIsNewWorkspaceOpen] = useState(false);

  // Fetch workspaces on mount
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await listWorkspaces();
        setWorkspaces(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load workspaces"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaces();
  }, []);

  // Filter workspaces based on search query
  const filteredWorkspaces = workspaces.filter(
    (workspace) =>
      workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (workspace.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ??
        false)
  );

  const handleWorkspaceCreated = (newWorkspace: Workspace) => {
    setWorkspaces((prev) => [newWorkspace, ...prev]);
    setIsNewWorkspaceOpen(false);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground">
            Manage your development environments and artifacts
          </p>
        </div>
        <Button onClick={() => setIsNewWorkspaceOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Workspace
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search workspaces..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Error State */}
      {error && (
        <Card className="p-6">
          <div className="text-center text-destructive">
            <p className="font-medium">Error loading workspaces</p>
            <p className="text-sm mt-1">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {/* Workspaces Table */}
      {!error && (
        <Card>
          <WorkspaceTable
            workspaces={filteredWorkspaces}
            isLoading={isLoading}
            onWorkspaceDeleted={(deletedId: number) => {
              setWorkspaces((prev) => prev.filter((w) => w.id !== deletedId));
            }}
          />
        </Card>
      )}

      {/* New Workspace Dialog */}
      <NewWorkspaceDialog
        open={isNewWorkspaceOpen}
        onOpenChange={setIsNewWorkspaceOpen}
        onWorkspaceCreated={handleWorkspaceCreated}
      />
    </div>
  );
}
