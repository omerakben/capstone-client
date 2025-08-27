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
  artifact_counts?: Record<string, number>; // optional aggregated counts
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const { data } = await http.get<Workspace[]>("/workspaces/");
  return data;
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
