"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { DashboardStats } from "@/components/dashboard-stats";
import { AddDomainDialog } from "@/components/add-domain-dialog";
import { CheckAllButton } from "@/components/check-button";
import { ImportExportButtons } from "@/components/import-export-buttons";
import { DataTable } from "@/components/data-table";
import { getDomainColumns } from "@/components/domain-columns";
import { useUserRole } from "@/hooks/use-user-role";
import { toast } from "sonner";
import type { DomainWithExpiry } from "@/types";

export function DomainDashboard() {
  const [domains, setDomains] = useState<DomainWithExpiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<DomainWithExpiry | null>(
    null
  );
  const { role, isViewer } = useUserRole();

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

  const columns = useMemo(
    () =>
      getDomainColumns({
        role,
        onToggleEnabled: handleToggleEnabled,
        onDelete: (d) => setDeleteTarget(d),
        onDomainUpdated: fetchDomains,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [role]
  );

  const filterOptions = useMemo(() => {
    const filters = [
      {
        column: "status",
        title: "Status",
        options: [
          { label: "Active", value: "active" },
          { label: "Expiring Soon", value: "expiring_soon" },
          { label: "Expired", value: "expired" },
          { label: "Unknown", value: "unknown" },
          { label: "Error", value: "error" },
        ],
      },
    ];

    // Add owner filter if there are unique owners (admin/user only)
    if (!isViewer) {
      const uniqueOwners = [
        ...new Set(
          domains
            .map((d) => d.ownerAccount)
            .filter((o): o is string => Boolean(o))
        ),
      ];
      if (uniqueOwners.length > 0) {
        filters.push({
          column: "ownerAccount",
          title: "Owner",
          options: uniqueOwners.map((o) => ({ label: o, value: o })),
        });
      }
    }

    return filters;
  }, [domains, isViewer]);

  return (
    <div className="space-y-6">
      <DashboardStats domains={domains} />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {!isViewer && <AddDomainDialog onAdded={fetchDomains} />}
          <CheckAllButton onDone={fetchDomains} />
        </div>
        {!isViewer && <ImportExportButtons onImported={fetchDomains} />}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading...
        </div>
      ) : domains.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No domains yet</p>
          <p className="text-sm mt-1">Add a domain to start monitoring</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={domains}
          searchKey="domain"
          searchPlaceholder="Search domains..."
          filterOptions={filterOptions}
        />
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
