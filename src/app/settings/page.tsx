"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  exportWorkspace,
  importWorkspace,
  listWorkspaces,
  type ExportData,
  type Workspace,
} from "@/lib/api/workspaces";
import {
  AlertTriangle,
  Download,
  FileText,
  Shield,
  Upload,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Get user display information
  const userName = user?.displayName || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "";
  const userInitials = userName.slice(0, 2).toUpperCase();
  const userPhotoURL = user?.photoURL;

  const handleExportWorkspace = async (
    workspaceId: number,
    workspaceName: string
  ) => {
    setIsExporting(true);
    try {
      const exportData = await exportWorkspace(workspaceId);

      // Create downloadable JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${workspaceName
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}_export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Workspace "${workspaceName}" has been exported.`,
      });
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Export failed:", error);
      }
      toast({
        title: "Export Failed",
        description: "Failed to export workspace. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/json") {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid JSON file.",
        variant: "destructive",
      });
    }
  };

  const handleImportWorkspace = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      const fileText = await selectedFile.text();
      const importData: ExportData = JSON.parse(fileText);

      // Validate import data structure
      if (
        !importData.workspace ||
        !importData.artifacts ||
        !importData.version
      ) {
        throw new Error("Invalid export file format");
      }

      await importWorkspace(importData);

      setImportDialogOpen(false);
      setSelectedFile(null);

      toast({
        title: "Import Successful",
        description: `Workspace "${importData.workspace.name}" has been imported.`,
      });
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Import failed:", error);
      }
      toast({
        title: "Import Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to import workspace. Please check the file format.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // First sign out the user
      await signOut();

      toast({
        title: "Account Deletion",
        description: "Account deletion initiated. You have been signed out.",
        variant: "destructive",
      });

      // Note: Actual account deletion would require backend API call
      // For now, we just sign the user out as a placeholder
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Account deletion failed:", error);
      }
      toast({
        title: "Deletion Failed",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-8">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings", current: true }]} />
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and workspace data.
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>
            Your account information from Firebase Authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userPhotoURL || undefined} alt={userName} />
              <AvatarFallback className="text-lg">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{userName}</h3>
              <p className="text-muted-foreground">{userEmail}</p>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <Badge variant="secondary" className="text-xs">
                  Authenticated
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={userName}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={userEmail}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Profile information is managed through Firebase Authentication and
            cannot be edited here.
          </p>
        </CardContent>
      </Card>

      {/* Workspace Export/Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Workspace Management
          </CardTitle>
          <CardDescription>
            Export your workspaces for backup or import from existing files.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Section */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Workspace
            </h4>
            <p className="text-sm text-muted-foreground">
              Download a complete backup of a workspace including all artifacts
              and metadata.
            </p>
            <WorkspaceExportList
              onExport={handleExportWorkspace}
              isExporting={isExporting}
            />
          </div>

          <Separator />

          {/* Import Section */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import Workspace
            </h4>
            <p className="text-sm text-muted-foreground">
              Import a workspace from a previously exported JSON file.
            </p>

            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Workspace
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Workspace</DialogTitle>
                  <DialogDescription>
                    Select a JSON file exported from DEADLINE to import a
                    workspace.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="import-file">Select File</Label>
                    <Input
                      id="import-file"
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                    />
                  </div>

                  {selectedFile && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setImportDialogOpen(false);
                      setSelectedFile(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImportWorkspace}
                    disabled={!selectedFile || isImporting}
                  >
                    {isImporting ? "Importing..." : "Import"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <h4 className="font-semibold text-destructive mb-2">
                Delete Account
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm text-muted-foreground">
                  This action cannot be undone and will remove all your data.
                </div>
                <Button
                  variant="danger"
                  onClick={async () => {
                    const ok = confirm(
                      "Are you absolutely sure? This will permanently delete your account and all data."
                    );
                    if (!ok) return;
                    await handleDeleteAccount();
                  }}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Separate component for workspace export list to handle async data loading
function WorkspaceExportList({
  onExport,
  isExporting,
}: {
  onExport: (id: number, name: string) => void;
  isExporting: boolean;
}) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const data = await listWorkspaces();
        setWorkspaces(data);
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Failed to load workspaces:", error);
        }
        toast({
          title: "Error",
          description: "Failed to load workspaces.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaces();
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No workspaces to export</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {workspaces.map((workspace) => (
        <div
          key={workspace.id}
          className="flex items-center justify-between p-3 border rounded-lg"
        >
          <div>
            <h5 className="font-medium">{workspace.name}</h5>
            {workspace.description && (
              <p className="text-sm text-muted-foreground">
                {workspace.description}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport(workspace.id, workspace.name)}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      ))}
    </div>
  );
}
