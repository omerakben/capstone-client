import type { Artifact, ArtifactKind, EnvCode } from "@/types/artifacts";
import { http } from "./http";

export interface GlobalSearchParams {
  q: string;
  kind?: ArtifactKind;
  environment?: EnvCode;
  workspace?: number;
}

export interface GlobalSearchResult {
  results: Artifact[];
  count: number;
}

export async function searchArtifactsGlobal(
  params: GlobalSearchParams
): Promise<GlobalSearchResult> {
  const { data } = await http.get<GlobalSearchResult>("/search/artifacts/", {
    params: params,
  });
  return data;
}

