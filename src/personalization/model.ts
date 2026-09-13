export type ContextSource =
  | 'user_direct_voice'
  | 'user_direct_form'
  | 'document_report';
export type ReviewStatus = 'pending' | 'confirmed' | 'historical' | 'uncertain';
export interface ContextItem {
  id: string;
  question_id: string;
  label: string;
  raw_user_text: string;
  text: string;
  source: ContextSource;
  sourceLabel?: string;
  confidence: number | null;
  structured_value?: string | null;
  status: ReviewStatus;
  timestamp: string;
  supersedes?: string;
}
export const PROFILE_KEY = 'shift_personal_context_v1';
export const DRAFT_KEY = 'shift_holly_draft_v1';
export const MAX_CONTEXT = 6000;
export const MAX_ITEM = 600;
export function contextSize(items: ContextItem[]) {
  return items
    .filter((x) => x.status === 'confirmed')
    .reduce((sum, x) => sum + x.text.length + x.label.length + 100, 0);
}
export function activeContext(items: ContextItem[]) {
  return items
    .filter((x) => x.status === 'confirmed')
    .map(({ text, label, source, timestamp, status }) => ({
      text,
      label,
      source,
      timestamp,
      status,
    }));
}
export function restoreItems(value: unknown): ContextItem[] {
  if (!Array.isArray(value) || value.length > 100) return [];
  const items = value.filter(
    (x): x is ContextItem =>
      !!x &&
      typeof x.id === 'string' &&
      typeof x.question_id === 'string' &&
      typeof x.label === 'string' &&
      x.label.length <= 100 &&
      typeof x.text === 'string' &&
      x.text.length <= MAX_ITEM &&
      typeof x.raw_user_text === 'string' &&
      x.raw_user_text.length <= 3000 &&
      typeof x.timestamp === 'string' &&
      ['pending', 'confirmed', 'historical', 'uncertain'].includes(x.status) &&
      ['user_direct_voice', 'user_direct_form', 'document_report'].includes(
        x.source,
      ),
  );
  return contextSize(items) <= MAX_CONTEXT ? items : [];
}
