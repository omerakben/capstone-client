"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  deleteArtifact,
  duplicateArtifactToEnvironment,
  listArtifacts,
} from "@/lib/api/artifacts";
import { getWorkspace } from "@/lib/api/workspaces";
import type { Artifact, EnvCode } from "@/types/artifacts";
import { ArrowLeft, Copy, Loader2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";

/**
 * Workspace detail page (placeholder implementation)
 *
 * TODO: Implement full workspace detail page with environment tabs and artifacts table
 * This is a minimal implementation to satisfy type checking and routing
 */
function WorkspaceDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const workspaceId = parseInt(params.id as string, 10);
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loadingArtifacts, setLoadingArtifacts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const currentEnv: EnvCode = useMemo(() => {
    const env = (searchParams.get("env") as EnvCode) || "DEV";
    return ["DEV", "STAGING", "PROD"].includes(env) ? env : "DEV";
  }, [searchParams]);

  // Load workspace meta
  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        setLoadingWorkspace(true);
        const workspace = await getWorkspace(workspaceId);
        setWorkspaceName(workspace.name);
      } catch (err) {
        console.error(err);
        setError("Failed to load workspace");
      } finally {
        setLoadingWorkspace(false);
      }
    };
    if (workspaceId) loadWorkspace();
  }, [workspaceId]);

  const fetchArtifacts = useCallback(async () => {
    try {
      setLoadingArtifacts(true);
      setError(null);
      const data = await listArtifacts({
        workspaceId,
        environment: currentEnv,
      });
      setArtifacts(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load artifacts");
    } finally {
      setLoadingArtifacts(false);
    }
  }, [workspaceId, currentEnv]);

  useEffect(() => {
    if (workspaceId) fetchArtifacts();
  }, [workspaceId, currentEnv, fetchArtifacts]);

  const onEnvChange = (env: EnvCode) => {
    const url = `/w/${workspaceId}?env=${env}`;
    router.replace(url);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this artifact?")) return;
    setActionLoading(id);
    try {
      await deleteArtifact(id);
      await fetchArtifacts();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async (artifact: Artifact) => {
    const targetEnv = prompt(
      "Duplicate to environment (DEV|STAGING|PROD):",
      "DEV"
    );
    if (!targetEnv) return;
    if (!["DEV", "STAGING", "PROD"].includes(targetEnv)) {
      alert("Invalid environment");
      return;
    }
    setActionLoading(artifact.id);
    try {
      await duplicateArtifactToEnvironment(
        workspaceId,
        artifact.id,
        targetEnv as EnvCode
      );
      await fetchArtifacts();
    } catch (err) {
      console.error(err);
      alert("Duplicate failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loadingWorkspace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {workspaceName}
                </h1>
                <p className="text-muted-foreground">
                  Artifacts ({currentEnv})
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href={`/w/${workspaceId}/new?env=${currentEnv}`}>
                New Artifact
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {error && <div className="mb-4 text-sm text-destructive">{error}</div>}
        <Tabs
          value={currentEnv}
          onValueChange={(v: string) => onEnvChange(v as EnvCode)}
        >
          <TabsList>
            <TabsTrigger value="DEV">DEV</TabsTrigger>
            <TabsTrigger value="STAGING">STAGING</TabsTrigger>
            <TabsTrigger value="PROD">PROD</TabsTrigger>
          </TabsList>
          <TabsContent value={currentEnv} className="mt-6">
            <Card>
              <CardContent className="p-0">
                {loadingArtifacts ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : artifacts.length === 0 ? (
                  <div className="py-16 text-center text-sm text-muted-foreground">
                    No artifacts in this environment.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-left">
                        <tr>
                          <th className="px-4 py-2 font-medium">Kind</th>
                          <th className="px-4 py-2 font-medium">Key / Title</th>
                          <th className="px-4 py-2 font-medium">Updated</th>
                          <th className="px-4 py-2 font-medium text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {artifacts.map((a) => (
                          <tr key={a.id} className="border-t last:border-b">
                            <td className="px-4 py-2 align-middle">{a.kind}</td>
                            <td className="px-4 py-2 align-middle">
                              {a.kind === "ENV_VAR" &&
                                (a as Artifact & { key: string }).key}
                              {a.kind === "PROMPT" &&
                                (a as Artifact & { title: string }).title}
                              {a.kind === "DOC_LINK" &&
                                (a as Artifact & { title: string }).title}
                            </td>
                            <td className="px-4 py-2 align-middle">
                              {new Date(a.updated_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 align-middle">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  title="Duplicate"
                                  disabled={actionLoading === a.id}
                                  onClick={() => handleDuplicate(a)}
                                >
                                  {actionLoading === a.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  title="Edit"
                                  asChild
                                >
                                  <Link href={`/artifacts/${a.id}/edit`}>
                                    <Pencil className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  title="Delete"
                                  disabled={actionLoading === a.id}
                                  onClick={() => handleDelete(a.id)}
                                >
                                  {actionLoading === a.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
