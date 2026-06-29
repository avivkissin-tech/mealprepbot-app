import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const body = await req.json();
  const { type, title, description } = body;

  if (!title || !type) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { error } = await supabase.from('feedback').insert({
    clerk_id: userId ?? null,
    type,
    title,
    description: description ?? '',
    created_at: new Date().toISOString(),
  });

  if (error) {
    // Table might not exist yet — return instructions
    console.error('Feedback insert error:', error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only used by /studio admin — admin check happens there
  const { data } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return NextResponse.json({ feedback: data ?? [] });
}
