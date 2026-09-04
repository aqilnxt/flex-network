import { createSupabaseServerClient } from '../../lib/supabase/server';

export type NotifyParams = {
  recipientId: string;
  actorId?: string;
  type: string;
  title: string;
  message: string;
  link: string;
  metadata?: any;
};

export async function notify(params: NotifyParams): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('notifications').insert({
    user_id: params.recipientId,
    actor_id: params.actorId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link,
    metadata: params.metadata,
  });

  if (error) throw error;
}
