import { requireRole } from "@/modules/lib/auth";
import { listUsers } from "@/modules/admin/service";
import { suspendUserAction, reactivateUserAction } from "@/modules/admin/actions";

export default async function AdminUsersPage() {
  await requireRole("ADMIN");
  const users = await listUsers();

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold tracking-tight mb-6">User Management</h1>

      <div className="flex flex-col gap-3">
        {users.map((user) => (
          <div key={user.id} className="card p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{user.full_name ?? "No Name"}</div>
              <div className="text-sm text-ink-2">
                {user.role} · {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-2 py-1 text-xs rounded-full ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {user.status}
              </span>
              <form action={user.status === 'ACTIVE' ? suspendUserAction.bind(null, user.id) : reactivateUserAction.bind(null, user.id)}>
                <button className="text-sm border border-line px-3 py-1 rounded-xl hover:bg-tint">
                  {user.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
