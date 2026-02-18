"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusBadge, DaysLeftBadge } from "@/components/status-badge";
import { CheckSingleButton } from "@/components/check-button";
import { DashboardStats } from "@/components/dashboard-stats";
import { AddDomainDialog } from "@/components/add-domain-dialog";
import { CheckAllButton } from "@/components/check-button";
import { ImportExportButtons } from "@/components/import-export-buttons";
import { MoreHorizontal, Trash2, ExternalLink, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import type { DomainWithExpiry } from "@/types";

type SortField = "domain" | "expiryDate" | "daysUntilExpiry" | "lastChecked";
type SortDir = "asc" | "desc";

export function DomainDashboard() {
  const [domains, setDomains] = useState<DomainWithExpiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("daysUntilExpiry");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [deleteTarget, setDeleteTarget] = useState<DomainWithExpiry | null>(null);

  const fetchDomains = useCallback(async () => {
    try {
      const res = await fetch("/api/domains");
      const data = await res.json();
      setDomains(data);
    } catch {
      toast.error("Failed to load domains");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const sorted = [...domains].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (aVal === null && bVal === null) return 0;
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    if (typeof aVal === "string" && typeof bVal === "string") {
      return aVal.localeCompare(bVal) * dir;
    }
    return ((aVal as number) - (bVal as number)) * dir;
  });

  async function handleToggleEnabled(domain: DomainWithExpiry) {
    try {
      await fetch(`/api/domains/${domain.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !domain.enabled }),
      });
      fetchDomains();
    } catch {
      toast.error("Failed to update domain");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/domains/${deleteTarget.id}`, { method: "DELETE" });
      toast.success(`Deleted ${deleteTarget.domain}`);
      setDeleteTarget(null);
      fetchDomains();
    } catch {
      toast.error("Failed to delete domain");
    }
  }

  function SortButton({ field, children }: { field: SortField; children: React.ReactNode }) {
    return (
      <button
        onClick={() => toggleSort(field)}
        className="flex items-center gap-1 hover:text-foreground"
      >
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardStats domains={domains} />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <AddDomainDialog onAdded={fetchDomains} />
          <CheckAllButton onDone={fetchDomains} />
        </div>
        <ImportExportButtons onImported={fetchDomains} />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : domains.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No domains yet</p>
          <p className="text-sm mt-1">Add a domain to start monitoring</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton field="domain">Domain</SortButton>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <SortButton field="daysUntilExpiry">Days Left</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="expiryDate">Expiry Date</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="lastChecked">Last Checked</SortButton>
                </TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((d) => (
                <TableRow key={d.id} className={!d.enabled ? "opacity-50" : ""}>
                  <TableCell>
                    <Link
                      href={`/domains/${d.id}`}
                      className="font-medium hover:underline"
                    >
                      {d.domain}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={d.status} />
                  </TableCell>
                  <TableCell>
                    <DaysLeftBadge days={d.daysUntilExpiry} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(d.expiryDate)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(d.lastChecked)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={d.enabled}
                      onCheckedChange={() => handleToggleEnabled(d)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <CheckSingleButton
                        domainId={d.id}
                        onDone={fetchDomains}
                      />
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
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteTarget(d)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Domain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.domain}</strong>? This will also remove all
              notification history for this domain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
