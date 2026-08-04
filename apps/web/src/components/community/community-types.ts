/** Shared community types used across components */

export interface PostAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
}

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  voted: boolean;
}

export interface PostPoll {
  id: string;
  isMultipleChoice: boolean;
  isAnonymous: boolean;
  expiresAt: string | null;
  totalVotes: number;
  options: PollOption[];
}

export interface CommunityPost {
  id: string;
  type: string;
  title: string | null;
  content: string;
  visibility: string;
  status: string;
  isPinned: boolean;
  isLocked: boolean;
  commentsEnabled: boolean;
  viewCount: number;
  editedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  author: PostAuthor;
  bookmarked: boolean;
  acknowledged: boolean;
  userVote: number;
  userReactions: string[];
  upvotes: number;
  downvotes: number;
  reactionSummary: Record<string, number>;
  replyCount: number;
  reactionCount: number;
  acknowledgementCount: number;
  poll: PostPoll | null;
}

export interface CommunityReply {
  id: string;
  postId: string;
  content: string;
  isHidden: boolean;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  author: PostAuthor;
  children?: CommunityReply[];
  _count: { reactions: number; children: number };
}

export type PostTypeValue = 'DISCUSSION' | 'QUESTION' | 'ANNOUNCEMENT' | 'POLL' | 'URGENT_NOTICE' | 'IMPORTANT_NOTICE' | 'EVENT' | 'RESOURCE';

export const POST_TYPE_LABELS: Record<PostTypeValue, string> = {
  DISCUSSION: 'Discussion',
  QUESTION: 'Question',
  ANNOUNCEMENT: 'Announcement',
  POLL: 'Poll',
  URGENT_NOTICE: 'Urgent Notice',
  IMPORTANT_NOTICE: 'Important Notice',
  EVENT: 'Event',
  RESOURCE: 'Resource',
};

export const POST_TYPE_COLORS: Record<PostTypeValue, { bg: string; text: string; border: string }> = {
  DISCUSSION: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  QUESTION: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  ANNOUNCEMENT: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  POLL: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  URGENT_NOTICE: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  IMPORTANT_NOTICE: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  EVENT: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  RESOURCE: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
};

export const REACTION_TYPES = [
  { key: 'LIKE', emoji: '👍', label: 'Like' },
  { key: 'HELPFUL', emoji: '💡', label: 'Helpful' },
  { key: 'INSIGHTFUL', emoji: '🧠', label: 'Insightful' },
  { key: 'AGREE', emoji: '✅', label: 'Agree' },
  { key: 'CELEBRATE', emoji: '🎉', label: 'Celebrate' },
  { key: 'SUPPORT', emoji: '💪', label: 'Support' },
] as const;

export const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'HATE_ABUSE', label: 'Hate or abuse' },
  { value: 'ACADEMIC_MISCONDUCT', label: 'Academic misconduct' },
  { value: 'MISINFORMATION', label: 'Misinformation' },
  { value: 'PRIVACY_VIOLATION', label: 'Privacy violation' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate content' },
  { value: 'COPYRIGHT', label: 'Copyright issue' },
  { value: 'OTHER', label: 'Other' },
] as const;

export function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function roleLabel(role: string): string {
  return role.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}
