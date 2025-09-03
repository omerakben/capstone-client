"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Artifact, ArtifactKind, EnvCode } from "@/types";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Copy, Edit, GitBranch, MoreHorizontal, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

interface ArtifactsTableProps {
  artifacts: Artifact[];
  workspaceId: number;
  currentEnvironment: EnvCode;
  onArtifactUpdate: () => void;
}

const columnHelper = createColumnHelper<Artifact>();

export default function ArtifactsTable({
  artifacts,
  workspaceId: _workspaceId, // TODO: Use for artifact operations
  currentEnvironment,
  onArtifactUpdate: _onArtifactUpdate, // TODO: Use for refreshing data after operations
}: ArtifactsTableProps) {
  // Suppress unused variable warnings for future implementation
  void _workspaceId;
  void _onArtifactUpdate;
  const [kindFilter, setKindFilter] = useState<ArtifactKind | "ALL">("ALL");
  const [searchFilter, setSearchFilter] = useState("");

  // Filter artifacts by kind
  const filteredData = useMemo(() => {
    let filtered = artifacts;

    if (kindFilter !== "ALL") {
      filtered = filtered.filter((artifact) => artifact.kind === kindFilter);
    }

    return filtered;
  }, [artifacts, kindFilter]);

  // Column definitions
  const columns = useMemo(
    () => [
      columnHelper.accessor("kind", {
        header: "Type",
        cell: (info) => {
          const kind = info.getValue();
          const colors = {
            ENV_VAR: "bg-blue-100 text-blue-800 border-blue-200",
            PROMPT: "bg-green-100 text-green-800 border-green-200",
            DOC_LINK: "bg-purple-100 text-purple-800 border-purple-200",
          };

          return (
            <Badge className={`border ${colors[kind]}`}>
              {kind === "ENV_VAR"
                ? "Environment Variable"
                : kind === "PROMPT"
                ? "Prompt"
                : "Documentation Link"}
            </Badge>
          );
        },
        enableColumnFilter: false,
      }),
      columnHelper.display({
        id: "name",
        header: "Name",
        cell: (info) => {
          const artifact = info.row.original;

          switch (artifact.kind) {
            case "ENV_VAR":
              return (
                <div className="font-mono text-sm">
                  <span className="font-semibold">{artifact.key}</span>
                </div>
              );
            case "PROMPT":
            case "DOC_LINK":
              return (
                <div>
                  <span className="font-semibold">{artifact.title}</span>
                  {artifact.kind === "DOC_LINK" && artifact.label && (
                    <div className="text-xs text-gray-500 mt-1">
                      {artifact.label}
                    </div>
                  )}
                </div>
              );
            default:
              return null;
          }
        },
        enableColumnFilter: true,
        filterFn: (row, columnId, filterValue) => {
          const artifact = row.original;
          const searchTerm = filterValue.toLowerCase();

          switch (artifact.kind) {
            case "ENV_VAR":
              return artifact.key.toLowerCase().includes(searchTerm);
            case "PROMPT":
            case "DOC_LINK":
              return (
                artifact.title.toLowerCase().includes(searchTerm) ||
                (artifact.kind === "DOC_LINK" &&
                  artifact.label?.toLowerCase().includes(searchTerm)) ||
                false
              );
            default:
              return false;
          }
        },
      }),
      columnHelper.display({
        id: "preview",
        header: "Preview",
        cell: (info) => {
          const artifact = info.row.original;

          switch (artifact.kind) {
            case "ENV_VAR":
              return (
                <div className="font-mono text-sm max-w-xs truncate">
                  {artifact.value === "••••••" ? (
                    <span className="text-gray-400 italic">Hidden value</span>
                  ) : (
                    artifact.value
                  )}
                </div>
              );
            case "PROMPT":
              return (
                <div className="text-sm text-gray-600 max-w-xs truncate">
                  {artifact.content.substring(0, 100)}...
                </div>
              );
            case "DOC_LINK":
              return (
                <a
                  href={artifact.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm truncate max-w-xs block"
                >
                  {artifact.url}
                </a>
              );
            default:
              return null;
          }
        },
        enableColumnFilter: false,
      }),
      columnHelper.accessor("updated_at", {
        header: "Last Updated",
        cell: (info) => (
          <div className="text-sm text-gray-500">
            {new Date(info.getValue()).toLocaleDateString()}
          </div>
        ),
        enableColumnFilter: false,
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => {
          const artifact = info.row.original;
          const isMasked =
            artifact.kind === "ENV_VAR" && artifact.value === "••••••";

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleCopy(artifact)}
                  disabled={isMasked}
                  className={isMasked ? "opacity-50 cursor-not-allowed" : ""}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {isMasked ? "Cannot copy masked value" : "Copy value"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicate(artifact)}>
                  <GitBranch className="mr-2 h-4 w-4" />
                  Duplicate to environment
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(artifact)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(artifact)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        enableColumnFilter: false,
      }),
    ],
    []
  );

  // Table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters: [{ id: "name", value: searchFilter }],
    },
    onColumnFiltersChange: () => {}, // We handle this manually
  });

  // Action handlers
  const handleCopy = async (artifact: Artifact) => {
    if (artifact.kind === "ENV_VAR" && artifact.value === "••••••") {
      return; // Cannot copy masked values
    }

    let textToCopy = "";
    switch (artifact.kind) {
      case "ENV_VAR":
        textToCopy = artifact.value;
        break;
      case "PROMPT":
        textToCopy = artifact.content;
        break;
      case "DOC_LINK":
        textToCopy = artifact.url;
        break;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      // TODO: Show success toast
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDuplicate = (artifact: Artifact) => {
    // TODO: Implement duplicate modal
    console.log("Duplicate artifact:", artifact);
  };

  const handleEdit = (artifact: Artifact) => {
    // TODO: Implement edit modal
    console.log("Edit artifact:", artifact);
  };

  const handleDelete = (artifact: Artifact) => {
    // TODO: Implement delete confirmation
    console.log("Delete artifact:", artifact);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Search artifacts..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={kindFilter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setKindFilter("ALL")}
          >
            All ({artifacts.length})
          </Button>
          <Button
            variant={kindFilter === "ENV_VAR" ? "default" : "outline"}
            size="sm"
            onClick={() => setKindFilter("ENV_VAR")}
          >
            Variables ({artifacts.filter((a) => a.kind === "ENV_VAR").length})
          </Button>
          <Button
            variant={kindFilter === "PROMPT" ? "default" : "outline"}
            size="sm"
            onClick={() => setKindFilter("PROMPT")}
          >
            Prompts ({artifacts.filter((a) => a.kind === "PROMPT").length})
          </Button>
          <Button
            variant={kindFilter === "DOC_LINK" ? "default" : "outline"}
            size="sm"
            onClick={() => setKindFilter("DOC_LINK")}
          >
            Docs ({artifacts.filter((a) => a.kind === "DOC_LINK").length})
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {table.getRowModel().rows.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {searchFilter || kindFilter !== "ALL"
              ? "No artifacts match your filters"
              : `No artifacts in ${currentEnvironment} environment`}
          </div>
        )}
      </div>
    </div>
  );
}
