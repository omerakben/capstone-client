"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteWorkspace,
  getWorkspace,
  updateWorkspace,
} from "@/lib/api/workspaces";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditWorkspacePage() {
  return (
    <AuthGuard>
      <EditWorkspaceContent />
    </AuthGuard>
  );
}

function EditWorkspaceContent() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = parseInt(params.id as string, 10);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const ws = await getWorkspace(workspaceId);
        setName(ws.name);
        setDescription(ws.description || "");
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          console.error(e);
        }
        setError("Failed to load workspace");
      } finally {
        setLoading(false);
      }
    };
    if (workspaceId) load();
  }, [workspaceId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateWorkspace(workspaceId, {
        name: name.trim(),
        description: description.trim(),
      });
      router.push(`/w/${workspaceId}`);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.error(e);
      }
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (
      !confirm(
        "This will permanently delete the workspace and all artifacts. Continue?"
      )
    )
      return;
    setDeleting(true);
    try {
      await deleteWorkspace(workspaceId);
      router.push("/workspaces");
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.error(e);
      }
      alert("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6 flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/w/${workspaceId}`}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Edit Workspace</h1>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Workspace Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              {error && <div className="text-sm text-destructive">{error}</div>}
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}{" "}
                  <span className="ml-2">Delete</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
