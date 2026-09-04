"use client";

import { useActionState } from "react";
import { submitReportAction } from "@/modules/report/actions";

interface ReportFormProps {
  targetUserId?: string;
  targetOpportunityId?: string;
  targetApplicationId?: string;
}

export function ReportForm({
  targetUserId,
  targetOpportunityId,
  targetApplicationId,
}: ReportFormProps) {
  const [state, formAction, isPending] = useActionState(submitReportAction, null);

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
      {targetUserId && <input type="hidden" name="targetUserId" value={targetUserId} />}
      {targetOpportunityId && (
        <input type="hidden" name="targetOpportunityId" value={targetOpportunityId} />
      )}
      {targetApplicationId && (
        <input type="hidden" name="targetApplicationId" value={targetApplicationId} />
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Reason for Report</label>
        <textarea
          name="reason"
          required
          rows={4}
          className="w-full border rounded p-2 text-sm"
          placeholder="Please describe why you are reporting this..."
        />
      </div>

      {state && !state.success && (
        <p className="text-red-500 text-sm">{state.error.message}</p>
      )}

      {state && state.success && (
        <p className="text-green-500 text-sm">Report submitted successfully.</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Submitting..." : "Submit Report"}
      </button>
    </form>
  );
}
