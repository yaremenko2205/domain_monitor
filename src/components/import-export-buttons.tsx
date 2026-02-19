"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Upload, Download, FileJson, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

export function ImportExportButtons({
  onImported,
}: {
  onImported: () => void;
}) {
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  async function handleJsonImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const res = await fetch("/api/domains/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
      toast.error("Invalid JSON file");
    }

    if (jsonInputRef.current) jsonInputRef.current.value = "";
  }

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/domains/import-csv", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (res.ok) {
        toast.success(
          `Imported ${result.imported} domain(s), skipped ${result.skipped}`
        );
        onImported();
      } else {
        toast.error(result.error || "CSV import failed");
      }
    } catch {
      toast.error("Invalid CSV file");
    }

    if (csvInputRef.current) csvInputRef.current.value = "";
  }

  return (
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
  );
}
