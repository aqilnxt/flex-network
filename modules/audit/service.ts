import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuditRow = { id:string; actor_id:string|null; actor_type:string; action:string; resource_type:string; resource_id:string|null; metadata:any; created_at:string };

export async function logAudit(p:{actorId:string|null; actorType?:"USER"|"ADMIN"|"SYSTEM"; action:string; resourceType:string; resourceId?:string; metadata?:any}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const actorType = p.actorType ?? (p.actorId ? "USER" : "SYSTEM");
  await supabase.from("audit_logs").insert({
    actor_id: p.actorId,
    actor_type: actorType,
    action: p.action,
    resource_type: p.resourceType,
    resource_id: p.resourceId ?? null,
    metadata: p.metadata ?? null
  });
}

export async function listAuditLogs(limit=50): Promise<AuditRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("audit_logs").select("*").order("created_at",{ascending:false}).limit(limit);
  return (data as AuditRow[]) ?? [];
}
