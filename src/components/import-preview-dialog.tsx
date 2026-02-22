"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DomainExportEntry } from "@/lib/config";
import type { DomainWithExpiry } from "@/types";

interface ImportPreviewDialogProps {
  entries: DomainExportEntry[];
  existingDomains: DomainWithExpiry[];
  onConfirm: (selected: DomainExportEntry[]) => Promise<void>;
  onCancel: () => void;
}

interface EntryWithStatus extends DomainExportEntry {
  index: number;
  isDuplicate: boolean;
}

export function ImportPreviewDialog({
  entries,
  existingDomains,
  onConfirm,
  onCancel,
}: ImportPreviewDialogProps) {
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [importing, setImporting] = useState(false);

  const existingDomainSet = useMemo(
    () => new Set(existingDomains.map((d) => d.domain.toLowerCase().trim())),
    [existingDomains]
  );

  const entriesWithStatus: EntryWithStatus[] = useMemo(
    () =>
      entries.map((entry, index) => ({
        ...entry,
        index,
        isDuplicate: existingDomainSet.has(entry.domain.toLowerCase().trim()),
      })),
    [entries, existingDomainSet]
  );

  // Initialize selection: non-duplicates checked, duplicates unchecked
  useEffect(() => {
    const initial: Record<number, boolean> = {};
    entriesWithStatus.forEach((entry) => {
      initial[entry.index] = !entry.isDuplicate;
    });
    setSelected(initial);
  }, [entriesWithStatus]);

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const duplicateCount = entriesWithStatus.filter((e) => e.isDuplicate).length;
  const totalCount = entries.length;
  const allSelected = selectedCount === totalCount && totalCount > 0;
  const someSelected = selectedCount > 0 && selectedCount < totalCount;

  function toggleAll(checked: boolean) {
    const next: Record<number, boolean> = {};
    entriesWithStatus.forEach((entry) => {
      next[entry.index] = checked;
    });
    setSelected(next);
  }

  function toggleEntry(index: number) {
    setSelected((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  async function handleConfirm() {
    const selectedEntries = entriesWithStatus
      .filter((e) => selected[e.index])
      .map(({ index, isDuplicate, ...entry }) => entry);

    if (selectedEntries.length === 0) return;

    setImporting(true);
    await onConfirm(selectedEntries);
    setImporting(false);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !importing && onCancel()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Preview</DialogTitle>
          <DialogDescription>
            Review domains before importing. Duplicates are unchecked by default.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{selectedCount}</strong> of{" "}
            {totalCount} selected
          </span>
          {duplicateCount > 0 && (
            <span>
              <strong className="text-amber-600 dark:text-amber-400">
                {duplicateCount}
              </strong>{" "}
              {duplicateCount === 1 ? "duplicate" : "duplicates"} found
            </span>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={(checked) => toggleAll(!!checked)}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entriesWithStatus.map((entry) => (
                <TableRow
                  key={entry.index}
                  className={cn(entry.isDuplicate && "opacity-60")}
                >
                  <TableCell>
                    <Checkbox
                      checked={!!selected[entry.index]}
                      onCheckedChange={() => toggleEntry(entry.index)}
                      aria-label={`Select ${entry.domain}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{entry.domain}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {entry.notes || "—"}
                  </TableCell>
                  <TableCell>
                    {entry.enabled === false ? (
                      <Badge variant="outline" className="text-muted-foreground">
                        Disabled
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-300 dark:text-green-400 dark:border-green-700">
                        Enabled
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{entry.ownerAccount || "—"}</TableCell>
                  <TableCell>
                    {entry.isDuplicate ? (
                      <Badge
                        variant="outline"
                        className="text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700"
                      >
                        Duplicate
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-700"
                      >
                        New
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {entriesWithStatus.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No domains found in file
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={importing}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedCount === 0 || importing}
          >
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              `Import Selected (${selectedCount})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
