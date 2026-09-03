"use client";

import { useState, type FormEvent } from "react";

import Card from "@/components/ui/Card";

import { createReconciliationSetup } from "@/app/(app)/actions/reconciliation";

export default function ReferenceImportSetupForm() {
  const [gstin, setGstin] = useState("");
  const [financialYear, setFinancialYear] = useState("");
  const [returnPeriod, setReturnPeriod] = useState("");
  const [originalFilename, setOriginalFilename] = useState("");
  const [storageObjectKey, setStorageObjectKey] = useState("");

  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[]>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result = await createReconciliationSetup({
        businessId,
        gstin,
        financialYear,
        returnPeriod,
        originalFilename,
        storageObjectKey: storageObjectKey || undefined,
      });

      if (
        result &&
        "success" in result &&
        result.success === false
      ) {
        setFieldErrors(result.fieldErrors);
        setMessage(result.formError);
        return;
      }

      setMessage("Reconciliation setup created successfully.");

      setGstin("");
      setFinancialYear("");
      setReturnPeriod("");
      setOriginalFilename("");
      setStorageObjectKey("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to create reconciliation setup.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mt-6 p-5">
      <h2 className="font-semibold text-foreground">
        Create Reconciliation Setup
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Create reconciliation metadata for your demo business.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-5 grid gap-4 sm:grid-cols-2"
      >
        {/* Business ID */}
        <div>
          <label className="text-sm font-medium text-foreground">
            Business ID
          </label>

          <input
            value={businessId}
            onChange={(event) => setBusinessId(event.target.value)}
            required
            className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          />

          {fieldErrors.businessId?.[0] ? (
            <p className="mt-1 text-sm text-error-foreground">
              {fieldErrors.businessId[0]}
            </p>
          ) : null}
        </div>

        {/* GSTIN */}
        <div>
          <label className="text-sm font-medium text-foreground">
            GSTIN
          </label>

          <input
            value={gstin}
            onChange={(event) => setGstin(event.target.value)}
            required
            className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          />

          {fieldErrors.gstin?.[0] ? (
            <p className="mt-1 text-sm text-error-foreground">
              {fieldErrors.gstin[0]}
            </p>
          ) : null}
        </div>

        {/* Financial Year */}
        <div>
          <label className="text-sm font-medium text-foreground">
            Financial Year
          </label>

          <input
            value={financialYear}
            onChange={(event) => setFinancialYear(event.target.value)}
            placeholder="2026-27"
            required
            className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          />

          {fieldErrors.financialYear?.[0] ? (
            <p className="mt-1 text-sm text-error-foreground">
              {fieldErrors.financialYear[0]}
            </p>
          ) : null}
        </div>

        {/* Return Period */}
        <div>
          <label className="text-sm font-medium text-foreground">
            Return Period
          </label>

          <input
            value={returnPeriod}
            onChange={(event) => setReturnPeriod(event.target.value)}
            placeholder="April"
            required
            className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          />

          {fieldErrors.returnPeriod?.[0] ? (
            <p className="mt-1 text-sm text-error-foreground">
              {fieldErrors.returnPeriod[0]}
            </p>
          ) : null}
        </div>

        {/* Original Filename */}
        <div>
          <label className="text-sm font-medium text-foreground">
            Original Filename
          </label>

          <input
            value={originalFilename}
            onChange={(event) => setOriginalFilename(event.target.value)}
            placeholder="GSTR-2B.xlsx"
            required
            className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          />

          {fieldErrors.originalFilename?.[0] ? (
            <p className="mt-1 text-sm text-error-foreground">
              {fieldErrors.originalFilename[0]}
            </p>
          ) : null}
        </div>

        {/* Storage Object Key */}
        <div>
          <label className="text-sm font-medium text-foreground">
            Storage Object Key
          </label>

          <input
            value={storageObjectKey}
            onChange={(event) => setStorageObjectKey(event.target.value)}
            placeholder="Optional"
            className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          />

          {fieldErrors.storageObjectKey?.[0] ? (
            <p className="mt-1 text-sm text-error-foreground">
              {fieldErrors.storageObjectKey[0]}
            </p>
          ) : null}
        </div>

        {/* Submit */}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Setup"}
          </button>

          {message ? (
            <p className="mt-3 text-sm text-slate-600">
              {message}
            </p>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
