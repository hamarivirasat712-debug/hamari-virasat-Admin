import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured, formatSupabaseError } from '@/lib/supabase';
import { getAdminSession } from '@/lib/adminAuth';

// GET — fetch all enquiries (admin only)
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
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: formatSupabaseError(error) }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: formatSupabaseError(err) }, { status: 500 });
  }
}

// POST — save an enquiry (called from EnquiryForm)
export async function POST(req: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: 'Supabase credentials are not configured.' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { data, error } = await supabase.from('enquiries').insert([{
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      interest: body.interest || null,
      message: body.message || null,
      type: body.type || 'enquiry',
    }]).select().single();

    if (error) return NextResponse.json({ error: formatSupabaseError(error) }, { status: 500 });
    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    return NextResponse.json({ error: formatSupabaseError(err) }, { status: 500 });
  }
}
