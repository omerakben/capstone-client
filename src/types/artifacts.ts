export type EnvCode = "DEV" | "STAGING" | "PROD";
export type ArtifactKind = "ENV_VAR" | "PROMPT" | "DOC_LINK";

export interface BaseArtifact {
  id: number;
  workspace: number;
  kind: ArtifactKind;
  environment: EnvCode;
  updated_at: string;
  notes?: string;
  tags?: number[]; // list of tag IDs
  tag_objects?: { id: number; name: string }[]; // expanded from backend
}

export interface EnvVarArtifact extends BaseArtifact {
  kind: "ENV_VAR";
  key: string;
  value: string; // May be masked ("••••••")
}

export interface PromptArtifact extends BaseArtifact {
  kind: "PROMPT";
  title: string;
  content: string;
}

export interface DocLinkArtifact extends BaseArtifact {
  kind: "DOC_LINK";
  title: string;
  url: string;
  label?: string;
}

export type Artifact = EnvVarArtifact | PromptArtifact | DocLinkArtifact;
