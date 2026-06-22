import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('planner')
    .select('plan, serves')
    .eq('clerk_id', userId)
    .maybeSingle();

  return NextResponse.json({ plan: data?.plan ?? {}, serves: data?.serves ?? {} });
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { plan, serves } = await req.json();

  await supabase.from('planner').upsert(
    { clerk_id: userId, plan, serves, updated_at: new Date().toISOString() },
    { onConflict: 'clerk_id' }
  );

  return NextResponse.json({ ok: true });
}
