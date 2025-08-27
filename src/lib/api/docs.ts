import { http } from "./http";

export interface DocLink {
  id: number;
  title: string;
  url: string;
  label?: string;
  updated_at: string;
  workspace?: number; // global or workspace-specific
}

export async function listDocLinksGlobal(): Promise<DocLink[]> {
  const { data } = await http.get<DocLink[]>("/docs/links/");
  return data;
}
