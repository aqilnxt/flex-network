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
      <input name="fullName" defaultValue={defaultFullName} placeholder="Nama lengkap" required />
      <input name="phone" defaultValue={defaultPhone} placeholder="Telepon" />
      <textarea name="bio" defaultValue={defaultBio} placeholder="Bio" rows={4} />
      <input name="location" defaultValue={defaultLocation} placeholder="Lokasi" />
      {state && !state.success && (
        <p className="text-red-500">{state.error.message}</p>
      )}
      <button type="submit" disabled={pending}>
        {pending ? "Loading..." : "Simpan"}
      </button>
    </form>
  );
}
