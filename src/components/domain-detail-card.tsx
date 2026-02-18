"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, DaysLeftBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import type { DomainWithExpiry } from "@/types";

export function DomainDetailCard({ domain }: { domain: DomainWithExpiry & { whoisRaw?: string } }) {
  let whoisData: Record<string, unknown> = {};
  if (domain.whoisRaw) {
    try {
      whoisData = JSON.parse(domain.whoisRaw);
    } catch {
      // ignore
    }
  }

  const nameServers: string[] = [];
  for (const server of Object.values(whoisData)) {
    const s = server as Record<string, unknown>;
    const ns = s?.["Name Server"] || s?.["nserver"];
    if (Array.isArray(ns)) {
      nameServers.push(...ns.map(String));
      break;
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Domain Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Domain" value={domain.domain} />
          <InfoRow label="Status">
            <StatusBadge status={domain.status} />
          </InfoRow>
          <InfoRow label="Days Until Expiry">
            <DaysLeftBadge days={domain.daysUntilExpiry} />
          </InfoRow>
          <InfoRow label="Expiry Date" value={formatDate(domain.expiryDate)} />
          <InfoRow label="Creation Date" value={formatDate(domain.creationDate)} />
          <InfoRow label="Registrar" value={domain.registrar || "—"} />
          <InfoRow label="Last Checked" value={formatDate(domain.lastChecked)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Monitoring" value={domain.enabled ? "Enabled" : "Disabled"} />
          <InfoRow label="Notes" value={domain.notes || "—"} />
          {nameServers.length > 0 && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">Name Servers</span>
              <ul className="mt-1 space-y-1">
                {nameServers.map((ns) => (
                  <li key={ns} className="text-sm font-mono">{ns}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children || <span className="text-sm font-medium">{value}</span>}
    </div>
  );
}
