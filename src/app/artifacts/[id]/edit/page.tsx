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
import { SecretInput } from "@/components/ui/secret-input";
import { Textarea } from "@/components/ui/textarea";
import { updateArtifact } from "@/lib/api/artifacts";
import { http } from "@/lib/api/http";
import type { Artifact, ArtifactKind } from "@/types/artifacts";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { EnvCode } from "@/types/artifacts";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  const artifactId = parseInt(params.id as string, 10);
  // workspaceId is provided via query parameter from Workspace page
  const qs =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const workspaceId =
    qs && qs.get("workspaceId")
      ? parseInt(qs.get("workspaceId") as string, 10)
      : NaN;
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EditArtifactFormData>({
    defaultValues: {},
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!workspaceId || Number.isNaN(workspaceId)) {
          setError(
            "Missing workspace context. Navigate from a workspace page."
          );
          return;
        }
        const { data } = await http.get<Artifact>(
          `/workspaces/${workspaceId}/artifacts/${artifactId}/`
        );
        setArtifact(data);
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
      } catch (e) {
        console.error(e);
        setError("Failed to load artifact");
      } finally {
        setLoading(false);
      }
    };
    if (artifactId) load();
  }, [artifactId, form, workspaceId]);

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
      await updateArtifact(workspaceId, artifact.id, data);
      // Optionally warm the workspace request; actual refresh happens on landing
      try {
        await http.get(`/workspaces/${artifact.workspace}/`);
      } catch {}
      router.push(`/w/${artifact.workspace}?env=${artifact.environment}`);
    } catch (e) {
      console.error(e);
      setError("Save failed");
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
                        <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-6">
                          {(["DEV", "STAGING", "PROD"] as const).map((slug) => (
                            <div key={slug} className="flex items-center space-x-2">
                              <RadioGroupItem value={slug} id={`env-${slug}`} />
                              <label htmlFor={`env-${slug}`} className="cursor-pointer">
                                {slug === "DEV" ? "Development" : slug === "STAGING" ? "Staging" : "Production"}
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
