"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DomainDetailCard } from "@/components/domain-detail-card";
import { NotificationLogTable } from "@/components/notification-log-table";
import { CheckSingleButton } from "@/components/check-button";
import { ArrowLeft, Trash2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { DomainWithExpiry, NotificationLogEntry } from "@/types";

interface DomainDetail extends DomainWithExpiry {
  whoisRaw?: string;
  notificationLogs: NotificationLogEntry[];
}

export default function DomainDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [domain, setDomain] = useState<DomainDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchDomain = useCallback(async () => {
    try {
      const res = await fetch(`/api/domains/${params.id}`);
      if (!res.ok) {
        toast.error("Domain not found");
        router.push("/");
        return;
      }
      const data = await res.json();
      setDomain(data);
      setNotes(data.notes || "");
    } catch {
      toast.error("Failed to load domain");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchDomain();
  }, [fetchDomain]);

  async function handleSaveNotes() {
    if (!domain) return;
    setSavingNotes(true);
    try {
      await fetch(`/api/domains/${domain.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      toast.success("Notes saved");
      fetchDomain();
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleDelete() {
    if (!domain) return;
    try {
      await fetch(`/api/domains/${domain.id}`, { method: "DELETE" });
      toast.success(`Deleted ${domain.domain}`);
      router.push("/");
    } catch {
      toast.error("Failed to delete domain");
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">Loading...</div>
    );
  }

  if (!domain) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{domain.domain}</h1>
          <CheckSingleButton domainId={domain.id} onDone={fetchDomain} />
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Domain</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{domain.domain}</strong>?
                This will also remove all notification history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <DomainDetailCard domain={domain} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this domain..."
            rows={3}
          />
          <Button
            size="sm"
            onClick={handleSaveNotes}
            disabled={savingNotes || notes === (domain.notes || "")}
          >
            {savingNotes ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Notes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification History</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationLogTable logs={domain.notificationLogs} />
        </CardContent>
      </Card>
    </div>
  );
}
