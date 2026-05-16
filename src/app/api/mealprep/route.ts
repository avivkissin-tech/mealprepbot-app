import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { Recipe } from '@/types';

interface RequestBody {
  recipes: Recipe[];
  portions: Record<string, number>;
  locale: 'he' | 'en';
}

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const body: RequestBody = await req.json();
  const { recipes, portions, locale } = body;

  const isHebrew = locale === 'he';

  // Build a description of each recipe with scaled ingredients and steps
  const recipeDescriptions = recipes.map((recipe) => {
    const servings = portions[recipe.id] ?? recipe.baseServings;
    const multiplier = servings / recipe.baseServings;

    const name = isHebrew ? recipe.nameHe : recipe.nameEn;

    const ingredientsList = recipe.ingredients
      .map((ing) => {
        const qty = Math.round(ing.quantity * multiplier * 2) / 2;
        const ingName = isHebrew ? ing.nameHe : ing.nameEn;
        return `  - ${qty} ${ing.unit} ${ingName}`;
      })
      .join('\n');

    const stepsList = recipe.steps
      .map((step, i) => {
        const text = isHebrew ? step.he : step.en;
        const timerNote = step.timerMinutes ? ` [${step.timerMinutes} min]` : '';
        return `  ${i + 1}. ${text}${timerNote}`;
      })
      .join('\n');

    return `### ${name} (${servings} servings)\nIngredients:\n${ingredientsList}\n\nSteps:\n${stepsList}`;
  }).join('\n\n---\n\n');

  const systemPrompt = isHebrew
    ? `אתה עוזר בישול מקצועי המתמחה במילפרפ. המשתמש מכין מספר מתכונים בבת אחת ואתה צריך ליצור מדריך בישול משולב ומאופטם.
הנחיות:
- ארגן את שלבי הבישול כך שיהיו מקביליים ויעילים (למשל: "בזמן שהסלמון בתנור, טגן את הבצל")
- קבץ שלבי הכנה דומים (למשל: "קצוץ את כל הבצלים עבור שני המתכונים עכשיו")
- ציין טיימרים ברורים לכל שלב עם זמן
- כתוב בעברית בלבד
- השתמש בפורמט markdown עם כותרות ורשימות
- התחל עם "הכנות מוקדמות" (mise en place), אחר כך "סדר הבישול", ובסוף "אחסון"`
    : `You are a professional meal prep cooking assistant. The user is preparing multiple recipes at once and you need to create an optimized combined cooking guide.
Guidelines:
- Organize cooking steps to run in parallel and be efficient (e.g., "While the salmon bakes, sauté the onions")
- Group similar prep steps (e.g., "Chop all onions for both recipes now")
- Clearly indicate timers for each step with duration
- Write in English only
- Use markdown format with headers and lists
- Start with "Mise en Place" (early prep), then "Cooking Order", and finish with "Storage"`;

  const userPrompt = isHebrew
    ? `אנא צור מדריך מילפרפ משולב ומאופטם עבור המתכונים הבאים:\n\n${recipeDescriptions}`
    : `Please create an optimized combined meal prep guide for the following recipes:\n\n${recipeDescriptions}`;

  const stream = await client.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    thinking: { type: 'adaptive' },
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
    cancel() {
      stream.controller.abort();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}
