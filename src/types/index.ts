/**
 * Shared types for the DEADLINE application
 */

// Environment types - these are user classification labels, NOT deployment environments
export type EnvCode = "DEV" | "STAGING" | "PROD";

// Artifact types
export type ArtifactKind = "ENV_VAR" | "PROMPT" | "DOC_LINK";

// Base artifact interface
export interface BaseArtifact {
  id: number;
  workspace: number;
  kind: ArtifactKind;
  environment: EnvCode;
  notes?: string;
  updated_at: string;
}

// Specific artifact types (discriminated union)
export interface EnvVarArtifact extends BaseArtifact {
  kind: "ENV_VAR";
  key: string;
  value: string; // May be masked as "••••••" by backend
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

// Union type for all artifacts
export type Artifact = EnvVarArtifact | PromptArtifact | DocLinkArtifact;

// Environment color mappings for UI consistency
export const ENV_COLORS = {
  DEV: {
    bg: "bg-blue-100 dark:bg-blue-950/30",
    text: "text-blue-800 dark:text-blue-200",
    border: "border-blue-200 dark:border-blue-800",
  },
  STAGING: {
    bg: "bg-yellow-100 dark:bg-yellow-950/30",
    text: "text-yellow-800 dark:text-yellow-200",
    border: "border-yellow-200 dark:border-yellow-800",
  },
  PROD: {
    bg: "bg-red-100 dark:bg-red-950/30",
    text: "text-red-800 dark:text-red-200",
    border: "border-red-200 dark:border-red-800",
  },
} as const;

// Environment display names
export const ENV_LABELS = {
  DEV: "Development",
  STAGING: "Staging",
  PROD: "Production",
} as const;
