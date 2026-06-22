import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('user_profile')
    .select('*')
    .eq('clerk_id', userId)
    .maybeSingle();

  if (!data) return NextResponse.json({ profile: null });

  return NextResponse.json({
    profile: {
      goal: data.goal,
      householdSize: data.household_size,
      monthlyBudget: data.monthly_budget,
      prepFrequency: data.prep_frequency,
      dietaryPrefs: data.dietary_prefs,
      estimatedSavings: data.estimated_savings,
      completedAt: data.completed_at,
    },
  });
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await req.json();

  await supabase.from('user_profile').upsert(
    {
      clerk_id: userId,
      goal: profile.goal,
      household_size: profile.householdSize ?? 2,
      monthly_budget: profile.monthlyBudget ?? 'unknown',
      prep_frequency: profile.prepFrequency ?? 'unknown',
      dietary_prefs: profile.dietaryPrefs ?? [],
      estimated_savings: profile.estimatedSavings ?? 0,
      completed_at: profile.completedAt ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'clerk_id' }
  );

  return NextResponse.json({ ok: true });
}
