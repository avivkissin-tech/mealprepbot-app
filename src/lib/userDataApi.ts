// Client-side API helpers — all calls go to our own API routes
// which use the service role key server-side.

export async function fetchSavedRecipes(): Promise<string[]> {
  const res = await fetch('/api/user-data/saved-recipes');
  if (!res.ok) return [];
  const { recipe_ids } = await res.json();
  return recipe_ids ?? [];
}

export async function pushSavedRecipes(ids: string[]): Promise<void> {
  await fetch('/api/user-data/saved-recipes', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipe_ids: ids }),
  });
}

export async function fetchPlanner(): Promise<{ plan: Record<string, string[]>; serves: Record<string, number> }> {
  const res = await fetch('/api/user-data/planner');
  if (!res.ok) return { plan: {}, serves: {} };
  return res.json();
}

export async function pushPlanner(
  plan: Record<string, string[]>,
  serves: Record<string, number>
): Promise<void> {
  await fetch('/api/user-data/planner', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, serves }),
  });
}

export async function fetchCookHistory(): Promise<string[]> {
  const res = await fetch('/api/user-data/cook-history');
  if (!res.ok) return [];
  const { history } = await res.json();
  return history ?? [];
}

export async function pushCookEntry(): Promise<void> {
  await fetch('/api/user-data/cook-history', { method: 'POST' });
}

export async function fetchProfile(): Promise<Record<string, unknown> | null> {
  const res = await fetch('/api/user-data/profile');
  if (!res.ok) return null;
  const { profile } = await res.json();
  return profile ?? null;
}

export async function pushProfile(profile: Record<string, unknown>): Promise<void> {
  await fetch('/api/user-data/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
}
