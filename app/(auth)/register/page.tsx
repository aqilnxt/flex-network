"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register } from "@/modules/auth/actions";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, null);

  return (
    <main className="flex flex-1 items-center justify-center bg-tint-2 px-6 py-12">
      <div className="card w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold tracking-tight">Daftar</h1>
        <p className="mt-1.5 text-sm text-ink-2">
          Mulai bangun pengalaman kerja terverifikasimu.
        </p>
        <form action={action} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fullName" className="text-sm font-medium">
              Nama lengkap
            </label>
            <input
              id="fullName"
              name="fullName"
              placeholder="Nama lengkap"
              required
              autoComplete="name"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="nama@contoh.id"
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 8 karakter"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="role" className="text-sm font-medium">
              Daftar sebagai
            </label>
            <select id="role" name="role" defaultValue="TALENT">
              <option value="TALENT">Talent</option>
              <option value="HIRER">Hirer</option>
            </select>
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
            className="btn-primary mt-1 h-11 w-full disabled:opacity-55"
          >
            {pending ? "Memproses..." : "Daftar"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-2">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-primary">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}
