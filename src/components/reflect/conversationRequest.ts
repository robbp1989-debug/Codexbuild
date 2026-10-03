export type ConversationFailureKind = 'connection' | 'timeout' | 'sign_in' | 'rate_limit' | 'request' | 'server' | 'invalid_response';

export class ConversationRequestError extends Error {
  constructor(
    public kind: ConversationFailureKind,
    public status?: number,
    public reference?: string,
  ) {
    super(kind);
    this.name = 'ConversationRequestError';
  }
}

export function conversationFailureNotice(error: ConversationRequestError): string {
  if (error.kind === 'sign_in') return 'Your sign-in could not be confirmed. Your message is still here. Refresh SHIFT and check that you are signed in before retrying.';
  if (error.kind === 'rate_limit') return 'The chat service is busy. Your message is still here; wait a moment, then retry it.';
  if (error.kind === 'request') return 'SHIFT could not accept this request. Your message is still here. Retry it, or use the connection details below to report the error.';
  return 'The reply could not be reached. Your message and conversation are still here. Retry this message to continue.';
}

function safeReference(response: Response): string | undefined {
  return (response.headers.get('x-shift-request-id') || response.headers.get('cf-ray') || '')
    .replace(/[^a-zA-Z0-9_.:-]/g, '').slice(0, 120) || undefined;
}

/** Only send conversation text and the snapshot fields the server actually uses. */
export function conversationRequestBody(args: {
  message: string;
  currentShift: Record<string, unknown>;
  history: Array<{ role: 'user' | 'assistant'; content: string; responseMode?: string }>;
  personalContext: unknown;
  approvedSummary: unknown;
  memoryItems: unknown[];
}) {
  const fields = ['observation', 'userEditedObservation', 'confirmed_emotions', 'confirmed_needs',
    'interpretation', 'userEditedInterpretation', 'protective_rule_hypothesis', 'userEditedHypothesis',
    'hypothesisUserStatus', 'updated_perspective', 'userEditedPerspective', 'choice', 'userEditedChoice'];
  return {
    message: args.message,
    currentShift: Object.fromEntries(fields.filter(key => args.currentShift[key] !== undefined).map(key => [key, args.currentShift[key]])),
    history: args.history.filter(turn => turn.role !== 'assistant' || turn.responseMode !== 'unavailable')
      .slice(-8).map(turn => ({ role: turn.role, content: turn.content.slice(0, 1200) })),
    personalContext: args.personalContext,
    approvedSummary: args.approvedSummary,
    memoryItems: args.memoryItems.slice(0, 80),
  };
}

/** A failed status is UI state, never an assistant's conversational answer. */
export function replaceFailedConversationReply<T extends { retryId?: string; responseMode?: string }>(turns: T[], retryId: string, reply: T): T[] {
  return [...turns.filter(turn => turn.retryId !== retryId || turn.responseMode !== 'unavailable'), reply];
}

/** Conversation requests do not save events or memories. Retry a transient failure once. */
export async function requestConversation(
  payload: unknown,
  options: { fetcher?: typeof fetch; wait?: (ms: number) => Promise<void>; timeoutMs?: number } = {},
): Promise<Record<string, unknown>> {
  const fetcher = options.fetcher || fetch;
  const wait = options.wait || (ms => new Promise(resolve => setTimeout(resolve, ms)));
  const body = JSON.stringify(payload);
  for (let attempt = 0; attempt < 2; attempt++) {
    let failure: ConversationRequestError;
    try {
      const response = await fetcher('/api/shift/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(options.timeoutMs || 90000),
      });
      const reference = safeReference(response);
      if (!response.ok) {
        const kind = response.status === 401 || response.status === 403 ? 'sign_in'
          : response.status === 429 ? 'rate_limit'
          : response.status === 408 || response.status === 504 ? 'timeout'
          : response.status >= 500 ? 'server' : 'request';
        throw new ConversationRequestError(kind, response.status, reference);
      }
      let data: unknown;
      try { data = await response.json(); }
      catch { throw new ConversationRequestError('invalid_response', response.status, reference); }
      if (!data || typeof data !== 'object' || Array.isArray(data))
        throw new ConversationRequestError('invalid_response', response.status, reference);
      const result = data as Record<string, unknown>;
      if (result.safetyInterruption !== true && (typeof result.reply !== 'string' || !result.reply.trim()))
        throw new ConversationRequestError('invalid_response', response.status, reference);
      return result;
    } catch (error) {
      failure = error instanceof ConversationRequestError ? error
        : new ConversationRequestError(error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name) ? 'timeout' : 'connection');
    }
    if (attempt === 1 || ['sign_in', 'request', 'rate_limit'].includes(failure.kind)) throw failure;
    await wait(400);
  }
  throw new ConversationRequestError('connection');
}
