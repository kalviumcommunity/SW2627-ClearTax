"use client";

import { useRef, useState } from "react";

type UploadStatus = "idle" | "selected" | "uploading" | "completed" | "error";

export default function UploadProgress() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>("idle");

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);
    setProgress(0);
    setStatus("selected");
  }

  function handleUpload() {
    if (!file) {
      return;
    }

    setStatus("uploading");
    setProgress(0);

    // Upload API integration will be connected here
    // when the backend upload endpoint is available.
  }

  function handleReset() {
    setFile(null);
    setProgress(0);
    setStatus("idle");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div>
        <h2 className="font-semibold text-foreground">
          Upload Reconciliation File
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Select a file to begin reconciliation.
        </p>
      </div>

      <div className="mt-5">
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500
            file:mr-4 file:rounded-md file:border-0
            file:bg-primary file:px-4 file:py-2
            file:text-sm file:font-medium
            file:text-primary-foreground
            hover:file:bg-primary-hover"
        />
      </div>

      {file ? (
        <div className="mt-4 rounded-md border border-border bg-surface-muted p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {file.name}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            <span className="shrink-0 text-xs font-medium text-slate-500">
              {status === "selected" && "Ready"}
              {status === "uploading" && "Uploading"}
              {status === "completed" && "Completed"}
              {status === "error" && "Failed"}
            </span>
          </div>

          {status === "uploading" ||
          status === "completed" ||
          progress > 0 ? (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Upload progress</span>
                <span>{progress}%</span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleUpload}
              disabled={status === "uploading"}
              className="inline-flex h-9 items-center justify-center rounded-md
                bg-primary px-4 text-sm font-medium
                text-primary-foreground transition-colors
                hover:bg-primary-hover disabled:pointer-events-none
                disabled:opacity-50"
            >
              {status === "uploading" ? "Uploading..." : "Start Upload"}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-9 items-center justify-center rounded-md
                border border-border bg-surface px-4 text-sm font-medium
                text-foreground transition-colors hover:bg-surface-muted"
            >
              Remove
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}