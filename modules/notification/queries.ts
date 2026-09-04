import { createSupabaseServerClient } from '../../lib/supabase/server';

export type NotificationRow = {
  id: string;
  actor_id: string | null;
  type: string | null;
  title: string | null;
  message: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export async function listNotifications(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<NotificationRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) throw error;
  return data || [];
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) throw error;
  return count || 0;
}
