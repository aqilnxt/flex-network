"use client";

import { useActionState } from "react";
import { scheduleMeeting } from "@/modules/meeting/actions";

export function ScheduleMeetingForm({
  applicationId,
  opportunityId,
}: {
  applicationId: string;
  opportunityId: string;
}) {
  const [state, action, pending] = useActionState(scheduleMeeting, null);

  return (
    <form action={action} className="mt-3 border-t pt-3 flex flex-col gap-2">
      <p className="text-sm font-medium">Jadwalkan Meeting</p>
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <div className="flex flex-wrap gap-2">
        <input
          type="date"
          name="meetingDate"
          required
          className="border rounded px-3 py-1"
        />
        <input type="time" name="meetingTime" required className="border rounded px-3 py-1" />
        <input
          name="meetingMethod"
          placeholder="Metode (mis. Google Meet)"
          maxLength={100}
          className="border rounded px-3 py-1"
        />
      </div>
      <input
        name="meetingLink"
        type="url"
        placeholder="Link meeting (opsional)"
        className="border rounded px-3 py-1"
      />
      <textarea
        name="notes"
        placeholder="Catatan (opsional)"
        maxLength={1000}
        className="border rounded px-3 py-2"
      />
      {state && !state.success && (
        <p className="text-red-500">{state.error.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-blue-600 text-white rounded px-4 py-1 self-start disabled:opacity-50"
      >
        {pending ? "Menjadwalkan..." : "Jadwalkan"}
      </button>
    </form>
  );
}
