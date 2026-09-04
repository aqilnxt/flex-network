"use client";

import { useActionState } from "react";
import { updateProfile } from "@/modules/profile/actions";

type ProfileFormProps = {
  defaultFullName: string;
  defaultPhone: string;
  defaultBio: string;
  defaultLocation: string;
};

export function ProfileForm({
  defaultFullName,
  defaultPhone,
  defaultBio,
  defaultLocation,
}: ProfileFormProps) {
  const [state, action, pending] = useActionState(updateProfile, null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-sm font-medium">
          Nama lengkap
        </label>
        <input
          id="fullName"
          name="fullName"
          defaultValue={defaultFullName}
          required
          autoComplete="name"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-sm font-medium">
          Telepon
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultPhone}
          autoComplete="tel"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="bio" className="text-sm font-medium">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={defaultBio}
          rows={4}
          placeholder="Ceritakan skill dan pengalamanmu"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="location" className="text-sm font-medium">
          Lokasi
        </label>
        <input
          id="location"
          name="location"
          defaultValue={defaultLocation}
          autoComplete="address-level2"
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
        className="btn-primary mt-1 h-11 disabled:opacity-55"
      >
        {pending ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
