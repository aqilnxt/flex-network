"use client";

import { useActionState } from "react";
import { updateContractAction } from "@/modules/contract/actions";

export function ContractEditForm({
  contractId,
  initial,
}: {
  contractId: string;
  initial: {
    roleTitle: string;
    description: string;
    responsibilities: string;
    duration: string;
    location: string;
    compensation: string;
    termsConditions: string;
  };
}) {
  const [state, action, pending] = useActionState(updateContractAction, null);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="contractId" value={contractId} />
      <div>
        <label className="text-sm font-medium">Judul Peran</label>
        <input
          name="roleTitle"
          defaultValue={initial.roleTitle}
          required
          minLength={3}
          maxLength={120}
          className="border rounded px-3 py-1 w-full"
        />
      </div>
      <div>
        <label className="text-sm">Deskripsi</label>
        <textarea
          name="description"
          defaultValue={initial.description}
          maxLength={2000}
          className="border rounded px-3 py-2 w-full"
        />
      </div>
      <div>
        <label className="text-sm">Tanggung Jawab</label>
        <textarea
          name="responsibilities"
          defaultValue={initial.responsibilities}
          maxLength={2000}
          className="border rounded px-3 py-2 w-full"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          name="duration"
          placeholder="Durasi (mis. 3 bulan)"
          defaultValue={initial.duration}
          maxLength={100}
          className="border rounded px-3 py-1"
        />
        <input
          name="location"
          placeholder="Lokasi"
          defaultValue={initial.location}
          maxLength={120}
          className="border rounded px-3 py-1"
        />
        <input
          name="compensation"
          type="number"
          placeholder="Kompensasi (Rp)"
          defaultValue={initial.compensation}
          className="border rounded px-3 py-1"
        />
      </div>
      <div>
        <label className="text-sm">Syarat & Ketentuan</label>
        <textarea
          name="termsConditions"
          defaultValue={initial.termsConditions}
          maxLength={2000}
          className="border rounded px-3 py-2 w-full"
        />
      </div>
      {state && !state.success && (
        <p className="text-red-500">{state.error.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-blue-600 text-white rounded px-4 py-1 self-start disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
