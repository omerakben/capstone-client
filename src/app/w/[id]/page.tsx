"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getWorkspace, listArtifacts } from "@/lib/api";
import { Artifact, EnvCode, Workspace } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import ArtifactsTable from "./components/ArtifactsTable";
import EnvironmentTabs from "./components/EnvironmentTabs";

interface WorkspaceDetailPageProps {
  params: { id: string };
}

function WorkspaceDetailContent({ params }: WorkspaceDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Get current environment from URL params, default to DEV
  const currentEnv = (searchParams.get("env") as EnvCode) || "DEV";

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle environment tab changes
  const handleEnvironmentChange = (env: EnvCode) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("env", env);
    router.push(`/w/${params.id}?${newParams.toString()}`);
  };

  // Fetch workspace and artifacts
  useEffect(() => {
    if (!user || !params.id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [workspaceData, artifactsData] = await Promise.all([
          getWorkspace(parseInt(params.id)),
          listArtifacts({
            workspaceId: parseInt(params.id),
            environment: currentEnv,
          }),
        ]);

        setWorkspace(workspaceData);
        setArtifacts(artifactsData);
      } catch (err) {
        console.error("Error fetching workspace data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load workspace"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, params.id, currentEnv]);

  // Handle artifact operations
  const handleArtifactUpdate = async () => {
    if (!params.id) return;

    try {
      const artifactsData = await listArtifacts({
        workspaceId: parseInt(params.id),
        environment: currentEnv,
      });
      setArtifacts(artifactsData);
    } catch (err) {
      console.error("Error refreshing artifacts:", err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Workspace
          </h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push("/workspaces")}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Back to Workspaces
          </button>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-700">
            Workspace not found
          </h2>
          <button
            onClick={() => router.push("/workspaces")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Workspaces
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Workspace Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {workspace.name}
            </h1>
            {workspace.description && (
              <p className="text-gray-600 mt-2">{workspace.description}</p>
            )}
          </div>
          <button
            onClick={() => router.push("/workspaces")}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back to Workspaces
          </button>
        </div>
      </div>

      {/* Environment Tabs */}
      <EnvironmentTabs
        currentEnvironment={currentEnv}
        onEnvironmentChange={handleEnvironmentChange}
        artifactCounts={{
          DEV: 0, // TODO: Calculate actual counts
          STAGING: 0,
          PROD: 0,
        }}
      />

      {/* Artifacts Table */}
      <div className="mt-6">
        <ArtifactsTable
          artifacts={artifacts}
          workspaceId={parseInt(params.id)}
          currentEnvironment={currentEnv}
          onArtifactUpdate={handleArtifactUpdate}
        />
      </div>
    </div>
  );
}

export default function WorkspaceDetailPage({
  params,
}: WorkspaceDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      }
    >
      <WorkspaceDetailContent params={params} />
    </Suspense>
  );
}
