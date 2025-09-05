"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { getWorkspace } from "@/lib/api/workspaces";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Workspace detail page (placeholder implementation)
 *
 * TODO: Implement full workspace detail page with environment tabs and artifacts table
 * This is a minimal implementation to satisfy type checking and routing
 */
function WorkspaceDetailContent() {
  const params = useParams();
  const workspaceId = parseInt(params.id as string, 10);
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        setIsLoading(true);
        const workspace = await getWorkspace(workspaceId);
        setWorkspaceName(workspace.name);
      } catch (error) {
        console.error("Failed to load workspace:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (workspaceId) {
      loadWorkspace();
    }
  }, [workspaceId]);

  if (isLoading) {
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {workspaceName}
                </h1>
                <p className="text-muted-foreground">Workspace Details</p>
              </div>
            </div>
            <Button asChild>
              <Link href={`/w/${workspaceId}/new`}>Create Artifact</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Workspace Detail Page</h3>
          <p className="text-muted-foreground mb-6">
            This is a placeholder workspace detail page. Full implementation
            coming soon.
          </p>
          <Button asChild>
            <Link href={`/w/${workspaceId}/new`}>Create New Artifact</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceDetailPage() {
  return (
    <AuthGuard>
      <WorkspaceDetailContent />
    </AuthGuard>
  );
}
