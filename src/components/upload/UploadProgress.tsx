"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type UploadStatus = "idle" | "selected" | "uploading" | "completed" | "error";
type UploadMode = "gstr2b" | "purchase_register";

type ReferenceImportOption = {
  id: string;
  originalFilename: string;
  financialYear: string;
  returnPeriod: string;
  status: string;
};

type UploadProgressProps = {
  referenceImports: ReferenceImportOption[];
};

type ApiSuccessPayload = {
  success?: true;
  data?: {
    id?: string;
  };
};

type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
  };
};

const modeConfig: Record<
  UploadMode,
  {
    endpoint: string;
    accept: string;
    title: string;
    idleLabel: string;
  }
> = {
  gstr2b: {
    endpoint: "/api/reference-imports",
    accept: ".json,application/json,text/json",
    title: "GSTR-2B JSON",
    idleLabel: "Upload reference import",
  },
  purchase_register: {
    endpoint: "/api/reconciliation-batches",
    accept: ".csv,text/csv,application/csv",
    title: "Purchase Register CSV",
    idleLabel: "Upload purchase register",
  },
};

export default function UploadProgress({
  referenceImports,
}: UploadProgressProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<UploadMode>("gstr2b");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [resultLink, setResultLink] = useState<string | null>(null);
  const [financialYear, setFinancialYear] = useState("");
  const [returnPeriod, setReturnPeriod] = useState("");
  const [referenceImportId, setReferenceImportId] = useState(
    referenceImports[0]?.id ?? "",
  );

  const currentMode = modeConfig[mode];
  const selectedReferenceImportId =
    referenceImportId || referenceImports[0]?.id || "";

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);
    setProgress(0);
    setStatus("selected");
    setMessage("");
    setRequestId(null);
    setResultLink(null);
  }

  async function handleUpload() {
    if (!file) {
      return;
    }

    if (mode === "purchase_register" && !selectedReferenceImportId) {
      setStatus("error");
      setMessage("Select a reference import before uploading a purchase register.");
      return;
    }

    setStatus("uploading");
    setProgress(0);
    setMessage("");
    setRequestId(null);
    setResultLink(null);

    const formData = new FormData();
    formData.append("file", file);

    if (mode === "purchase_register") {
      formData.append("referenceImportId", selectedReferenceImportId);
    } else {
      if (financialYear.trim()) {
        formData.append("financialYear", financialYear.trim());
      }

      if (returnPeriod.trim()) {
        formData.append("returnPeriod", returnPeriod.trim());
      }
    }

    try {
      const response = await fetch(currentMode.endpoint, {
        method: "POST",
        body: formData,
      });
      const responseRequestId = response.headers.get("x-request-id");
      const payload = (await response.json().catch(() => null)) as
        | (ApiSuccessPayload & ApiErrorPayload)
        | null;

      setRequestId(responseRequestId);

      if (!response.ok) {
        setStatus("error");
        setMessage(getApiErrorMessage(payload));
        return;
      }

      const createdId = payload?.data?.id;

      setProgress(100);
      setStatus("completed");
      setMessage(`${currentMode.title} uploaded successfully.`);
      setResultLink(
        createdId
          ? mode === "gstr2b"
            ? `/reference-imports/${createdId}`
            : `/reconciliations/${createdId}`
          : null,
      );
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Upload failed unexpectedly.",
      );
    }
  }

  function handleModeChange(nextMode: UploadMode) {
    setMode(nextMode);
    handleReset();
  }

  function handleReset() {
    setFile(null);
    setProgress(0);
    setStatus("idle");
    setMessage("");
    setRequestId(null);
    setResultLink(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold text-foreground">
            Upload Reconciliation File
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {currentMode.idleLabel}
          </p>
        </div>

        <div className="inline-flex w-fit rounded-md border border-border bg-surface-muted p-1">
          <button
            type="button"
            onClick={() => handleModeChange("gstr2b")}
            className={`h-8 rounded px-3 text-sm font-medium transition-colors ${
              mode === "gstr2b"
                ? "bg-surface text-foreground shadow-sm"
                : "text-slate-500 hover:text-foreground"
            }`}
          >
            GSTR-2B
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("purchase_register")}
            className={`h-8 rounded px-3 text-sm font-medium transition-colors ${
              mode === "purchase_register"
                ? "bg-surface text-foreground shadow-sm"
                : "text-slate-500 hover:text-foreground"
            }`}
          >
            Purchase Register
          </button>
        </div>
      </div>

      {mode === "gstr2b" ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-foreground">
            Financial Year
            <input
              value={financialYear}
              onChange={(event) => setFinancialYear(event.target.value)}
              placeholder="2026-27"
              className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal"
            />
          </label>

          <label className="text-sm font-medium text-foreground">
            Return Period
            <input
              value={returnPeriod}
              onChange={(event) => setReturnPeriod(event.target.value)}
              placeholder="042026"
              className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal"
            />
          </label>
        </div>
      ) : (
        <label className="mt-5 block text-sm font-medium text-foreground">
          Reference Import
          <select
            value={selectedReferenceImportId}
            onChange={(event) => setReferenceImportId(event.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal"
          >
            {referenceImports.length > 0 ? (
              referenceImports.map((referenceImport) => (
                <option key={referenceImport.id} value={referenceImport.id}>
                  {referenceImport.originalFilename} -{" "}
                  {referenceImport.returnPeriod},{" "}
                  {referenceImport.financialYear} ({referenceImport.status})
                </option>
              ))
            ) : (
              <option value="">No reference imports available</option>
            )}
          </select>
        </label>
      )}

      <div className="mt-5">
        <input
          ref={inputRef}
          type="file"
          accept={currentMode.accept}
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
              disabled={
                status === "uploading" ||
                (mode === "purchase_register" && referenceImports.length === 0)
              }
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

      {message ? (
        <div
          className={`mt-4 rounded-md border p-4 text-sm ${
            status === "error"
              ? "border-error bg-error-surface text-error-foreground"
              : "border-border bg-surface-muted text-slate-600"
          }`}
        >
          <p>{message}</p>

          {requestId ? (
            <p className="mt-1 font-mono text-xs">Request ID: {requestId}</p>
          ) : null}

          {resultLink ? (
            <a
              href={resultLink}
              className="mt-3 inline-flex h-8 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              Open record
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function getApiErrorMessage(payload: (ApiErrorPayload & ApiSuccessPayload) | null) {
  return (
    payload?.error?.message ??
    payload?.error?.code ??
    "Upload failed. Check the file and try again."
  );
}
