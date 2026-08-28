import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "TALENT") redirect("/dashboard/talent");
  if (user.role === "HIRER") redirect("/dashboard/hirer");
  redirect("/login");
}
