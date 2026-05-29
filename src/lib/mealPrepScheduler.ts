import { Recipe, ScheduledStep } from '@/types';

const PASSIVE_START_KEYWORDS = ['preheat', 'marinate', 'soak', 'press tofu', 'refrigerate', 'rest'];
const PASSIVE_WAIT_KEYWORDS  = ['bake', 'roast', 'simmer', 'cook for', 'fry for'];
const FINAL_KEYWORDS         = ['cool', 'box', 'store', 'divide', 'container', 'refrigerate after'];

function classifyStep(step: { en: string; timerMinutes?: number }): 'passive_start' | 'active' | 'passive_wait' {
  const en = step.en.toLowerCase();
  if (PASSIVE_START_KEYWORDS.some(kw => en.includes(kw))) return 'passive_start';
  if (step.timerMinutes !== undefined && step.timerMinutes > 5 && PASSIVE_WAIT_KEYWORDS.some(kw => en.includes(kw))) {
    return 'passive_wait';
  }
  return 'active';
}

function extractTemp(step: { en: string }): number | null {
  const match = step.en.match(/(\d{3})\s*°?C/i);
  return match ? parseInt(match[1], 10) : null;
}

function mergeOvenPreheats(preheatSteps: ScheduledStep[]): ScheduledStep[] {
  if (preheatSteps.length === 0) return [];
  if (preheatSteps.length === 1) return preheatSteps;

  // Always merge all preheat steps into one — user has one oven
  const maxTemp = Math.max(...preheatSteps.map(s => extractTemp(s.step) ?? 220));
  const names   = preheatSteps.map(s => s.recipeName).join(', ');
  return [{
    ...preheatSteps[0],
    recipeName: names,
    mergedRecipeIds: preheatSteps.map(s => s.recipeId),
    mergedRecipeNames: preheatSteps.map(s => s.recipeName),
    step: {
      he: `חמם תנור ל-${maxTemp}°C עבור: ${names}`,
      en: `Preheat oven to ${maxTemp}°C — for: ${names}`,
      timerMinutes: preheatSteps[0].step.timerMinutes,
    },
    canParallelize: true,
  } as ScheduledStep];
}

function interleaveByRecipe(steps: ScheduledStep[]): ScheduledStep[] {
  const byRecipe = new Map<string, ScheduledStep[]>();
  for (const s of steps) {
    if (!byRecipe.has(s.recipeId)) byRecipe.set(s.recipeId, []);
    byRecipe.get(s.recipeId)!.push(s);
  }
  const buckets = Array.from(byRecipe.values());
  const result: ScheduledStep[] = [];
  const maxLen = Math.max(0, ...buckets.map(b => b.length));
  for (let i = 0; i < maxLen; i++) {
    for (const bucket of buckets) {
      if (i < bucket.length) result.push(bucket[i]);
    }
  }
  return result;
}

function partition<T>(arr: T[], pred: (x: T) => boolean): [T[], T[]] {
  const yes: T[] = [], no: T[] = [];
  for (const x of arr) (pred(x) ? yes : no).push(x);
  return [yes, no];
}

export function scheduleMealPrep(recipeList: Recipe[]): ScheduledStep[] {
  if (recipeList.length === 0) return [];

  const passiveStarts: ScheduledStep[] = [];
  const activeSteps:   ScheduledStep[] = [];
  const passiveWaits:  ScheduledStep[] = [];

  for (const recipe of recipeList) {
    for (let i = 0; i < recipe.steps.length; i++) {
      const step = recipe.steps[i];
      const type = classifyStep(step);
      const scheduled: ScheduledStep = {
        recipeId: recipe.id,
        recipeName: recipe.nameHe,
        stepIndex: i,
        step,
        type,
        canParallelize: type === 'passive_wait',
      };
      if (type === 'passive_start') passiveStarts.push(scheduled);
      else if (type === 'passive_wait') passiveWaits.push(scheduled);
      else activeSteps.push(scheduled);
    }
  }

  passiveStarts.sort((a, b) => (b.step.timerMinutes ?? 0) - (a.step.timerMinutes ?? 0));

  const preheatSteps  = passiveStarts.filter(s => s.step.en.toLowerCase().includes('preheat'));
  const otherPassives = passiveStarts.filter(s => !s.step.en.toLowerCase().includes('preheat'));

  const mergedPreheats = mergeOvenPreheats(preheatSteps).sort(
    (a, b) => (b.step.timerMinutes ?? 0) - (a.step.timerMinutes ?? 0)
  );

  const interleavedActive = interleaveByRecipe(activeSteps);
  const [midActive, finalActive] = partition(
    interleavedActive,
    s => !FINAL_KEYWORDS.some(kw => s.step.en.toLowerCase().includes(kw))
  );

  passiveWaits.sort((a, b) => (b.step.timerMinutes ?? 0) - (a.step.timerMinutes ?? 0));

  return [
    ...mergedPreheats,
    ...otherPassives,
    ...midActive,
    ...passiveWaits,
    ...finalActive,
  ];
}

export function estimateTotalMinutes(steps: ScheduledStep[]): number {
  let total = 0;
  let maxPassiveWait = 0;
  for (const s of steps) {
    if (s.type === 'passive_start' && s.step.timerMinutes) {
      total += s.step.timerMinutes;
    } else if (s.type === 'passive_wait' && s.step.timerMinutes) {
      maxPassiveWait = Math.max(maxPassiveWait, s.step.timerMinutes);
    } else {
      total += s.step.timerMinutes ?? 2;
    }
  }
  return total + maxPassiveWait;
}

export function formatTimerMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} דק׳`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} שע׳` : `${h} שע׳ ${m} דק׳`;
}
