"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Upload, Download, FileJson, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { parseCsvDomains } from "@/lib/csv";
import { ImportPreviewDialog } from "@/components/import-preview-dialog";
import type { DomainExportEntry } from "@/lib/config";
import type { DomainWithExpiry } from "@/types";

export function ImportExportButtons({
  onImported,
  existingDomains,
}: {
  onImported: () => void;
  existingDomains: DomainWithExpiry[];
}) {
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [previewEntries, setPreviewEntries] = useState<DomainExportEntry[] | null>(null);

  async function handleJsonImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.domains || !Array.isArray(data.domains)) {
        toast.error('Invalid format. Expected { "domains": [...] }');
        return;
      }

      setPreviewEntries(data.domains as DomainExportEntry[]);
    } catch {
      toast.error("Invalid JSON file");
    }

    if (jsonInputRef.current) jsonInputRef.current.value = "";
  }

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const entries = parseCsvDomains(text);
      setPreviewEntries(entries as DomainExportEntry[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid CSV file");
    }

    if (csvInputRef.current) csvInputRef.current.value = "";
  }

  async function handleConfirmImport(selectedEntries: DomainExportEntry[]) {
    try {
      const res = await fetch("/api/domains/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domains: selectedEntries }),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success(
          `Imported ${result.imported} domain(s), skipped ${result.skipped}`
        );
        onImported();
      } else {
        toast.error(result.error || "Import failed");
      }
    } catch {
      toast.error("Import failed");
    }
    setPreviewEntries(null);
  }

  return (
    <>
      <div className="flex gap-2">
        <input
          type="file"
          ref={jsonInputRef}
          accept=".json"
          onChange={handleJsonImport}
          className="hidden"
        />
        <input
          type="file"
          ref={csvInputRef}
          accept=".csv"
          onChange={handleCsvImport}
          className="hidden"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => jsonInputRef.current?.click()}>
              <FileJson className="mr-2 h-4 w-4" />
              Import JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => csvInputRef.current?.click()}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Import CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => window.open("/api/domains/export", "_blank")}
            >
              <FileJson className="mr-2 h-4 w-4" />
              Export JSON
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => window.open("/api/domains/export-csv", "_blank")}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {previewEntries && (
        <ImportPreviewDialog
          entries={previewEntries}
          existingDomains={existingDomains}
          onConfirm={handleConfirmImport}
          onCancel={() => setPreviewEntries(null)}
        />
      )}
    </>
  );
}
