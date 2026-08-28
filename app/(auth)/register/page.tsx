"use client";

import { useActionState } from "react";
import { register } from "@/modules/auth/actions";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, null);

  return (
    <form action={action} className="flex flex-col gap-4 max-w-sm">
      <h1 className="text-2xl font-bold">Register</h1>
      <input name="fullName" placeholder="Nama lengkap" required />
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password (min 8)" required minLength={8} />
      <select name="role" defaultValue="TALENT">
        <option value="TALENT">Talent</option>
        <option value="HIRER">Hirer</option>
      </select>
      {state && !state.success && (
        <p className="text-red-500">{state.error.message}</p>
      )}
      <button type="submit" disabled={pending}>
        {pending ? "Loading..." : "Register"}
      </button>
    </form>
  );
}
