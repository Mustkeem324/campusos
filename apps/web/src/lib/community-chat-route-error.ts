import { chatHttpError } from './community-chat-academic';

const KNOWN_CHAT_CODES = new Set([
  'CHAT_NOT_AUTHORISED',
  'CHAT_RATE_LIMIT',
  'CHAT_CONTENT_BLOCKED',
  'CHAT_LINK_BLOCKED',
  'CHAT_FILE_TOO_LARGE',
  'CHAT_TOO_MANY_FILES',
  'CHAT_FILE_BLOCKED',
  'CHAT_FILE_SIGNATURE',
  'CHAT_EMPTY',
  'CHAT_ATTACHMENT_NOT_FOUND',
  'CHAT_REPLY_INVALID',
]);

export function mapCommunityRouteError(error: unknown, context: string) {
  const code = error instanceof Error ? error.message : 'CHAT_ERROR';
  if (KNOWN_CHAT_CODES.has(code)) return chatHttpError(error);
  console.error(`[COMMUNITY_CHAT_${context}]`, error);
  return { status: 500, error: 'The community request could not be completed.' };
}
