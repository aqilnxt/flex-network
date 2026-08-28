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
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <ProfileForm
        defaultFullName={profile?.full_name ?? ""}
        defaultPhone={privateData?.phone ?? ""}
        defaultBio={profile?.bio ?? ""}
        defaultLocation={profile?.location ?? ""}
      />
    </div>
  );
}
