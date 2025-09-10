import type { Artifact } from "@/types/artifacts";
import { http } from "./http";

export interface WorkspaceDTO {
  name: string;
  description?: string;
}

export interface Workspace {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  artifact_counts?: {
    total: number;
    by_type: { ENV_VAR: number; PROMPT: number; DOC_LINK: number };
    by_environment: { DEV: number; STAGING: number; PROD: number };
  };
  enabled_environments?: Array<{
    slug: "DEV" | "STAGING" | "PROD";
    name: string;
    display_order: number;
  }>;
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const { data } = await http.get("/workspaces/");
  // Support both plain list and DRF paginated responses
  if (Array.isArray(data)) {
    return data as Workspace[];
  }
  const maybe = data as { results?: Workspace[] } | null | undefined;
  if (maybe && Array.isArray(maybe.results)) {
    return maybe.results;
  }
  console.warn("Unexpected workspaces response shape:", data);
  return [];
}

export async function getWorkspace(id: number): Promise<Workspace> {
  const { data } = await http.get<Workspace>(`/workspaces/${id}/`);
  return data;
}

export async function createWorkspace(dto: WorkspaceDTO): Promise<Workspace> {
  const { data } = await http.post<Workspace>("/workspaces/", dto);
  return data;
}

export async function updateWorkspace(
  id: number,
  dto: Partial<WorkspaceDTO>
): Promise<Workspace> {
  const { data } = await http.patch<Workspace>(`/workspaces/${id}/`, dto);
  return data;
}

export async function deleteWorkspace(id: number): Promise<void> {
  await http.delete(`/workspaces/${id}/`);
}

// Export/Import functionality
export interface ExportData {
  workspace: Workspace;
  artifacts: Artifact[];
  exportedAt: string;
  version: string;
}

export async function exportWorkspace(id: number): Promise<ExportData> {
  const { data } = await http.get<ExportData>(`/workspaces/${id}/export/`);
  return data;
}

export async function importWorkspace(
  exportData: ExportData
): Promise<Workspace> {
  // Server returns { workspace, imported_count }
  const { data } = await http.post<{
    workspace: Workspace;
    imported_count: number;
  }>("/workspaces/import/", exportData);
  return data.workspace;
}

// Enabled environments management (M2M join control)
export async function updateEnabledEnvironments(
  id: number,
  enabled: Array<"DEV" | "STAGING" | "PROD">
): Promise<Array<{ slug: "DEV" | "STAGING" | "PROD"; name: string; display_order: number }>> {
  const { data } = await http.patch<{ enabled_environments: Array<{ slug: "DEV" | "STAGING" | "PROD"; name: string; display_order: number }> }>(
    `/workspaces/${id}/enabled_environments/`,
    { enabled }
  );
  return data.enabled_environments;
}
