import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('saved_recipes')
    .select('recipe_ids')
    .eq('clerk_id', userId)
    .maybeSingle();

  return NextResponse.json({ recipe_ids: data?.recipe_ids ?? [] });
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { recipe_ids } = await req.json();

  await supabase.from('saved_recipes').upsert(
    { clerk_id: userId, recipe_ids, updated_at: new Date().toISOString() },
    { onConflict: 'clerk_id' }
  );

  return NextResponse.json({ ok: true });
}
