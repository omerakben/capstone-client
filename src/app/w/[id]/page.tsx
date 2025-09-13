"use client";
import {
  ArrowLeft,
  Check,
  Copy,
  Files,
  FileText,
  KeyRound,
  Layers,
  Loader2,
  MessageSquare,
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react";

import { AuthGuard } from "@/components/AuthGuard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
// Reveal dialog removed; keep only copy functionality
import { EnvironmentToggle } from "@/components/ui/environment-toggle";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteArtifact,
  duplicateArtifactToEnvironment,
  listArtifacts,
} from "@/lib/api/artifacts";
import { http } from "@/lib/api/http";
import {
  deleteWorkspace,
  getWorkspace,
  updateEnabledEnvironments,
  type Workspace,
} from "@/lib/api/workspaces";
import { ENV_COLORS } from "@/types";
import type {
  Artifact,
  ArtifactKind,
  EnvCode,
  EnvVarArtifact,
} from "@/types/artifacts";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
const ALL_ENVS = ["DEV", "STAGING", "PROD"] as const;
type EnvSlug = (typeof ALL_ENVS)[number];
type EnabledFormState = Record<EnvSlug, boolean>;

function WorkspaceDetailContent() {
  const { user } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const workspaceId = parseInt(params.id as string, 10);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loadingArtifacts, setLoadingArtifacts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  // Reveal dialog removed; copy remains
  const [copyingId, setCopyingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [kindFilter, setKindFilter] = useState<ArtifactKind | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [envForm, setEnvForm] = useState<EnabledFormState | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const currentEnv: EnvCode = useMemo(() => {
    const env = (searchParams.get("env") as EnvCode) || "DEV";
    return ["DEV", "STAGING", "PROD"].includes(env) ? env : "DEV";
  }, [searchParams]);

  // Load workspace meta (single-run in dev + gate on auth)
  const didLoadWorkspace = useRef(false);
  useEffect(() => {
    if (!user || !workspaceId || didLoadWorkspace.current) return;
    didLoadWorkspace.current = true;
    const loadWorkspace = async () => {
      try {
        setLoadingWorkspace(true);
        const ws = await getWorkspace(workspaceId);
        setWorkspace(ws);
        try {
          const enabled = (ws.enabled_environments?.map((e) => e.slug) ||
            ALL_ENVS) as EnvSlug[];
          setEnvForm({
            DEV: enabled.includes("DEV"),
            STAGING: enabled.includes("STAGING"),
            PROD: enabled.includes("PROD"),
          });
        } catch {}
      } catch (err) {
        console.error(err);
        setError("Failed to load workspace");
        // allow retry if it failed (e.g., first call without auth)
        didLoadWorkspace.current = false;
      } finally {
        setLoadingWorkspace(false);
      }
    };
    void loadWorkspace();
  }, [user, workspaceId]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchArtifacts = useCallback(async () => {
    try {
      setLoadingArtifacts(true);
      setError(null);
      const data = await listArtifacts({
        workspaceId,
        environment: currentEnv,
        ...(kindFilter !== "ALL" ? { kind: kindFilter } : {}),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      setArtifacts(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load artifacts");
    } finally {
      setLoadingArtifacts(false);
    }
  }, [workspaceId, currentEnv, debouncedSearch, kindFilter]);

  useEffect(() => {
    if (!user || !workspaceId) return;
    fetchArtifacts();
  }, [user, workspaceId, currentEnv, fetchArtifacts]);

  const onEnvChange = (env: EnvCode) => {
    const url = `/w/${workspaceId}?env=${env}`;
    router.replace(url);
  };

  const handleSaveEnabledEnvs = async () => {
    if (!envForm) return;
    const enabled = ALL_ENVS.filter((e) => envForm[e]);
    // Prevent saving empty set (must have at least one environment)
    if (enabled.length === 0) {
      alert("At least one environment must remain enabled.");
      return;
    }
    try {
      await updateEnabledEnvironments(workspaceId, Array.from(enabled));
      const ws = await getWorkspace(workspaceId);
      setWorkspace(ws);
      // Re-sync local envForm state from canonical server response
      try {
        const enabledSlugs = (ws.enabled_environments?.map((e) => e.slug) ||
          ALL_ENVS) as EnvSlug[];
        setEnvForm({
          DEV: enabledSlugs.includes("DEV"),
          STAGING: enabledSlugs.includes("STAGING"),
          PROD: enabledSlugs.includes("PROD"),
        });
        // If current environment no longer enabled, redirect to first available
        if (!enabledSlugs.includes(currentEnv)) {
          const fallback = (["DEV", "STAGING", "PROD"].find((s) =>
            enabledSlugs.includes(s as EnvSlug)
          ) || "DEV") as EnvCode;
          router.replace(`/w/${workspaceId}?env=${fallback}`);
        }
        // Refresh artifacts to reflect any environment enablement changes (counts, filters)
        void fetchArtifacts();
      } catch {}
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1400);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to update environments";
      alert(msg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this artifact?")) return;
    setActionLoading(id);
    try {
      await deleteArtifact(workspaceId, id);
      await fetchArtifacts();
      try {
        const ws = await getWorkspace(workspaceId);
        setWorkspace(ws);
      } catch {}
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
      try {
        const ws = await getWorkspace(workspaceId);
        setWorkspace(ws);
      } catch {}
    } catch (err) {
      console.error(err);
      alert("Duplicate failed");
    } finally {
      setActionLoading(null);
    }
  };

  const fetchEnvVarDetail = async (artifactId: number) => {
    const { data } = await http.get<EnvVarArtifact & { value: string }>(
      `/workspaces/${workspaceId}/artifacts/${artifactId}/reveal_value/`
    );
    return data as EnvVarArtifact;
  };

  const handleCopy = async (artifact: Artifact) => {
    if (artifact.kind !== "ENV_VAR") return;
    setCopyingId(artifact.id);
    try {
      const env = await fetchEnvVarDetail(artifact.id);
      try {
        await navigator.clipboard.writeText(env.value ?? "");
      } catch {
        // Fallback for environments where Clipboard API isn't available/allowed
        const ta = document.createElement("textarea");
        ta.value = env.value ?? "";
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedId(artifact.id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch (err) {
      console.error(err);
      const maybe = err as { message?: string };
      alert(maybe?.message || "Copy failed");
    } finally {
      setCopyingId(null);
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
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Workspaces", href: "/workspaces" },
              { label: workspace?.name || "Workspace", current: true },
            ]}
          />
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {workspace?.name}
                </h1>
                <p className="text-muted-foreground">
                  Artifacts (
                  <span className={ENV_COLORS[currentEnv].text}>
                    {currentEnv}
                  </span>
                  )
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                className="px-4 py-2 rounded-lg"
                onClick={async () => {
                  if (!confirm("Delete this workspace and all artifacts?"))
                    return;
                  try {
                    await deleteWorkspace(workspaceId);
                    router.push("/workspaces");
                  } catch {
                    alert("Delete workspace failed");
                  }
                }}
              >
                Delete Workspace
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {error && <div className="mb-4 text-sm text-destructive">{error}</div>}
        <div className="mb-4 max-w-md">
          <Input
            placeholder="Search artifacts (key, title, content, notes, url)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Enabled Environments mini-form */}
        <div className="mb-4 p-3 border rounded-lg">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Environments:
            </span>
            {envForm &&
              ALL_ENVS.map((slug) => (
                <EnvironmentToggle
                  key={slug}
                  env={slug}
                  size="sm"
                  checked={envForm[slug]}
                  onChange={(next) =>
                    setEnvForm((prev) =>
                      prev ? { ...prev, [slug]: next } : prev
                    )
                  }
                />
              ))}
            {(() => {
              const original = new Set(
                (workspace?.enabled_environments || []).map((e) => e.slug)
              );
              const current = new Set(
                envForm ? ALL_ENVS.filter((e) => envForm[e]) : ALL_ENVS
              );
              const isDirty =
                original.size !== current.size ||
                ALL_ENVS.some((e) => original.has(e) !== current.has(e));
              return (
                <Button
                  size="sm"
                  variant={isDirty ? "default" : "outline"}
                  className={
                    "relative h-7 px-4 text-foreground transition-colors border-black dark:border-neutral-300 " +
                    (isDirty
                      ? "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                      : "hover:bg-muted/70")
                  }
                  onClick={handleSaveEnabledEnvs}
                  disabled={!envForm || !isDirty}
                >
                  {savedFlash && !isDirty
                    ? "Saved"
                    : isDirty
                    ? "Save"
                    : "Saved"}
                </Button>
              );
            })()}
          </div>
        </div>
        {/* Type filter chips */}
        <div className="mb-2 flex flex-wrap gap-2 items-center">
          {(
            [
              { code: "ALL", label: "All", icon: Layers },
              { code: "ENV_VAR", label: "Env Vars", icon: KeyRound },
              { code: "PROMPT", label: "Prompts", icon: MessageSquare },
              { code: "DOC_LINK", label: "Docs", icon: FileText },
            ] as Array<{
              code: ArtifactKind | "ALL";
              label: string;
              icon: React.ComponentType<{ className?: string }>;
            }>
          ).map((opt) => {
            const ActiveIcon = opt.icon;
            const active = kindFilter === opt.code;
            return (
              <Button
                key={opt.code}
                variant={active ? "outline" : "ghost"}
                size="sm"
                className={
                  (active
                    ? "border-2 border-primary bg-primary/10 text-foreground "
                    : "text-muted-foreground hover:text-foreground ") +
                  "inline-flex items-center gap-1.5"
                }
                onClick={() => setKindFilter(opt.code)}
              >
                <ActiveIcon className="h-4 w-4" />
                {opt.label}
              </Button>
            );
          })}
          <div className="ml-auto flex items-center">
            <Button
              asChild
              size="sm"
              className="px-4 font-medium relative overflow-hidden border-2 border-black dark:border-white bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 hover:from-neutral-50 hover:to-neutral-100 dark:hover:from-neutral-800 dark:hover:to-neutral-700 shadow-xs group transition-colors"
            >
              <Link
                href={`/w/${workspaceId}/new?env=${currentEnv}`}
                className="flex items-center gap-1.5"
              >
                <PlusCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span>New Artifact</span>
              </Link>
            </Button>
          </div>
        </div>
        <Tabs
          value={currentEnv}
          onValueChange={(v: string) => onEnvChange(v as EnvCode)}
        >
          <TabsList className="inline-flex h-10 items-center justify-center rounded-full bg-muted p-1 text-muted-foreground">
            {(workspace?.enabled_environments?.length
              ? workspace.enabled_environments
              : [
                  {
                    slug: "DEV" as const,
                    name: "Development",
                    display_order: 0,
                  },
                  {
                    slug: "STAGING" as const,
                    name: "Staging",
                    display_order: 1,
                  },
                  {
                    slug: "PROD" as const,
                    name: "Production",
                    display_order: 2,
                  },
                ]
            ).map((env) => {
              const active = currentEnv === env.slug;
              const colors = ENV_COLORS[env.slug as EnvCode];
              return (
                <TabsTrigger
                  key={env.slug}
                  value={env.slug}
                  className={
                    "rounded-full px-3 py-1 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors " +
                    (active
                      ? `border-2 ${colors.bg} ${colors.text} ${colors.border} shadow-sm hover:shadow`
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")
                  }
                >
                  {env.slug}
                  {workspace?.artifact_counts?.by_environment?.[env.slug] !==
                    undefined && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {workspace.artifact_counts.by_environment[env.slug]}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
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
                          <th className="px-4 py-2 font-medium">Tags</th>
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
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {(
                                  (
                                    a as Artifact & {
                                      tag_objects?: {
                                        id: number;
                                        name: string;
                                      }[];
                                    }
                                  )?.tag_objects || []
                                ).map((t) => (
                                  <span
                                    key={t.id}
                                    className="px-2 py-0.5 rounded-full bg-muted text-xs border"
                                  >
                                    {t.name}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-2 align-middle">
                              {new Date(a.updated_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 align-middle">
                              <div className="flex justify-end gap-2">
                                {a.kind === "ENV_VAR" && (
                                  <>
                                    {/* Reveal removed – keep only copy */}
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      title="Copy value"
                                      disabled={copyingId === a.id}
                                      onClick={() => handleCopy(a)}
                                    >
                                      {copyingId === a.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : copiedId === a.id ? (
                                        <Check className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </>
                                )}
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
                                    <Files className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  title="Edit"
                                  asChild
                                >
                                  <Link
                                    href={`/artifacts/${a.id}/edit?workspaceId=${workspaceId}`}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button
                                  variant="danger"
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
            {/* Reveal dialog removed */}
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
