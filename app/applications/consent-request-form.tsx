"use client";

import { useActionState } from "react";
import { createConsent } from "@/modules/consent/actions";

export function ConsentRequestForm({ applicationId }: { applicationId: string }) {
  const [state, action, pending] = useActionState(createConsent, null);

  return (
    <form action={action} className="flex flex-col gap-2">
      <p className="text-sm font-medium">Consent Wali</p>
      <input type="hidden" name="applicationId" value={applicationId} />
      <p className="text-sm text-ink-2">
        Opportunity ini atau status akun Anda mewajibkan persetujuan
        orang tua/wali. Link persetujuan akan dikirim ke email wali.
      </p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="guardianEmail" className="text-sm font-medium">
          Email Wali
        </label>
        <input
          id="guardianEmail"
          name="guardianEmail"
          type="email"
          required
          placeholder="wali@email.com"
        />
      </div>
      {state && !state.success && (
        <p
          role="alert"
          className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]"
        >
          {state.error.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn-primary self-start px-4 py-2 text-sm"
      >
        {pending ? "Mengajukan..." : "Ajukan Consent"}
      </button>
    </form>
  );
}
