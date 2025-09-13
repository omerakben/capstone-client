import type { Artifact, ArtifactKind, EnvCode } from "@/types/artifacts";
import { http } from "./http";

export interface ListArtifactsParams {
  workspaceId: number;
  environment?: EnvCode;
  kind?: ArtifactKind;
  search?: string;
}

export async function listArtifacts(
  params: ListArtifactsParams
): Promise<Artifact[]> {
  const { workspaceId, ...query } = params;
  const { data } = await http.get(`/workspaces/${workspaceId}/artifacts/`, {
    params: query,
  });
  // Support both plain list (no pagination) and DRF paginated responses
  if (Array.isArray(data)) {
    return data as Artifact[];
  }
  interface Paginated<T> {
    results: T[];
    count?: number;
    next?: string | null;
    previous?: string | null;
  }
  const maybe = data as Partial<Paginated<Artifact>> | null | undefined;
  if (maybe && Array.isArray(maybe.results)) {
    return maybe.results;
  }
  if (process.env.NODE_ENV !== "production") {
    console.warn("Unexpected artifacts response shape:", data);
  }
  return [];
}

// Create input types for each artifact kind
export interface CreateEnvVarInput {
  kind: "ENV_VAR";
  environment: EnvCode;
  key: string;
  value: string;
  notes?: string;
  workspace?: number;
}

export interface CreatePromptInput {
  kind: "PROMPT";
  environment: EnvCode;
  title: string;
  content: string;
  notes?: string;
  workspace?: number;
}

export interface CreateDocLinkInput {
  kind: "DOC_LINK";
  environment: EnvCode;
  title: string;
  url: string;
  label?: string;
  notes?: string;
  workspace?: number;
}

export type CreateArtifactInput =
  | CreateEnvVarInput
  | CreatePromptInput
  | CreateDocLinkInput;

export async function createArtifact(
  workspaceId: number,
  dto: CreateArtifactInput
): Promise<Artifact> {
  const { data } = await http.post<Artifact>(
    `/workspaces/${workspaceId}/artifacts/`,
    dto
  );
  return data;
}

export async function updateArtifact(
  workspaceId: number,
  id: number,
  dto: Partial<CreateArtifactInput> & { tags?: number[] }
): Promise<Artifact> {
  const { data } = await http.patch<Artifact>(
    `/workspaces/${workspaceId}/artifacts/${id}/`,
    dto
  );
  return data;
}

// Tags (Many-to-Many)
export interface Tag {
  id: number;
  name: string;
  workspace: number;
  created_at: string;
  updated_at: string;
  usage_count?: number;
}

export async function listTags(workspaceId: number): Promise<Tag[]> {
  const { data } = await http.get(`/workspaces/${workspaceId}/artifacts/tags/`);
  return Array.isArray(data) ? (data as Tag[]) : [];
}

export async function createTag(
  workspaceId: number,
  name: string
): Promise<Tag> {
  const { data } = await http.post<Tag>(
    `/workspaces/${workspaceId}/artifacts/tags/`,
    { name }
  );
  return data;
}

export async function deleteTag(
  workspaceId: number,
  tagId: number
): Promise<void> {
  await http.delete(`/workspaces/${workspaceId}/artifacts/tags/${tagId}/`);
}

export async function deleteArtifact(
  workspaceId: number,
  id: number
): Promise<void> {
  await http.delete(`/workspaces/${workspaceId}/artifacts/${id}/`);
}

export async function duplicateArtifact(
  id: number,
  targetEnvironment: EnvCode
): Promise<Artifact> {
  const { data } = await http.post<Artifact>(`/artifacts/${id}/duplicate/`, {
    environment: targetEnvironment,
  });
  return data;
}

// Backend currently exposes duplicate endpoint as nested route action
// /workspaces/:workspaceId/artifacts/:id/duplicate_to_environment/
// Provide alternative that aligns with server implementation.
export async function duplicateArtifactToEnvironment(
  workspaceId: number,
  id: number,
  targetEnvironment: EnvCode
): Promise<Artifact> {
  const { data } = await http.post<Artifact>(
    `/workspaces/${workspaceId}/artifacts/${id}/duplicate_to_environment/`,
    { environment: targetEnvironment }
  );
  return data;
}
