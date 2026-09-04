"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/modules/auth/actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <main className="flex flex-1 items-center justify-center bg-tint-2 px-6 py-16">
      <div className="card w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold tracking-tight">Masuk</h1>
        <p className="mt-1.5 text-sm text-ink-2">
          Masuk untuk melanjutkan ke Flex Network.
        </p>
        <form action={action} className="mt-6 flex flex-col gap-4">
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
              placeholder="Password"
              required
              autoComplete="current-password"
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
            className="btn-primary mt-1 h-11 w-full disabled:opacity-55"
          >
            {pending ? "Memproses..." : "Masuk"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-2">
          Belum punya akun?{" "}
          <Link href="/register" className="font-semibold text-primary">
            Daftar
          </Link>
        </p>
      </div>
    </main>
  );
}
