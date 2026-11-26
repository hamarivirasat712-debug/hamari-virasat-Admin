import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured, formatSupabaseError } from '@/lib/supabase';
import { getAdminSession } from '@/lib/adminAuth';

// GET — fetch all orders (admin only)
export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: 'Supabase credentials are not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local' },
      { status: 500 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: formatSupabaseError(error) }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: formatSupabaseError(err) }, { status: 500 });
  }
}

// POST — save a new order (called from verify/route.ts after payment)
export async function POST(req: Request) {
  const secret = req.headers.get('x-internal-secret');
  if (secret !== process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: 'Supabase credentials are not configured.' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { data, error } = await supabase.from('orders').insert([body]).select().single();
    if (error) return NextResponse.json({ error: formatSupabaseError(error) }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: formatSupabaseError(err) }, { status: 500 });
  }
}
