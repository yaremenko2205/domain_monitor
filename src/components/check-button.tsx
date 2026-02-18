"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function CheckAllButton({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/check-all", {
        method: "POST",
        headers: { "x-internal": "true" },
      });
      const data = await res.json();
      toast.success(`Checked ${data.checked} domain(s)`);
      onDone();
    } catch {
      toast.error("Check failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Checking...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Check All
        </>
      )}
    </Button>
  );
}

export function CheckSingleButton({
  domainId,
  onDone,
}: {
  domainId: number;
  onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/domains/${domainId}/check`, {
        method: "POST",
      });
      if (!res.ok) {
        toast.error("Check failed");
        return;
      }
      toast.success("WHOIS check complete");
      onDone();
    } catch {
      toast.error("Check failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
    </Button>
  );
}
