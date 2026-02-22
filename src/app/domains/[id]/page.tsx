"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { ShareDomainDialog } from "@/components/share-domain-dialog";
import { useUserRole } from "@/hooks/use-user-role";
import { ArrowLeft, Trash2, Save, Loader2, Users } from "lucide-react";
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
  const { role, isViewer } = useUserRole();
  const [domain, setDomain] = useState<DomainDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [ownerAccount, setOwnerAccount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentMethodExpiry, setPaymentMethodExpiry] = useState("");
  const [saving, setSaving] = useState(false);

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
      setOwnerAccount(data.ownerAccount || "");
      setPaymentMethod(data.paymentMethod || "");
      setPaymentMethodExpiry(data.paymentMethodExpiry || "");
    } catch {
      toast.error("Failed to load domain");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchDomain();
  }, [fetchDomain]);

  async function handleSave() {
    if (!domain) return;
    setSaving(true);
    try {
      await fetch(`/api/domains/${domain.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          ownerAccount: ownerAccount || null,
          paymentMethod: paymentMethod || null,
          paymentMethodExpiry: paymentMethodExpiry || null,
        }),
      });
      toast.success("Domain updated");
      fetchDomain();
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
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

  const canEdit =
    !isViewer &&
    (domain.isOwner ||
      domain.permission === "edit" ||
      domain.permission === "full_control");
  const canDelete =
    !isViewer &&
    (domain.isOwner || domain.permission === "full_control");
  const canShare =
    !isViewer &&
    (domain.isOwner || domain.permission === "full_control");

  const hasChanges =
    notes !== (domain.notes || "") ||
    ownerAccount !== (domain.ownerAccount || "") ||
    paymentMethod !== (domain.paymentMethod || "") ||
    paymentMethodExpiry !== (domain.paymentMethodExpiry || "");

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
          {domain.isOwner === false && (
            <Badge variant="outline">
              <Users className="mr-1 h-3 w-3" />
              Shared ({domain.permission})
            </Badge>
          )}
          <CheckSingleButton domainId={domain.id} onDone={fetchDomain} />
          {canShare && (
            <ShareDomainDialog
              domainId={domain.id}
              domainName={domain.domain}
            />
          )}
        </div>
        {canDelete && (
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
                  Are you sure you want to delete{" "}
                  <strong>{domain.domain}</strong>? This will also remove all
                  notification history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <DomainDetailCard domain={domain} role={role} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {canEdit ? "Edit Details" : "Details"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this domain..."
              rows={3}
              disabled={!canEdit}
            />
          </div>

          {!isViewer && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Owner Account</Label>
                  <Input
                    value={ownerAccount}
                    onChange={(e) => setOwnerAccount(e.target.value)}
                    placeholder="Company name"
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Method (last 4)</Label>
                  <Input
                    value={paymentMethod}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setPaymentMethod(val);
                    }}
                    placeholder="1234"
                    maxLength={4}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Card Expiry</Label>
                  <Input
                    value={paymentMethodExpiry}
                    onChange={(e) => setPaymentMethodExpiry(e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </>
          )}

          {canEdit && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          )}
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
