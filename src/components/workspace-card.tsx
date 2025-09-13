import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnvironmentBadge } from "@/components/ui/environment-badge";
import { Workspace } from "@/lib/api/workspaces";
import { cn } from "@/lib/utils";
import { EnvCode } from "@/types";
import { ArrowUpRight, FolderOpen } from "lucide-react";
import Link from "next/link";

interface WorkspaceCardProps {
  workspace: Workspace;
  className?: string;
}

/**
 * Workspace card component for dashboard display
 *
 * Shows workspace info with environment badges and quick actions
 * Inspired by modern card patterns with hover states
 */
export function WorkspaceCard({ workspace, className }: WorkspaceCardProps) {
  // Narrow workspace shape for environments (optional if not returned by API version)
  const ws = workspace as Workspace & {
    workspace_environments?: Array<{ environment_type?: { slug?: string } }>;
  };
  let environments: EnvCode[] = (ws.workspace_environments || [])
    .map(
      (we: { environment_type?: { slug?: string } }) =>
        we.environment_type?.slug
    )
    .filter(
      (s: string | undefined): s is EnvCode =>
        !!s && ["DEV", "STAGING", "PROD"].includes(s as EnvCode)
    );
  // If API hasn't supplied specific environments yet (loading/legacy), show all for consistent card layout
  if (environments.length === 0) {
    environments = ["DEV", "STAGING", "PROD"];
  }
  const artifactCount = workspace.artifact_counts?.total ?? 0;

  return (
    <Card
      className={cn(
        "group relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-white/5",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold group-hover:text-primary">
              {workspace.name}
            </CardTitle>
            {workspace.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {workspace.description}
              </p>
            )}
          </div>
          <ArrowUpRight className="h-5 w-5 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Environment badges */}
        <div className="flex flex-wrap gap-2">
          {environments.map((env) => (
            <EnvironmentBadge key={env} environment={env} size="sm" />
          ))}
        </div>

        {/* Artifact count and last updated */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <FolderOpen className="h-4 w-4" />
            <span>{artifactCount} artifacts</span>
          </div>
          <span>
            Updated {new Date(workspace.updated_at).toLocaleDateString()}
          </span>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 pt-2 border-t border-dashed">
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="flex-1 gap-1 shadow-none"
          >
            <Link href={`/w/${workspace.id}`}>Open Workspace</Link>
          </Button>
        </div>
      </CardContent>

      {/* Invisible link overlay for card click */}
      <Link
        href={`/w/${workspace.id}`}
        className="absolute inset-0 z-10"
        aria-label={`Open ${workspace.name} workspace`}
      >
        <span className="sr-only">Open workspace</span>
      </Link>
    </Card>
  );
}
