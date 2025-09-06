"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { type DocLink, listDocLinksGlobalServer } from "@/lib/api/docs";
import { listWorkspaces, type Workspace } from "@/lib/api/workspaces";
import { createArtifact } from "@/lib/api/artifacts";
import { Copy, ExternalLink, FileText, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getDomain } from "tldts";

function DocsContent() {
  const [docLinks, setDocLinks] = useState<DocLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [wsId, setWsId] = useState<number | "">("");
  const [env, setEnv] = useState<"DEV" | "STAGING" | "PROD">("DEV");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch doc links on mount
  useEffect(() => {
    const fetchDocLinks = async () => {
      try {
        setIsLoading(true);
        const links = await listDocLinksGlobalServer();
        setDocLinks(links);
      } catch {
        console.error("Failed to fetch doc links");
        toast({
          title: "Error",
          description: "Failed to load documentation links. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocLinks();
  }, [toast]);

  // Load workspaces when opening dialog
  useEffect(() => {
    const load = async () => {
      try {
        const ws = await listWorkspaces();
        setWorkspaces(ws);
        if (ws.length && wsId === "") setWsId(ws[0].id);
      } catch {
        // ignore
      }
    };
    if (addOpen) void load();
  }, [addOpen, wsId]);

  const handleCreateLink = async () => {
    if (!wsId || !title.trim() || !url.trim()) {
      toast({ title: "Missing fields", description: "Workspace, title and URL are required.", variant: "destructive" });
      return;
    }
    try {
      new URL(url);
    } catch {
      toast({ title: "Invalid URL", description: "Please enter a valid URL.", variant: "destructive" });
      return;
    }
    try {
      setCreating(true);
      await createArtifact(Number(wsId), {
        kind: "DOC_LINK",
        environment: env,
        title: title.trim(),
        url: url.trim(),
        label: label.trim() || undefined,
      });
      const links = await listDocLinksGlobalServer();
      setDocLinks(links);
      setAddOpen(false);
      setTitle("");
      setUrl("");
      setLabel("");
      toast({ title: "Link added", description: "Documentation link created." });
    } catch {
      toast({ title: "Error", description: "Failed to create link.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  // Filter doc links based on search
  const filteredDocLinks = useMemo(() => {
    if (!debouncedSearch) return docLinks;

    const query = debouncedSearch.toLowerCase();
    return docLinks.filter(
      (link) =>
        link.title.toLowerCase().includes(query) ||
        link.url.toLowerCase().includes(query) ||
        link.label?.toLowerCase().includes(query)
    );
  }, [docLinks, debouncedSearch]);

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const extractDomainFromUrl = (url: string): string => {
    try {
      const domain = getDomain(url);
      return domain || new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const getFaviconUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=16`;
    } catch {
      return "/file.svg"; // Fallback icon
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Documentation Hub
            </h1>
            <p className="text-muted-foreground mt-2">
              Centralized access to all your documentation links
            </p>
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-8 bg-muted rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Documentation Hub
          </h1>
          <p className="text-muted-foreground mt-2">
            Centralized access to all your documentation links
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Documentation Link</DialogTitle>
              <DialogDescription>Create a DOC_LINK artifact in a workspace.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1">
                <Label>Workspace</Label>
                <div className="max-h-40 overflow-auto rounded-md border p-2">
                  {workspaces.map((w) => (
                    <label key={w.id} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input
                        type="radio"
                        name="ws"
                        checked={wsId === w.id}
                        onChange={() => setWsId(w.id)}
                      />
                      <span className="text-sm">{w.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <div>
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Playwright Docs" />
                </div>
                <div>
                  <Label>URL</Label>
                  <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/docs" />
                </div>
                <div>
                  <Label>Label (optional)</Label>
                  <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="QA" />
                </div>
              </div>
              <div className="grid gap-1">
                <Label>Environment</Label>
                <div className="flex gap-2">
                  {(["DEV", "STAGING", "PROD"] as const).map((code) => (
                    <Button
                      key={code}
                      type="button"
                      variant={env === code ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEnv(code)}
                    >
                      {code}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateLink} disabled={creating}>
                {creating ? "Creating..." : "Create Link"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search bar */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search documentation links..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Doc links grid */}
      {filteredDocLinks.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery
              ? "No matching links found"
              : "No documentation links yet"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? "Try adjusting your search terms"
              : "Add your first documentation link to get started"}
          </p>
          {!searchQuery && (
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Link
                </Button>
              </DialogTrigger>
            </Dialog>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocLinks.map((link) => (
            <Card
              key={link.id}
              className="group hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getFaviconUrl(link.url)}
                      alt=""
                      className="w-4 h-4 flex-shrink-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/file.svg";
                      }}
                    />
                    <CardTitle className="text-base leading-tight truncate">
                      {link.title}
                    </CardTitle>
                  </div>
                  <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleCopyLink(link.url)}
                      title="Copy link"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() =>
                        window.open(link.url, "_blank", "noopener,noreferrer")
                      }
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {extractDomainFromUrl(link.url)}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                {link.label && (
                  <div className="flex gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {link.label}
                    </Badge>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Updated {new Date(link.updated_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats footer */}
      {filteredDocLinks.length > 0 && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Showing {filteredDocLinks.length} of {docLinks.length} documentation
          links
        </div>
      )}
    </div>
  );
}

export default function DocsPage() {
  return (
    <AuthGuard>
      <DocsContent />
    </AuthGuard>
  );
}
