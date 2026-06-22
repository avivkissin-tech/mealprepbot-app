import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('cook_history')
    .select('cooked_at')
    .eq('clerk_id', userId)
    .order('cooked_at', { ascending: true });

  const history = (data ?? []).map((row) => row.cooked_at as string);
  return NextResponse.json({ history });
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await supabase.from('cook_history').insert({ clerk_id: userId });

  return NextResponse.json({ ok: true });
}
