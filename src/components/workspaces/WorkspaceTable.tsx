"use client";

import { Button } from "@/components/ui/button";
import { type Workspace } from "@/lib/api/workspaces";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { EnvironmentBadges } from "./EnvironmentBadges";
import { WorkspaceActions } from "./WorkspaceActions";

interface WorkspaceTableProps {
  workspaces: Workspace[];
  isLoading: boolean;
  onWorkspaceDeleted: (id: number) => void;
}

export function WorkspaceTable({
  workspaces,
  isLoading,
  onWorkspaceDeleted,
}: WorkspaceTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<Workspace>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium hover:bg-transparent"
          >
            Workspace
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium">{row.original.name}</div>
            {row.original.description && (
              <div className="text-sm text-muted-foreground line-clamp-2">
                {row.original.description}
              </div>
            )}
          </div>
        ),
        enableSorting: true,
      },
      {
        id: "environments",
        header: "Environments",
        cell: ({ row }) => <EnvironmentBadges workspace={row.original} />,
        enableSorting: false,
      },
      {
        id: "artifacts",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium hover:bg-transparent"
          >
            Artifacts
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const total = Object.values(
            row.original.artifact_counts || {}
          ).reduce((sum, count) => sum + count, 0);
          return (
            <span className="text-muted-foreground">
              {total} {total === 1 ? "artifact" : "artifacts"}
            </span>
          );
        },
        sortingFn: (rowA, rowB) => {
          const totalA = Object.values(
            rowA.original.artifact_counts || {}
          ).reduce((sum, count) => sum + count, 0);
          const totalB = Object.values(
            rowB.original.artifact_counts || {}
          ).reduce((sum, count) => sum + count, 0);
          return totalA - totalB;
        },
        enableSorting: true,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <WorkspaceActions
            workspace={row.original}
            onDeleted={onWorkspaceDeleted}
          />
        ),
        enableSorting: false,
        size: 50,
      },
    ],
    [onWorkspaceDeleted]
  );

  const table = useReactTable({
    data: workspaces,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/6" />
              <div className="h-4 bg-muted animate-pulse rounded w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-muted-foreground">
          <p className="text-lg font-medium">No workspaces found</p>
          <p className="mt-1">Create your first workspace to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
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
        <tbody className="divide-y divide-border">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-muted/50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
