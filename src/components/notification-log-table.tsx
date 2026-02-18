"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { NotificationLogEntry } from "@/types";

export function NotificationLogTable({
  logs,
}: {
  logs: NotificationLogEntry[];
}) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No notifications sent yet.
      </p>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Threshold</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Error</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-sm">
                {formatDate(log.sentAt)}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {log.channel}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{log.thresholdDays}d</TableCell>
              <TableCell>
                {log.success ? (
                  <Badge variant="default">Sent</Badge>
                ) : (
                  <Badge variant="destructive">Failed</Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                {log.error || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
