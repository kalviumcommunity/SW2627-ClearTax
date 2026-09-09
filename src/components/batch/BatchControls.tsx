"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";


type BatchControlsProps = {
  batchId: string;
  status: string;
};

export default function BatchControls({
  batchId,
  status,
}: BatchControlsProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(batchId);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  }

  function handleRefresh() {
  setRefreshing(true);
  router.refresh();

  window.setTimeout(() => {
    setRefreshing(false);
  }, 800);
}

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
      >
        {copied ? "Copied" : "Copy batch ID"}
      </button>

      <button
        type="button"
        onClick={handleRefresh}
        disabled={refreshing}
        className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        {refreshing ? "Refreshing..." : "Refresh status"}
      </button>

      <span className="text-xs text-slate-500">
        Current status: {status}
      </span>
    </div>
  );
}