"use client";

import { useActionState } from "react";
import { createContract } from "@/modules/contract/actions";

export function ContractCreateForm({ applicationId }: { applicationId: string }) {
  const [state, action, pending] = useActionState(createContract, null);

  return (
    <form action={action} className="mt-3 border-t pt-3 flex flex-col gap-2">
      <p className="text-sm font-medium">Buat Kontrak (DRAFT)</p>
      <input type="hidden" name="applicationId" value={applicationId} />
      <input
        name="roleTitle"
        placeholder="Judul peran (mis. Frontend Developer Intern)"
        required
        minLength={3}
        maxLength={120}
        className="border rounded px-3 py-1"
      />
      <textarea
        name="description"
        placeholder="Deskripsi pekerjaan (opsional)"
        maxLength={2000}
        className="border rounded px-3 py-2"
      />
      <textarea
        name="responsibilities"
        placeholder="Tanggung jawab (opsional)"
        maxLength={2000}
        className="border rounded px-3 py-2"
      />
      <div className="flex flex-wrap gap-2">
        <input
          name="duration"
          placeholder="Durasi (mis. 3 bulan)"
          maxLength={100}
          className="border rounded px-3 py-1"
        />
        <input
          name="location"
          placeholder="Lokasi (opsional)"
          maxLength={120}
          className="border rounded px-3 py-1"
        />
        <input
          name="compensation"
          type="number"
          min={0}
          placeholder="Kompensasi (Rp, opsional)"
          className="border rounded px-3 py-1"
        />
      </div>
      <textarea
        name="termsConditions"
        placeholder="Syarat & ketentuan (opsional)"
        maxLength={2000}
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
        {pending ? "Menyimpan..." : "Simpan Draft"}
      </button>
    </form>
  );
}
