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

export type CreateArtifactInput = Omit<
  Artifact,
  "id" | "updated_at" | "workspace"
> & { workspace?: number };

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
