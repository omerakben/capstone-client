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
import { createArtifact, CreateArtifactInput } from "@/lib/api/artifacts";
import { getWorkspace, type Workspace } from "@/lib/api/workspaces";
import type { ArtifactKind, EnvCode } from "@/types/artifacts";
import { ArrowLeft, Database, FileText, Link2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

interface CreateArtifactFormData {
  kind: ArtifactKind;
  environment: EnvCode;
  notes?: string;
  // ENV_VAR fields
  key?: string;
  value?: string;
  // PROMPT fields
  title?: string;
  content?: string;
  // DOC_LINK fields
  url?: string;
  label?: string;
}

/**
 * Artifact creation form with dynamic fields based on type selection
 *
 * Features:
 * - Dynamic field rendering based on artifact type
 * - Environment selection from URL or default to DEV
 * - Type-specific validation rules
 * - API integration with error handling
 */
function CreateArtifactContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = parseInt(params.id as string, 10);

  // Get environment from URL search params, default to DEV
  const initialEnvironment = (searchParams.get("env") as EnvCode) || "DEV";
  const initialKind =
    (searchParams.get("kind") as ArtifactKind) || ("ENV_VAR" as ArtifactKind);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);

  const form = useForm<CreateArtifactFormData>({
    defaultValues: {
      kind: initialKind,
      environment: initialEnvironment,
      notes: "",
      key: "",
      value: "",
      title: "",
      content: "",
      url: "",
      label: "",
    },
  });

  const watchedKind = form.watch("kind");

  // Load workspace info for header
  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        setIsLoadingWorkspace(true);
        const ws = await getWorkspace(workspaceId);
        setWorkspace(ws);
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Failed to load workspace:", error);
        }
        // If workspace doesn't exist, redirect to dashboard
        router.push("/dashboard");
      } finally {
        setIsLoadingWorkspace(false);
      }
    };

    if (workspaceId) {
      loadWorkspace();
    }
  }, [workspaceId, router]);

  const validateForm = (data: CreateArtifactFormData): string | null => {
    switch (data.kind) {
      case "ENV_VAR":
        if (!data.key?.trim()) return "Environment variable key is required";
        if (!/^[A-Z0-9_]+$/.test(data.key)) {
          return "Key must contain only uppercase letters, numbers, and underscores";
        }
        if (!data.value?.trim())
          return "Environment variable value is required";
        return null;

      case "PROMPT":
        if (!data.title?.trim()) return "Prompt title is required";
        if (!data.content?.trim()) return "Prompt content is required";
        if (data.content.length > 10000) {
          return "Prompt content must be less than 10,000 characters";
        }
        return null;

      case "DOC_LINK":
        if (!data.title?.trim()) return "Document title is required";
        if (!data.url?.trim()) return "Document URL is required";
        try {
          new URL(data.url);
        } catch {
          return "Please enter a valid URL";
        }
        return null;

      default:
        return "Please select a valid artifact type";
    }
  };

  const onSubmit = async (data: CreateArtifactFormData) => {
    // Validate form data
    const validationError = validateForm(data);
    if (validationError) {
      form.setError("root", { message: validationError });
      return;
    }

    setIsLoading(true);

    try {
      // Build artifact DTO based on type
      let artifactDto: CreateArtifactInput;

      switch (data.kind) {
        case "ENV_VAR":
          artifactDto = {
            kind: "ENV_VAR",
            environment: data.environment,
            key: data.key!.trim(),
            value: data.value!.trim(),
            notes: data.notes?.trim() || undefined,
          };
          break;

        case "PROMPT":
          artifactDto = {
            kind: "PROMPT",
            environment: data.environment,
            title: data.title!.trim(),
            content: data.content!.trim(),
            notes: data.notes?.trim() || undefined,
          };
          break;

        case "DOC_LINK":
          artifactDto = {
            kind: "DOC_LINK",
            environment: data.environment,
            title: data.title!.trim(),
            url: data.url!.trim(),
            label: data.label?.trim() || undefined,
            notes: data.notes?.trim() || undefined,
          };
          break;

        default:
          throw new Error("Invalid artifact type");
      }

      // Create the artifact
      await createArtifact(workspaceId, artifactDto);
      // Prefetch/refresh workspace counts for smoother UX
      try {
        await getWorkspace(workspaceId);
      } catch {}
      // Redirect back to workspace with the environment tab
      router.push(`/w/${workspaceId}?env=${data.environment}`);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to create artifact:", error);
      }
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Failed to create artifact. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderArtifactIcon = (kind: ArtifactKind) => {
    switch (kind) {
      case "ENV_VAR":
        return <Database className="h-4 w-4" />;
      case "PROMPT":
        return <FileText className="h-4 w-4" />;
      case "DOC_LINK":
        return <Link2 className="h-4 w-4" />;
    }
  };

  const renderDynamicFields = () => {
    switch (watchedKind) {
      case "ENV_VAR":
        return (
          <>
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Environment Variable Key</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="API_KEY"
                      {...field}
                      className="font-mono"
                    />
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
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <SecretInput
                      placeholder="Enter the environment variable value"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );

      case "PROMPT":
        return (
          <>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Code Review Assistant" {...field} />
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
                  <FormLabel>Prompt Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="You are a helpful code review assistant. Please analyze the following code..."
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    {field.value?.length || 0} / 10,000 characters
                  </p>
                </FormItem>
              )}
            />
          </>
        );

      case "DOC_LINK":
        return (
          <>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Title</FormLabel>
                  <FormControl>
                    <Input placeholder="API Documentation" {...field} />
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
                    <Input
                      type="url"
                      placeholder="https://docs.example.com/api"
                      {...field}
                    />
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
                  <FormLabel>Label (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="v2.0 API" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );

      default:
        return null;
    }
  };

  if (isLoadingWorkspace) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Workspaces", href: "/workspaces" },
              { label: "New Artifact", current: true },
            ]}
          />
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/w/${workspaceId}`}>
                <ArrowLeft className="h-4 w-4" />
                Back to {workspace?.name}
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Create New Artifact
              </h1>
              <p className="text-muted-foreground">
                Add a new artifact to {workspace?.name}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Artifact Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Artifact Type Selection */}
                  <FormField
                    control={form.control}
                    name="kind"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Artifact Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                          >
                            <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-accent">
                              <RadioGroupItem value="ENV_VAR" id="env-var" />
                              <label
                                htmlFor="env-var"
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                {renderArtifactIcon("ENV_VAR")}
                                <div>
                                  <div className="font-medium">
                                    Environment Variable
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Key-value configuration
                                  </div>
                                </div>
                              </label>
                            </div>
                            <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-accent">
                              <RadioGroupItem value="PROMPT" id="prompt" />
                              <label
                                htmlFor="prompt"
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                {renderArtifactIcon("PROMPT")}
                                <div>
                                  <div className="font-medium">Prompt</div>
                                  <div className="text-xs text-muted-foreground">
                                    AI prompt template
                                  </div>
                                </div>
                              </label>
                            </div>
                            <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-accent">
                              <RadioGroupItem value="DOC_LINK" id="doc-link" />
                              <label
                                htmlFor="doc-link"
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                {renderArtifactIcon("DOC_LINK")}
                                <div>
                                  <div className="font-medium">
                                    Document Link
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Reference documentation
                                  </div>
                                </div>
                              </label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Environment Selection */}
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
                            {(workspace?.enabled_environments?.length
                              ? workspace.enabled_environments
                              : [
                                  { slug: "DEV" as const, name: "Development" },
                                  { slug: "STAGING" as const, name: "Staging" },
                                  { slug: "PROD" as const, name: "Production" },
                                ]
                            ).map((env) => (
                              <div
                                key={env.slug}
                                className="flex items-center space-x-2"
                              >
                                <RadioGroupItem
                                  value={env.slug}
                                  id={`env-${env.slug}`}
                                />
                                <label
                                  htmlFor={`env-${env.slug}`}
                                  className="cursor-pointer"
                                >
                                  {env.name}
                                </label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Dynamic Fields Based on Type */}
                  {renderDynamicFields()}

                  {/* Notes (Optional) */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes or context for this artifact..."
                            className="min-h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Global Form Error */}
                  {form.formState.errors.root && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                      <p className="text-destructive text-sm">
                        {form.formState.errors.root.message}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Artifact
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/w/${workspaceId}`}>Cancel</Link>
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * Create Artifact page with authentication guard
 */
export default function CreateArtifactPage() {
  return (
    <AuthGuard>
      <CreateArtifactContent />
    </AuthGuard>
  );
}
