import { requireRole } from "@/modules/lib/auth";
import { listAuditLogs } from "@/modules/audit/service";

export default async function AdminAuditPage() {
  await requireRole("ADMIN");
  const logs = await listAuditLogs(100);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Audit Logs</h1>
      <div className="overflow-x-auto card">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-tint border-b border-line text-ink-2">
              <th className="p-3">Created At</th>
              <th className="p-3">Actor ID</th>
              <th className="p-3">Action</th>
              <th className="p-3">Resource Type</th>
              <th className="p-3">Resource ID</th>
              <th className="p-3">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-ink-2">
                  No audit logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-line hover:bg-tint">
                  <td className="p-3 whitespace-nowrap text-ink-2">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="p-3 font-mono text-xs">{log.actor_id ?? "System"}</td>
                  <td className="p-3 font-semibold">{log.action}</td>
                  <td className="p-3">{log.resource_type}</td>
                  <td className="p-3 font-mono text-xs">{log.resource_id ?? "-"}</td>
                  <td className="p-3 font-mono text-xs max-w-xs truncate">
                    {log.metadata ? JSON.stringify(log.metadata) : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
