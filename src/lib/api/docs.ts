import { listArtifacts } from "./artifacts";
import { listWorkspaces } from "./workspaces";

export interface DocLink {
  id: number;
  title: string;
  url: string;
  label?: string;
  updated_at: string;
  workspace?: number; // global or workspace-specific
}

// Aggregate DOC_LINK artifacts across all user workspaces
export async function listDocLinksGlobal(): Promise<DocLink[]> {
  const workspaces = await listWorkspaces();
  const results: DocLink[] = [];
  // Fetch DOC_LINK artifacts per workspace (no environment filter to include all)
  await Promise.all(
    workspaces.map(async (ws) => {
      const links = await listArtifacts({ workspaceId: ws.id, kind: "DOC_LINK" });
      for (const a of links) {
        results.push({
          id: a.id,
          title: (a as any).title,
          url: (a as any).url,
          label: (a as any).label, // may be undefined if not set
          updated_at: a.updated_at,
          workspace: a.workspace,
        });
      }
    })
  );
  return results.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
}
