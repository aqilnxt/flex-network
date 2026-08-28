"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/result";
import {
  OPPORTUNITY_TYPES,
  WORK_MODES,
  COMPENSATION_TYPES,
} from "@/modules/opportunity/schemas";

export type OpportunityFormProps = {
  action: (
    prev: ActionResult | null,
    formData: FormData,
  ) => Promise<ActionResult>;
  submitLabel: string;
  defaultValues?: {
    title?: string;
    description?: string;
    opportunityType?: string;
    location?: string;
    workMode?: string;
    startDate?: string;
    endDate?: string;
    workingHours?: string;
    duration?: string;
    compensation?: number | null;
    compensationType?: string;
    requirements?: string;
    responsibilities?: string;
    otherTerms?: string;
    maxTalent?: number | null;
    applicationDeadline?: string;
    requiresConsent?: boolean;
    cvRequirement?: boolean;
    portfolioRequirement?: boolean;
    interviewRequirement?: boolean;
    meetingMethod?: string;
    skillIds?: string;
    interestIds?: string;
  };
};

export function OpportunityForm({
  action,
  submitLabel,
  defaultValues = {},
}: OpportunityFormProps) {
  const [state, formAction, pending] = useActionState(action, null);

  const input =
    "border rounded px-3 py-2 w-full";
  const label = "block text-sm font-medium mb-1";

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-2xl">
      <div>
        <label className={label}>Judul</label>
        <input
          className={input}
          name="title"
          defaultValue={defaultValues.title}
          minLength={5}
          required
        />
      </div>

      <div>
        <label className={label}>Deskripsi</label>
        <textarea
          className={input}
          name="description"
          defaultValue={defaultValues.description}
          minLength={10}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Tipe</label>
          <select
            className={input}
            name="opportunityType"
            defaultValue={defaultValues.opportunityType}
            required
          >
            {OPPORTUNITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Mode Kerja</label>
          <select
            className={input}
            name="workMode"
            defaultValue={defaultValues.workMode ?? "ONSITE"}
          >
            {WORK_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={label}>Lokasi</label>
        <input className={input} name="location" defaultValue={defaultValues.location} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Tanggal Mulai</label>
          <input
            className={input}
            type="date"
            name="startDate"
            defaultValue={defaultValues.startDate}
          />
        </div>
        <div>
          <label className={label}>Tanggal Selesai</label>
          <input
            className={input}
            type="date"
            name="endDate"
            defaultValue={defaultValues.endDate}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Jam Kerja</label>
          <input
            className={input}
            name="workingHours"
            defaultValue={defaultValues.workingHours}
          />
        </div>
        <div>
          <label className={label}>Durasi</label>
          <input className={input} name="duration" defaultValue={defaultValues.duration} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Kompensasi (Rp)</label>
          <input
            className={input}
            type="number"
            name="compensation"
            defaultValue={defaultValues.compensation ?? ""}
          />
        </div>
        <div>
          <label className={label}>Tipe Kompensasi</label>
          <select
            className={input}
            name="compensationType"
            defaultValue={defaultValues.compensationType ?? "NEGOTIABLE"}
          >
            {COMPENSATION_TYPES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Max Talent</label>
          <input
            className={input}
            type="number"
            name="maxTalent"
            defaultValue={defaultValues.maxTalent ?? 1}
            min={1}
          />
        </div>
        <div>
          <label className={label}>Deadline Aplikasi</label>
          <input
            className={input}
            type="datetime-local"
            name="applicationDeadline"
            defaultValue={defaultValues.applicationDeadline}
            required
          />
        </div>
      </div>

      <div>
        <label className={label}>Requirements</label>
        <textarea
          className={input}
          name="requirements"
          defaultValue={defaultValues.requirements}
        />
      </div>

      <div>
        <label className={label}>Responsibilities</label>
        <textarea
          className={input}
          name="responsibilities"
          defaultValue={defaultValues.responsibilities}
        />
      </div>

      <div>
        <label className={label}>Syarat Lain</label>
        <textarea
          className={input}
          name="otherTerms"
          defaultValue={defaultValues.otherTerms}
        />
      </div>

      <div>
        <label className={label}>Metode Meeting</label>
        <input
          className={input}
          name="meetingMethod"
          defaultValue={defaultValues.meetingMethod}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          <input
            type="checkbox"
            name="requiresConsent"
            defaultChecked={defaultValues.requiresConsent}
            className="mr-2"
          />
          Memerlukan persetujuan wali
        </label>
        <label className="text-sm font-medium">
          <input
            type="checkbox"
            name="cvRequirement"
            defaultChecked={defaultValues.cvRequirement}
            className="mr-2"
          />
          Wajib CV
        </label>
        <label className="text-sm font-medium">
          <input
            type="checkbox"
            name="portfolioRequirement"
            defaultChecked={defaultValues.portfolioRequirement}
            className="mr-2"
          />
          Wajib portfolio
        </label>
        <label className="text-sm font-medium">
          <input
            type="checkbox"
            name="interviewRequirement"
            defaultChecked={defaultValues.interviewRequirement}
            className="mr-2"
          />
          Wajib interview
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Skill IDs (pisah koma)</label>
          <input
            className={input}
            name="skillIds"
            defaultValue={defaultValues.skillIds}
            placeholder="uuid1, uuid2"
          />
        </div>
        <div>
          <label className={label}>Interest IDs (pisah koma)</label>
          <input
            className={input}
            name="interestIds"
            defaultValue={defaultValues.interestIds}
            placeholder="uuid1, uuid2"
          />
        </div>
      </div>

      {state && !state.success && (
        <p className="text-red-500">{state.error.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : submitLabel}
      </button>
    </form>
  );
}
