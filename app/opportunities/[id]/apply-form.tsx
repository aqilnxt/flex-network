"use client";

import { useActionState } from "react";
import { apply } from "@/modules/application/actions";

export function ApplyForm({
  opportunityId,
  existingStatus,
}: {
  opportunityId: string;
  existingStatus: string | null;
}) {
  const [state, action, pending] = useActionState(apply, null);

  if (existingStatus) {
    return (
      <p className="mt-6 border-t pt-4 text-sm text-gray-600">
        Status aplikasi kamu: <span className="font-semibold">{existingStatus}</span>
      </p>
    );
  }

  return (
    <form action={action} className="mt-6 border-t pt-4 flex flex-col gap-3">
      <h2 className="font-semibold">Lamar Opportunity Ini</h2>
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <textarea
        name="message"
        placeholder="Pesan ke hirer (opsional)"
        className="border rounded px-3 py-2"
        maxLength={1000}
      />
      {state && !state.success && (
        <p className="text-red-500">{state.error.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-blue-600 text-white rounded px-4 py-2 self-start disabled:opacity-50"
      >
        {pending ? "Mengirim..." : "Apply"}
      </button>
    </form>
  );
}
