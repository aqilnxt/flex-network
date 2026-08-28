"use client";

import { useActionState } from "react";
import { login } from "@/modules/auth/actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <form action={action} className="flex flex-col gap-4 max-w-sm">
      <h1 className="text-2xl font-bold">Login</h1>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      {state && !state.success && (
        <p className="text-red-500">{state.error.message}</p>
      )}
      <button type="submit" disabled={pending}>
        {pending ? "Loading..." : "Login"}
      </button>
    </form>
  );
}
