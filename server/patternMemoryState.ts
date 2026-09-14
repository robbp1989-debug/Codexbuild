import { env } from 'cloudflare:workers';

function getDb(): D1Database | null {
  try {
    return env.DB || null;
  } catch {
    return null;
  }
}

function canonical(value: string): string {
  return value
    .toLowerCase()
    .replace(/[“”"'`]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function hasConfirmedPatternMemory(
  userId: string,
  candidateSummary: string,
): Promise<boolean> {
  const db = getDb();
  const target = canonical(candidateSummary);
  if (!db || !userId || !target) return false;

  const result = await db
    .prepare(
      `SELECT summary
       FROM learning_memories
       WHERE user_id = ? AND memory_type = 'CONFIRMED_PATTERN' AND archived_at IS NULL
       ORDER BY updated_at DESC
       LIMIT 80`,
    )
    .bind(userId)
    .all<{ summary: string }>();

  return (result.results || []).some((row) => canonical(row.summary) === target);
}
