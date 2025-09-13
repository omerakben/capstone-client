"use client";

import { AuthGuard } from "@/components/AuthGuard";
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
import { Textarea } from "@/components/ui/textarea";
import { createWorkspace } from "@/lib/api/workspaces";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface CreateWorkspaceFormData {
  name: string;
  description?: string;
}

function CreateWorkspaceContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<CreateWorkspaceFormData>({
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = async (data: CreateWorkspaceFormData) => {
    const name = data.name.trim();
    if (!name) {
      form.setError("name", { message: "Workspace name is required" });
      return;
    }
    if (name.length > 255) {
      form.setError("name", { message: "Name must be <= 255 characters" });
      return;
    }
    setIsLoading(true);
    try {
      const ws = await createWorkspace({
        name,
        description: data.description?.trim() || undefined,
      });
      router.push(`/w/${ws.id}`);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to create workspace", error);
      }
      form.setError("root", { message: "Creation failed. Try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/workspaces">
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">New Workspace</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create Workspace</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: "Name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Frontend Dashboard"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="Optional description of the workspace"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.formState.errors.root && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.root.message}
                  </p>
                )}
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="mutedGhost"
                    onClick={() => router.back()}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primarySoft"
                    className="px-5 py-2 rounded-lg"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Workspace
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

export default function NewWorkspacePage() {
  return (
    <AuthGuard>
      <CreateWorkspaceContent />
    </AuthGuard>
  );
}
