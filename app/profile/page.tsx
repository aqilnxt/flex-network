import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/lib/auth";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: privateData } = await supabase
    .from("profile_private")
    .select("phone")
    .eq("profile_id", user.id)
    .single();

  return (
    <div className="p-8">
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
        <p className="mt-2 text-ink-2">
          Informasi dasar akun kamu - nama dan kontak hanya untuk keperluan
          akun.
        </p>
        <div className="card mt-6 p-6">
          <ProfileForm
            defaultFullName={profile?.full_name ?? ""}
            defaultPhone={privateData?.phone ?? ""}
            defaultBio={profile?.bio ?? ""}
            defaultLocation={profile?.location ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
