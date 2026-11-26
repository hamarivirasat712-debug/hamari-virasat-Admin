import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured, formatSupabaseError } from '@/lib/supabase';
import { getAdminSession } from '@/lib/adminAuth';

// PATCH — update order status
export async function PATCH(req: Request) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status } = await req.json();
  const validStatuses = ['pending', 'in_progress', 'delivered'];
  if (!id || !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase credentials are not configured.' }, { status: 500 });
  }

  try {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) return NextResponse.json({ error: formatSupabaseError(error) }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: formatSupabaseError(err) }, { status: 500 });
  }
}
