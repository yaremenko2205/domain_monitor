"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Share2, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { DomainShare } from "@/types";

interface ShareDomainDialogProps {
  domainId: number;
  domainName: string;
}

export function ShareDomainDialog({
  domainId,
  domainName,
}: ShareDomainDialogProps) {
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState<DomainShare[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<
    "read" | "edit" | "full_control"
  >("read");
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (open) {
      fetchShares();
    }
  }, [open]);

  async function fetchShares() {
    setLoading(true);
    try {
      const res = await fetch(`/api/domains/${domainId}/shares`);
      const data = await res.json();
      setShares(data);
    } catch {
      toast.error("Failed to load shares");
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    if (!email.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    setSharing(true);
    try {
      const res = await fetch(`/api/domains/${domainId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, permission }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          data.updated
            ? "Permission updated"
            : `Shared with ${email}`
        );
        setEmail("");
        fetchShares();
      } else {
        toast.error(data.error || "Share failed");
      }
    } catch {
      toast.error("Failed to share domain");
    } finally {
      setSharing(false);
    }
  }

  async function handleRemoveShare(shareId: number) {
    try {
      const res = await fetch(`/api/domains/${domainId}/shares`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId }),
      });
      if (res.ok) {
        toast.success("Share removed");
        fetchShares();
      } else {
        toast.error("Failed to remove share");
      }
    } catch {
      toast.error("Failed to remove share");
    }
  }

  const permissionLabel = {
    read: "Read only",
    edit: "Edit",
    full_control: "Full control",
  };

  const permissionColor = {
    read: "secondary" as const,
    edit: "default" as const,
    full_control: "destructive" as const,
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share {domainName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Share with user</Label>
            <div className="flex gap-2">
              <Input
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleShare()}
              />
              <Select
                value={permission}
                onValueChange={(v) =>
                  setPermission(v as "read" | "edit" | "full_control")
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Read only</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="full_control">Full control</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleShare}
              disabled={sharing || !email}
              size="sm"
            >
              {sharing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="mr-2 h-4 w-4" />
              )}
              Share
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Current shares</Label>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : shares.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Not shared with anyone
              </p>
            ) : (
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-2 rounded border"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {share.sharedWithName || share.sharedWithEmail}
                      </p>
                      {share.sharedWithName && share.sharedWithEmail && (
                        <p className="text-xs text-muted-foreground">
                          {share.sharedWithEmail}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={permissionColor[share.permission]}>
                        {permissionLabel[share.permission]}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveShare(share.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
