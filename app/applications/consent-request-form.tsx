"use client";

import { useActionState } from "react";
import { createConsent } from "@/modules/consent/actions";

export function ConsentRequestForm({ applicationId }: { applicationId: string }) {
  const [state, action, pending] = useActionState(createConsent, null);

  return (
    <form action={action} className="flex flex-col gap-2">
      <p className="text-sm font-medium">Consent Wali (Simulasi)</p>
      <input type="hidden" name="applicationId" value={applicationId} />
      <p className="text-sm text-gray-600">
        Opportunity ini atau status akun Anda mewajibkan persetujuan
        orang tua/wali. Deklarasi bersifat simulasi — tidak ada data wali
        yang dikumpulkan.
      </p>
      {state && !state.success && (
        <p className="text-red-500">{state.error.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-blue-600 text-white rounded px-4 py-1 self-start disabled:opacity-50"
      >
        {pending ? "Mengajukan..." : "Ajukan Consent"}
      </button>
    </form>
  );
}
