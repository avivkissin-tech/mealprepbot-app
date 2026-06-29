import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import StudioClient from './StudioClient';

// Secret admin-only page — no links to this anywhere in the UI
// Protect by matching against ADMIN_CLERK_ID env var

export default async function StudioPage() {
  const { userId } = await auth();
  const adminId = process.env.ADMIN_CLERK_ID;

  // Not signed in → redirect to home
  if (!userId) redirect('/');

  // Signed in but not admin → 404 (same as unknown page)
  if (!adminId || userId !== adminId) notFound();

  // Fetch stats from Supabase
  const [
    { count: totalUsers },
    { count: totalCooks },
    { data: savedData },
    { data: feedbackData },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from('user_profile').select('clerk_id', { count: 'exact', head: true }),
    supabase.from('cook_history').select('clerk_id', { count: 'exact', head: true }),
    supabase.from('saved_recipes').select('recipe_ids'),
    supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('user_profile').select('clerk_id, goal, household_size, prep_frequency, completed_at').order('completed_at', { ascending: false }).limit(10),
  ]);

  // Aggregate most saved recipes
  const recipeCounts: Record<string, number> = {};
  for (const row of savedData ?? []) {
    for (const id of (row.recipe_ids as string[]) ?? []) {
      recipeCounts[id] = (recipeCounts[id] ?? 0) + 1;
    }
  }
  const topRecipes = Object.entries(recipeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ id, count }));

  return (
    <StudioClient
      stats={{
        totalUsers: totalUsers ?? 0,
        totalCooks: totalCooks ?? 0,
        totalSavedUsers: (savedData ?? []).length,
      }}
      topRecipes={topRecipes}
      feedback={feedbackData ?? []}
      recentUsers={recentUsers ?? []}
    />
  );
}
