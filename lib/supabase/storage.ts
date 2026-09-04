import { createSupabaseServerClient } from "./server";

const BUCKET = "contracts-private";

export async function uploadPrivateDoc(path: string, bytes: Uint8Array): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw new Error(`Upload gagal: ${error.message}`);
  return path;
}

export async function getSignedDocUrl(path: string, expiresInSeconds = 3600): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds);
  if (!data) throw new Error("Gagal membuat signed URL");
  return data.signedUrl;
}

export async function downloadPrivateDoc(path: string): Promise<Uint8Array> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(`Download gagal: ${error?.message ?? "not found"}`);
  return new Uint8Array(await data.arrayBuffer());
}
