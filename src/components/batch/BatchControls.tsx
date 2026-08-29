"use client";

import { useState } from "react";

type BatchControlsProps = {
  batchId: string;
  status: string;
};

export default function BatchControls({
  batchId,
  status,
}: BatchControlsProps) {
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
      >
        {copied ? "Copied" : "Copy batch ID"}
      </button>

      <span className="text-xs text-slate-500">
        Current status: {status}
      </span>
    </div>
  );
}