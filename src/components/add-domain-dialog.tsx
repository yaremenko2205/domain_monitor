"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AddDomainDialog({
  onAdded,
}: {
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [notes, setNotes] = useState("");
  const [ownerAccount, setOwnerAccount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentMethodExpiry, setPaymentMethodExpiry] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: domain.trim(),
          notes: notes.trim() || undefined,
          ownerAccount: ownerAccount.trim() || undefined,
          paymentMethod: paymentMethod.trim() || undefined,
          paymentMethodExpiry: paymentMethodExpiry.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to add domain");
        return;
      }

      toast.success(`Added ${domain.trim()}`);
      setDomain("");
      setNotes("");
      setOwnerAccount("");
      setPaymentMethod("");
      setPaymentMethodExpiry("");
      setOpen(false);
      onAdded();
    } catch {
      toast.error("Failed to add domain");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Domain
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Domain</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Domain Name</Label>
            <Input
              id="domain"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Main website, blog, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerAccount">Owner Account (optional)</Label>
            <Input
              id="ownerAccount"
              placeholder="Company name"
              value={ownerAccount}
              onChange={(e) => setOwnerAccount(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">CC Last 4 (optional)</Label>
              <Input
                id="paymentMethod"
                placeholder="1234"
                value={paymentMethod}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setPaymentMethod(val);
                }}
                maxLength={4}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentExpiry">Card Expiry (optional)</Label>
              <Input
                id="paymentExpiry"
                placeholder="MM/YY"
                value={paymentMethodExpiry}
                onChange={(e) => setPaymentMethodExpiry(e.target.value)}
                maxLength={5}
                disabled={loading}
              />
            </div>
          </div>
          <Button type="submit" disabled={loading || !domain.trim()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding & checking WHOIS...
              </>
            ) : (
              "Add Domain"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
