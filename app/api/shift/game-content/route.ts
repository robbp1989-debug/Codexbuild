import { generatePersonalizedGameContent } from '@/server/gemini';

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const field = (name: string, fallback = '') => typeof input[name] === 'string' ? input[name] : fallback;
    const content = await generatePersonalizedGameContent(field('gameId', 'fact_or_story'), field('theme', 'general'), field('observation'), field('interpretation'), field('updatedPerspective'));
    return Response.json({ content });
  } catch {
    return Response.json({ error: 'Unable to generate game content.' }, { status: 500 });
  }
}
