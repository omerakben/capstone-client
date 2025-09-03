"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceCard } from "@/components/workspace-card";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { Database, FileText, PlusCircle, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/**
 * Dashboard page - main entry point after authentication
 *
 * Features:
 * - Recent workspaces grid
 * - Global search with debouncing
 * - Quick Actions sidebar
 * - Environment-aware workspace display
 */
function DashboardContent() {
  const { user } = useAuth();
  const { workspaces, loading, error, refetch } = useWorkspaces();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter workspaces based on search query - ensure workspaces is array
  const filteredWorkspaces = (
    Array.isArray(workspaces) ? workspaces : []
  ).filter(
    (workspace) =>
      workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workspace.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back{user?.displayName ? `, ${user.displayName}` : ""}
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your development artifacts across environments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild>
                <Link href="/workspaces/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Workspace
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Search bar */}
            <div className="mb-8">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search workspaces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Workspaces grid */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Your Workspaces
                </h2>
                {Array.isArray(workspaces) && workspaces.length > 0 && (
                  <Button variant="outline" size="sm" onClick={refetch}>
                    Refresh
                  </Button>
                )}
              </div>

              {/* Loading state */}
              {loading && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-48 animate-pulse rounded-lg bg-muted"
                    />
                  ))}
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center">
                  <p className="text-destructive font-medium">
                    Failed to load workspaces
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refetch}
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {/* Empty state */}
              {!loading &&
                !error &&
                filteredWorkspaces.length === 0 &&
                (!Array.isArray(workspaces) || workspaces.length === 0) && (
                  <div className="text-center py-12">
                    <Database className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold">
                      No workspaces yet
                    </h3>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                      Create your first workspace to start organizing your
                      development artifacts
                    </p>
                    <Button asChild className="mt-6">
                      <Link href="/workspaces/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Workspace
                      </Link>
                    </Button>
                  </div>
                )}

              {/* No search results */}
              {!loading &&
                !error &&
                filteredWorkspaces.length === 0 &&
                Array.isArray(workspaces) &&
                workspaces.length > 0 && (
                  <div className="text-center py-12">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold">
                      No workspaces found
                    </h3>
                    <p className="text-muted-foreground mt-2">
                      Try adjusting your search query
                    </p>
                  </div>
                )}

              {/* Workspaces grid */}
              {!loading && !error && filteredWorkspaces.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredWorkspaces.map((workspace) => (
                    <WorkspaceCard key={workspace.id} workspace={workspace} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link href="/workspaces/new">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      New Workspace
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link href="/docs">
                      <FileText className="mr-2 h-4 w-4" />
                      Browse Docs
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Stats overview */}
              {Array.isArray(workspaces) && workspaces.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-4">Overview</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total Workspaces
                      </span>
                      <span className="font-medium">{workspaces.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total Artifacts
                      </span>
                      <span className="font-medium">
                        {workspaces.reduce((sum, w) => {
                          const count = w.artifact_counts
                            ? Object.values(w.artifact_counts).reduce(
                                (s, c) => s + c,
                                0
                              )
                            : 0;
                          return sum + count;
                        }, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard page with authentication guard
 */
export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
