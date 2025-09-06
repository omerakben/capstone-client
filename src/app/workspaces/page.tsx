"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { WorkspaceCard } from "@/components/workspace-card";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

/**
 * Workspaces list page (placeholder implementation)
 *
 * TODO: Implement full workspaces list page with table view and filtering
 * This is a minimal implementation to satisfy type checking and routing
 */
function WorkspacesListContent() {
  const { workspaces, loading, error } = useWorkspaces();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Workspaces", current: true },
            ]}
          />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
              <p className="text-muted-foreground">
                Manage your development artifact collections
              </p>
            </div>
            <Button
              asChild
              variant="primarySoft"
              className="px-5 py-2 rounded-lg"
            >
              <Link href="/workspaces/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Workspace
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 mb-6">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {workspaces.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No workspaces yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first workspace to start organizing your development
              artifacts
            </p>
            <Button
              asChild
              variant="primarySoft"
              className="px-5 py-2 rounded-lg"
            >
              <Link href="/workspaces/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Workspace
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkspacesListPage() {
  return (
    <AuthGuard>
      <WorkspacesListContent />
    </AuthGuard>
  );
}
