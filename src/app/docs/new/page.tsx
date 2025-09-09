"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listWorkspaces, type Workspace } from "@/lib/api/workspaces";
import { Loader2, Link2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function DocsAddLinkContent() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const ws = await listWorkspaces();
        setWorkspaces(ws);
        // If exactly one workspace, jump straight to its new page preselected for DOC_LINK
        if (ws.length === 1) {
          router.replace(`/w/${ws[0].id}/new?env=DEV&kind=DOC_LINK`);
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "New" }]} />
      <h1 className="text-3xl font-bold tracking-tight mt-2">Add Documentation Link</h1>
      <p className="text-muted-foreground mt-2">
        Choose a workspace to create a new DOC_LINK artifact.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Select Workspace</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading workspaces...
            </div>
          ) : workspaces.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              You have no workspaces yet. Create one first from the
              {" "}
              <Link href="/workspaces/new" className="text-primary hover:underline">
                New Workspace
              </Link>{" "}
              page.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {workspaces.map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <div className="font-medium">{w.name}</div>
                    {w.description && (
                      <div className="text-sm text-muted-foreground truncate">
                        {w.description}
                      </div>
                    )}
                  </div>
                  <Button asChild>
                    <Link href={`/w/${w.id}/new?env=DEV&kind=DOC_LINK`}>
                      <Link2 className="h-4 w-4 mr-2" /> Add Link
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DocsAddLinkPage() {
  return (
    <AuthGuard>
      <DocsAddLinkContent />
    </AuthGuard>
  );
}

