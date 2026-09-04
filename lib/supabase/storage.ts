import { admin } from "./admin";

const BUCKET = "contracts-private";
// ponytail: admin (service role) bypass storage RLS — dokumen kontrak hanya
// diakses server via signed URL; kalau butuh per-user storage policy, pindah
// ke session client + policy involved parties (migration 021/022 siap).

export async function uploadPrivateDoc(path: string, bytes: Uint8Array): Promise<string> {
  const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw new Error(`Upload gagal: ${error.message}`);
  return path;
}

export async function getSignedDocUrl(path: string, expiresInSeconds = 3600): Promise<string> {
  const { data } = await admin.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds);
  if (!data) throw new Error("Gagal membuat signed URL");
  return data.signedUrl;
}

export async function downloadPrivateDoc(path: string): Promise<Uint8Array> {
  const { data, error } = await admin.storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(`Download gagal: ${error?.message ?? "not found"}`);
  return new Uint8Array(await data.arrayBuffer());
}
