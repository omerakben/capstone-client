"use client";

import { EnvironmentBadge } from "@/components/ui/environment-badge";
import { type Workspace } from "@/lib/api/workspaces";
import { type EnvCode } from "@/types";

interface EnvironmentBadgesProps {
  workspace: Workspace;
}

export function EnvironmentBadges({ workspace }: EnvironmentBadgesProps) {
  const { artifact_counts = {} } = workspace;

  const environments: { key: string; code: EnvCode }[] = [
    { key: "DEV", code: "DEV" },
    { key: "STAGING", code: "STAGING" },
    { key: "PROD", code: "PROD" },
  ];

  const activeEnvironments = environments.filter(
    (env) => (artifact_counts[env.key] || 0) > 0
  );

  if (activeEnvironments.length === 0) {
    return <span className="text-sm text-muted-foreground">No artifacts</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {activeEnvironments.map((env) => (
        <EnvironmentBadge key={env.key} environment={env.code} size="sm" />
      ))}
    </div>
  );
}
