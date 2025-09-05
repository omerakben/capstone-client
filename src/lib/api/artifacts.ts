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
  const { data } = await http.get<Artifact[]>(
    `/workspaces/${workspaceId}/artifacts/`,
    { params: query }
  );
  return data;
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
  id: number,
  dto: Partial<CreateArtifactInput>
): Promise<Artifact> {
  const { data } = await http.patch<Artifact>(`/artifacts/${id}/`, dto);
  return data;
}

export async function deleteArtifact(id: number): Promise<void> {
  await http.delete(`/artifacts/${id}/`);
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
