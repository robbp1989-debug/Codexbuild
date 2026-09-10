import { headers } from 'next/headers';

export type ChatGPTUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

// Sites currently documents authenticated email and an optional full-name header.
// Some runtimes may also provide an opaque user-id header, so prefer it when it
// exists but never require it. If it is absent, derive a stable pseudonymous key
// from the normalized authenticated email rather than persisting the email itself
// as the D1 user primary key.
const USER_ID_HEADER = 'oai-authenticated-user-id';
const USER_EMAIL_HEADER = 'oai-authenticated-user-email';
const USER_FULL_NAME_HEADER = 'oai-authenticated-user-full-name';
const USER_FULL_NAME_ENCODING_HEADER = 'oai-authenticated-user-full-name-encoding';
const PERCENT_ENCODED_UTF8 = 'percent-encoded-utf-8';

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const requestHeaders = await headers();
  const rawEmail = requestHeaders.get(USER_EMAIL_HEADER)?.trim();
  if (!rawEmail) return null;

  const email = rawEmail.toLowerCase();
  const explicitUserId = requestHeaders.get(USER_ID_HEADER)?.trim();
  const userId = explicitUserId || (await pseudonymousUserId(email));

  const encodedFullName = requestHeaders.get(USER_FULL_NAME_HEADER)?.trim();
  const nameEncoding = requestHeaders.get(USER_FULL_NAME_ENCODING_HEADER);
  const fullName = encodedFullName
    ? nameEncoding === PERCENT_ENCODED_UTF8
      ? safeDecodeURIComponent(encodedFullName)
      : encodedFullName
    : null;

  return {
    userId,
    displayName: fullName || rawEmail,
    email: rawEmail,
    fullName,
  };
}

async function pseudonymousUserId(normalizedEmail: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizedEmail));
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `chatgpt_${hex}`;
}

function safeDecodeURIComponent(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
