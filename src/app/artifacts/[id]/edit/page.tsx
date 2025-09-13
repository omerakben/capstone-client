"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SecretInput } from "@/components/ui/secret-input";
import { Textarea } from "@/components/ui/textarea";
import {
  createTag,
  deleteTag,
  listTags,
  updateArtifact,
  type CreateArtifactInput,
  type CreateEnvVarInput,
  type Tag,
} from "@/lib/api/artifacts";
import { http } from "@/lib/api/http";
import type { Artifact, ArtifactKind, EnvCode } from "@/types/artifacts";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

interface EditArtifactFormData {
  notes?: string;
  environment?: EnvCode;
  key?: string;
  value?: string;
  title?: string;
  content?: string;
  url?: string;
  label?: string;
}

export default function EditArtifactPage() {
  return (
    <AuthGuard>
      <EditArtifactContent />
    </AuthGuard>
  );
}

function EditArtifactContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const artifactId = parseInt(params.id as string, 10);
  // workspaceId is provided via query parameter from Workspace page
  // Derive workspaceId from query param; if absent we'll attempt a fallback
  const initialWorkspaceId = searchParams.get("workspaceId")
    ? parseInt(searchParams.get("workspaceId") as string, 10)
    : NaN;
  const [workspaceId, setWorkspaceId] = useState<number>(initialWorkspaceId);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [tagSaving, setTagSaving] = useState(false);
  // Track if we already attempted a secondary fallback probe after an initial 404
  const [retriedFallback, setRetriedFallback] = useState(false);

  const form = useForm<EditArtifactFormData>({
    defaultValues: {
      notes: "",
      environment: "DEV" as EnvCode,
      key: "",
      value: "",
      title: "",
      content: "",
      url: "",
      label: "",
    },
  });

  useEffect(() => {
    console.log(
      `🔍 Edit page useEffect triggered - artifactId: ${artifactId}, workspaceId: ${workspaceId}, retriedFallback: ${retriedFallback}`
    );

    const load = async () => {
      try {
        console.log(
          `🚀 Starting load function for artifact ${artifactId} in workspace ${workspaceId}`
        );
        setLoading(true);
        setError(null); // Clear any previous errors

        if (!workspaceId || Number.isNaN(workspaceId)) {
          // Fallback: attempt to discover workspace by probing artifact across user workspaces (simple heuristic)
          try {
            const { data: wList } = await http.get<{ id: number }[]>(
              "/workspaces/"
            );
            if (Array.isArray(wList)) {
              for (const w of wList) {
                try {
                  const probe = await http.get<Artifact>(
                    `/workspaces/${w.id}/artifacts/${artifactId}/`
                  );
                  if (probe?.data?.workspace) {
                    setWorkspaceId(w.id);
                    break;
                  }
                } catch {
                  /* ignore 404 */
                }
              }
            }
          } catch {
            /* ignore */
          }
          if (!workspaceId || Number.isNaN(workspaceId)) {
            setError(
              "Missing workspace context. Navigate from a workspace page."
            );
            return;
          }
        }

        let data: Artifact | null = null;
        let retryCount = 0;
        const maxRetries = 3;

        // Retry loop to handle authentication timing issues
        while (!data && retryCount < maxRetries) {
          try {
            const resp = await http.get<Artifact>(
              `/workspaces/${workspaceId}/artifacts/${artifactId}/`
            );
            data = resp.data;
            break; // Success, exit retry loop
          } catch (err: unknown) {
            retryCount++;
            const status =
              typeof err === "object" && err && "response" in err
                ? (err as { response?: { status?: number } }).response?.status
                : undefined;

            console.log(
              `Attempt ${retryCount}/${maxRetries} failed with status ${status}`
            );

            if (status === 404 && !retriedFallback && retryCount === 1) {
              // One-time retry: artifact might belong to a different workspace than provided in query
              try {
                const { data: wList } = await http.get<{ id: number }[]>(
                  "/workspaces/"
                );
                if (Array.isArray(wList)) {
                  for (const w of wList) {
                    if (w.id === workspaceId) continue;
                    try {
                      const probe = await http.get<Artifact>(
                        `/workspaces/${w.id}/artifacts/${artifactId}/`
                      );
                      if (probe?.data) {
                        setWorkspaceId(w.id);
                        data = probe.data;
                        break;
                      }
                    } catch {}
                  }
                }
              } catch {}
              setRetriedFallback(true);
              if (data) break; // Success from workspace fallback
            }

            // If this was the last retry, we'll handle the error below
            if (retryCount >= maxRetries) {
              throw err;
            }

            // Wait before retrying (exponential backoff)
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * retryCount)
            );
          }
        }
        if (!data) {
          throw new Error("Artifact not found or no longer accessible");
        }
        setArtifact(data);
        // Load tags in parallel
        try {
          const tags = await listTags(workspaceId);
          setAllTags(tags);
          // Initialize selected tags from artifact response if present
          const currentIds = (data.tags as number[] | undefined) || [];
          setSelectedTags(currentIds);
        } catch (e) {
          console.warn("Tag load failed", e);
        }
        // Initialize form fields depending on kind
        const base: EditArtifactFormData = {
          notes: data.notes || "",
          environment: data.environment as EnvCode,
        };
        if (data.kind === "ENV_VAR") {
          const envVar = data as Extract<Artifact, { kind: "ENV_VAR" }>;
          base.key = envVar.key;
          base.value = ""; // blank value so user can optionally set
        } else if (data.kind === "PROMPT") {
          const prompt = data as Extract<Artifact, { kind: "PROMPT" }>;
          base.title = prompt.title;
          base.content = prompt.content;
        } else if (data.kind === "DOC_LINK") {
          const doc = data as Extract<Artifact, { kind: "DOC_LINK" }>;
          base.title = doc.title;
          base.url = doc.url;
          base.label = doc.label || "";
        }
        form.reset(base);
      } catch (e: unknown) {
        console.error(e);
        const msg =
          typeof e === "object" && e && "message" in e
            ? String((e as { message?: unknown }).message)
            : "Failed to load artifact";
        setError(msg || "Failed to load artifact");
      } finally {
        setLoading(false);
      }
    };
    if (artifactId) load();
  }, [artifactId, form, workspaceId, retriedFallback]);

  const validate = (
    kind: ArtifactKind,
    data: EditArtifactFormData
  ): string | null => {
    switch (kind) {
      case "ENV_VAR":
        if (data.key && !/^[A-Z0-9_]+$/.test(data.key))
          return "Key must be uppercase alphanumerics + underscore";
        return null;
      case "PROMPT":
        if (data.title && !data.title.trim()) return "Title required";
        if (data.content && data.content.length > 10000)
          return "Prompt too long";
        return null;
      case "DOC_LINK":
        if (data.url) {
          try {
            new URL(data.url);
          } catch {
            return "Invalid URL";
          }
        }
        return null;
      default:
        return null;
    }
  };

  const onSubmit = async (data: EditArtifactFormData) => {
    if (!artifact) return;
    const validationError = validate(artifact.kind, data);
    if (validationError) {
      form.setError("root", { message: validationError });
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (!workspaceId || Number.isNaN(workspaceId)) {
        setError("Missing workspace context.");
        return;
      }
      // Prepare PATCH dto; omit blank ENV_VAR value to keep unchanged
      const dto: Partial<CreateArtifactInput> & { tags?: number[] } = {
        ...data,
        tags: selectedTags,
      };
      if (artifact.kind === "ENV_VAR") {
        const envDto = dto as Partial<CreateEnvVarInput> & { tags?: number[] };
        if ((envDto.value ?? "") === "") {
          delete envDto.value;
        }
      }
      await updateArtifact(workspaceId, artifact.id, dto);
      // Optionally warm the workspace request; actual refresh happens on landing
      try {
        await http.get(`/workspaces/${artifact.workspace}/`);
      } catch {}
      router.push(`/w/${artifact.workspace}?env=${artifact.environment}`);
    } catch (e) {
      console.error(e);
      const maybe = e as { message?: string };
      setError(maybe?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!artifact) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-destructive">
        Artifact not found
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
              { label: "Artifact", current: true },
            ]}
          />
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link
                href={`/w/${artifact.workspace}?env=${artifact.environment}`}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Edit Artifact</h1>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{artifact.kind}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {error && (
                  <div className="text-sm text-destructive">{error}</div>
                )}
                {/* Environment selection for all kinds */}
                <FormField
                  control={form.control}
                  name="environment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Environment</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex gap-6"
                        >
                          {(["DEV", "STAGING", "PROD"] as const).map((slug) => (
                            <div
                              key={slug}
                              className="flex items-center space-x-2"
                            >
                              <RadioGroupItem value={slug} id={`env-${slug}`} />
                              <label
                                htmlFor={`env-${slug}`}
                                className="cursor-pointer"
                              >
                                {slug === "DEV"
                                  ? "Development"
                                  : slug === "STAGING"
                                  ? "Staging"
                                  : "Production"}
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {artifact.kind === "ENV_VAR" && (
                  <>
                    <FormField
                      control={form.control}
                      name="key"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Key</FormLabel>
                          <FormControl>
                            <Input className="font-mono" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Value (leave blank to keep unchanged)
                          </FormLabel>
                          <FormControl>
                            <SecretInput {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                {artifact.kind === "PROMPT" && (
                  <>
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <Textarea className="min-h-40" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                {artifact.kind === "DOC_LINK" && (
                  <>
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL</FormLabel>
                          <FormControl>
                            <Input type="url" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Label</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-24" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Tags Many-to-Many */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel className="font-medium">Tags</FormLabel>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="New tag"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter" && newTagName.trim()) {
                            e.preventDefault();
                            if (!workspaceId) return;
                            setTagSaving(true);
                            try {
                              const t = await createTag(
                                workspaceId,
                                newTagName.trim()
                              );
                              setAllTags((prev) =>
                                [...prev, t].sort((a, b) =>
                                  a.name.localeCompare(b.name)
                                )
                              );
                              setSelectedTags((prev) => [
                                ...new Set([...prev, t.id]),
                              ]);
                              setNewTagName("");
                            } catch (err) {
                              const maybe = err as {
                                code?: string;
                                message?: string;
                              };
                              console.warn(
                                "Create tag failed (Enter):",
                                maybe?.code || "",
                                maybe?.message || err
                              );
                              alert(maybe?.message || "Create tag failed");
                            } finally {
                              setTagSaving(false);
                            }
                          }
                        }}
                        className="h-8 w-40"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={tagSaving || !newTagName.trim()}
                        onClick={async () => {
                          if (!workspaceId || !newTagName.trim()) return;
                          setTagSaving(true);
                          try {
                            const t = await createTag(
                              workspaceId,
                              newTagName.trim()
                            );
                            setAllTags((prev) =>
                              [...prev, t].sort((a, b) =>
                                a.name.localeCompare(b.name)
                              )
                            );
                            setSelectedTags((prev) => [
                              ...new Set([...prev, t.id]),
                            ]);
                            setNewTagName("");
                          } catch (e) {
                            const maybe = e as {
                              code?: string;
                              message?: string;
                            };
                            console.warn(
                              "Create tag failed:",
                              maybe?.code || "",
                              maybe?.message || e
                            );
                            alert(maybe?.message || "Create tag failed");
                          } finally {
                            setTagSaving(false);
                          }
                        }}
                      >
                        {tagSaving && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        Add
                      </Button>
                    </div>
                  </div>
                  {allTags.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No tags yet.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((t) => {
                        const active = selectedTags.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() =>
                              setSelectedTags((prev) =>
                                prev.includes(t.id)
                                  ? prev.filter((id) => id !== t.id)
                                  : [...prev, t.id]
                              )
                            }
                            className={
                              "px-3 py-1 rounded-full text-xs font-medium border transition-colors " +
                              (active
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted hover:bg-muted/70 border-muted-foreground/20 text-foreground")
                            }
                          >
                            <span>{t.name}</span>
                            <span
                              role="button"
                              aria-label={`Delete tag ${t.name}`}
                              title={`Delete tag${
                                typeof t.usage_count === "number"
                                  ? ` (used by ${t.usage_count} artifacts)`
                                  : ""
                              }`}
                              className="ml-2 inline-flex items-center justify-center rounded-sm px-1 text-[10px] opacity-60 hover:opacity-100 hover:bg-background/40"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!workspaceId) return;
                                const used =
                                  typeof t.usage_count === "number"
                                    ? t.usage_count
                                    : 0;
                                const ok = confirm(
                                  used > 0
                                    ? `Delete tag "${t.name}"? It is currently used by ${used} artifact(s).`
                                    : `Delete tag "${t.name}"?`
                                );
                                if (!ok) return;
                                try {
                                  setTagSaving(true);
                                  await deleteTag(workspaceId, t.id);
                                  setAllTags((prev) =>
                                    prev.filter((x) => x.id !== t.id)
                                  );
                                  setSelectedTags((prev) =>
                                    prev.filter((id) => id !== t.id)
                                  );
                                } catch (e) {
                                  const maybe = e as { message?: string };
                                  alert(maybe?.message || "Delete tag failed");
                                } finally {
                                  setTagSaving(false);
                                }
                              }}
                            >
                              ×
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {form.formState.errors.root && (
                  <div className="text-sm text-destructive">
                    {form.formState.errors.root.message}
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={saving}>
                    {saving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link
                      href={`/w/${artifact.workspace}?env=${artifact.environment}`}
                    >
                      Cancel
                    </Link>
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
