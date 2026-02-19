export function domainsToCsv(
  entries: Array<{ domain: string; notes?: string | null; enabled: boolean }>
): string {
  const header = "domain,notes,enabled";
  const rows = entries.map((e) => {
    const domain = escapeCsvField(e.domain);
    const notes = escapeCsvField(e.notes || "");
    const enabled = e.enabled ? "true" : "false";
    return `${domain},${notes},${enabled}`;
  });
  return [header, ...rows].join("\n");
}

export function parseCsvDomains(
  csvText: string
): Array<{ domain: string; notes?: string; enabled?: boolean }> {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");

  if (lines.length === 0) {
    throw new Error("CSV file is empty");
  }

  const header = lines[0].toLowerCase().trim();
  if (!header.startsWith("domain")) {
    throw new Error('CSV must start with a header row containing "domain"');
  }

  const results: Array<{
    domain: string;
    notes?: string;
    enabled?: boolean;
  }> = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    if (fields.length === 0) continue;

    const domain = fields[0]?.trim();
    if (!domain) continue;

    const notes = fields[1]?.trim() || undefined;
    const enabledStr = fields[2]?.trim().toLowerCase();
    const enabled =
      enabledStr === "false" || enabledStr === "0" ? false : true;

    results.push({ domain, notes, enabled });
  }

  return results;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  fields.push(current);
  return fields;
}

function escapeCsvField(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
