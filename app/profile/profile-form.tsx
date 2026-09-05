"use client";

import { useActionState } from "react";
import { updateProfile, updateTalentProfile } from "@/modules/profile/actions";

type ProfileFormProps = {
  defaultFullName: string;
  defaultPhone: string;
  defaultBio: string;
  defaultLocation: string;
  role: string;
  defaultPortfolioUrl: string;
  defaultCvUrl: string;
  defaultSchoolName: string;
  defaultGradeLevel: string;
};

export function ProfileForm({
  defaultFullName,
  defaultPhone,
  defaultBio,
  defaultLocation,
  role,
  defaultPortfolioUrl,
  defaultCvUrl,
  defaultSchoolName,
  defaultGradeLevel,
}: ProfileFormProps) {
  const [state, action, pending] = useActionState(updateProfile, null);
  const [talentState, talentAction, talentPending] = useActionState(
    updateTalentProfile,
    null,
  );

  return (
    <>
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

      {role === "TALENT" && (
        <form
          action={talentAction}
          className="mt-8 flex flex-col gap-4 border-t border-line pt-6"
        >
          <p className="text-sm font-semibold">Portfolio & Pendidikan</p>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="portfolioUrl" className="text-sm font-medium">
              Link Portfolio
            </label>
            <input
              id="portfolioUrl"
              name="portfolioUrl"
              type="url"
              defaultValue={defaultPortfolioUrl}
              placeholder="https://github.com/username"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cvUrl" className="text-sm font-medium">
              Link CV
            </label>
            <input
              id="cvUrl"
              name="cvUrl"
              type="url"
              defaultValue={defaultCvUrl}
              placeholder="https://drive.google.com/cv"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="schoolName" className="text-sm font-medium">
              Nama Sekolah
            </label>
            <input
              id="schoolName"
              name="schoolName"
              defaultValue={defaultSchoolName}
              placeholder="SMA Negeri 1 Jakarta"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="gradeLevel" className="text-sm font-medium">
              Kelas / Jenjang
            </label>
            <input
              id="gradeLevel"
              name="gradeLevel"
              defaultValue={defaultGradeLevel}
              placeholder="Kelas 11"
            />
          </div>
          {talentState && !talentState.success && (
            <p
              role="alert"
              className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]"
            >
              {talentState.error.message}
            </p>
          )}
          <button
            type="submit"
            disabled={talentPending}
            className="btn-primary mt-1 h-11 disabled:opacity-55"
          >
            {talentPending ? "Menyimpan..." : "Simpan Portfolio"}
          </button>
        </form>
      )}
    </>
  );
}
