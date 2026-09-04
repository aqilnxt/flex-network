import { createSupabaseServerClient } from '@/lib/supabase/server';
import { listNotifications } from '@/modules/notification/queries';
import { revalidatePath } from 'next/cache';

async function markAsRead(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  if (!id) return;
  const supabase = await createSupabaseServerClient();
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);
  revalidatePath('/notifications');
}

export default async function NotificationsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-4">Please log in to view notifications.</div>;
  }

  const notifications = await listNotifications(user.id);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Notifications</h1>
      {notifications.length === 0 ? (
        <p className="text-gray-500">No notifications found.</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((item) => (
            <li
              key={item.id}
              className={`card p-4 flex justify-between items-center ${
                item.read_at ? 'bg-white text-ink-2' : 'bg-tint border-primary/30 font-semibold'
              }`}
            >
              <div>
                <p>{item.title || item.message}</p>
                {item.title && item.message && (
                  <p className="text-sm font-normal text-ink-2">{item.message}</p>
                )}
                <span className="text-xs text-ink-2/70">
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </div>
              {!item.read_at && (
                <form action={markAsRead}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Mark as read
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
