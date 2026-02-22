"use client";

import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, DaysLeftBadge } from "@/components/status-badge";
import { CheckSingleButton } from "@/components/check-button";
import { ShareDomainDialog } from "@/components/share-domain-dialog";
import {
  ArrowUpDown,
  MoreHorizontal,
  Users,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { DomainWithExpiry, UserRole } from "@/types";

interface ColumnOptions {
  role: UserRole;
  onToggleEnabled: (domain: DomainWithExpiry) => void;
  onDelete: (domain: DomainWithExpiry) => void;
  onDomainUpdated: () => void;
}

export function getDomainColumns(
  options: ColumnOptions
): ColumnDef<DomainWithExpiry, unknown>[] {
  const { role, onToggleEnabled, onDelete, onDomainUpdated } = options;
  const isViewer = role === "viewer";

  const columns: ColumnDef<DomainWithExpiry, unknown>[] = [
    {
      accessorKey: "domain",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3"
        >
          Domain
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/domains/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.domain}
          </Link>
          {row.original.isOwner === false && (
            <Badge variant="outline" className="text-xs">
              <Users className="mr-1 h-3 w-3" />
              Shared
            </Badge>
          )}
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      filterFn: "equals",
    },
    {
      accessorKey: "daysUntilExpiry",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3"
        >
          Days Left
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <DaysLeftBadge days={row.original.daysUntilExpiry} />
      ),
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.daysUntilExpiry;
        const b = rowB.original.daysUntilExpiry;
        if (a === null && b === null) return 0;
        if (a === null) return 1;
        if (b === null) return -1;
        return a - b;
      },
    },
    {
      accessorKey: "expiryDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3"
        >
          Expiry Date
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm">{formatDate(row.original.expiryDate)}</span>
      ),
    },
    {
      accessorKey: "registrar",
      header: "Registrar",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.registrar || "—"}</span>
      ),
    },
    {
      accessorKey: "lastChecked",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3"
        >
          Last Checked
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.lastChecked)}
        </span>
      ),
    },
  ];

  // Owner/Payment columns — only visible to admin and user roles
  if (!isViewer) {
    columns.push(
      {
        accessorKey: "ownerAccount",
        header: "Owner",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.ownerAccount || "—"}
          </span>
        ),
        filterFn: "equals",
      },
      {
        accessorKey: "paymentMethod",
        header: "Payment",
        cell: ({ row }) => (
          <span className="text-sm font-mono">
            {row.original.paymentMethod
              ? `****${row.original.paymentMethod}`
              : "—"}
          </span>
        ),
      },
      {
        accessorKey: "paymentMethodExpiry",
        header: "Card Expiry",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.paymentMethodExpiry || "—"}
          </span>
        ),
      }
    );
  }

  // Enabled toggle column
  columns.push({
    accessorKey: "enabled",
    header: "Enabled",
    cell: ({ row }) => {
      const d = row.original;
      const canEdit =
        !isViewer &&
        (d.isOwner === true ||
          d.permission === "edit" ||
          d.permission === "full_control");
      return (
        <Switch
          checked={d.enabled}
          onCheckedChange={() => onToggleEnabled(d)}
          disabled={!canEdit}
        />
      );
    },
    enableSorting: false,
  });

  // Actions column
  columns.push({
    id: "actions",
    header: () => <span className="w-[100px]">Actions</span>,
    cell: ({ row }) => {
      const d = row.original;
      const canDeleteDomain =
        !isViewer &&
        (d.isOwner === true || d.permission === "full_control");
      const canShare =
        !isViewer &&
        (d.isOwner === true || d.permission === "full_control");

      return (
        <div className="flex items-center gap-1">
          <CheckSingleButton
            domainId={d.id}
            onDone={onDomainUpdated}
          />
          {canShare && (
            <ShareDomainDialog
              domainId={d.id}
              domainName={d.domain}
            />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/domains/${d.id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {canDeleteDomain && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(d)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  });

  return columns;
}
