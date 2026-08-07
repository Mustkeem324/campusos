/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import {
  ArrowLeft,
  Bell,
  Bookmark,
  BookOpen,
  Check,
  FileText,
  Flag,
  Info,
  Loader2,
  Menu,
  MessageCircle,
  Mic,
  Paperclip,
  Pencil,
  Pin,
  Plus,
  RefreshCw,
  Reply,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UsersRound,
  Video,
  X,
} from 'lucide-react';

type SafeUser = { id: string; name: string; avatarUrl: string | null; role: string };
type Community = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  memberCount: number;
  unreadCount: number;
  lastMessagePreview: string | null;
  lastActivityAt: string | null;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
};
type Attachment = {
  id: string;
  attachmentType: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSizeBytes: number;
  altText: string | null;
  durationSecs: number | null;
  processingState: string;
  isSafe: boolean;
};
type Reaction = { reactionType: string; count: number; userIds?: string[] };
type Message = {
  id: string;
  communityId: string;
  author: SafeUser;
  messageType: string;
  body: string;
  sanitizedBody: string | null;
  replyToId: string | null;
  replyTo: { id: string; authorName: string; bodyPreview: string } | null;
  threadId: string | null;
  moderationStatus: string;
  isEdited: boolean;
  isDeleted: boolean;
  attachments: Attachment[];
  reactions: Reaction[];
  replyCount: number;
  isPinned: boolean;
  isBookmarked: boolean;
  createdAt: string;
  editedAt: string | null;
  readCount?: number;
};
type Member = {
  id: string;
  role: string;
  isMuted: boolean;
  joinedAt: string;
  lastReadAt: string | null;
  online: boolean;
  lastSeenAt: string | null;
  user: SafeUser;
};
type Poll = {
  id: string;
  messageId: string;
  question: string;
  isMultipleChoice: boolean;
  isAnonymous: boolean;
  showResultsBeforeVoting: boolean;
  closesAt: string | null;
  options: Array<{ id: string; text: string; voteCount: number; selectedByMe: boolean }>;
};
type MediaItem = {
  id: string;
  attachmentType: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  createdAt: string;
  messageId: string;
  fileUrl: string;
  author: { name: string; role: string };
};
type ModerationCase = {
  id: string;
  severity: string;
  status: string;
  userNotice: string | null;
  createdAt: string;
  message: { id: string; body: string; author: SafeUser };
  report: { reason: string; description: string | null } | null;
};
type Workspace = {
  currentUserId: string;
  currentRole: string;
  memberRole: string;
  community: {
    id: string;
    name: string;
    description: string | null;
    type: string;
    rules: string | null;
    postingPolicy: string;
    mediaPolicy: string;
  };
  permissions: { canPin: boolean; canPoll: boolean; canModerate: boolean; canEditCommunity: boolean };
  notificationLevel: 'ALL' | 'MENTIONS_ONLY' | 'IMPORTANT_ONLY' | 'MUTED';
  members: Member[];
  typing: Array<{ userId: string; user: SafeUser }>;
  pinned: Message[];
  bookmarks: Message[];
  media: MediaItem[];
  polls: Poll[];
  moderationCases: ModerationCase[];
};
type ReportReason = 'SEXUAL_CONTENT' | 'HARASSMENT' | 'BULLYING' | 'HATE_DISCRIMINATION' | 'THREAT' | 'VIOLENCE' | 'SPAM' | 'SCAM' | 'PRIVACY_VIOLATION' | 'IMPERSONATION' | 'ACADEMIC_CHEATING' | 'INAPPROPRIATE_FILE' | 'OTHER';
type SideTab = 'members' | 'info' | 'media' | 'saved' | 'moderation';

const FIVE_MB = 5 * 1024 * 1024;
const TEN_MB = 10 * 1024 * 1024;
const ACCEPTED_FILES = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,audio/webm,audio/ogg,audio/mpeg,audio/mp4,audio/wav,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv';
const REACTIONS = [
  { key: 'LIKE', label: 'Like', icon: '👍' },
  { key: 'HELPFUL', label: 'Helpful', icon: '💡' },
  { key: 'INSIGHTFUL', label: 'Insightful', icon: '🧠' },
  { key: 'AGREE', label: 'Agree', icon: '✓' },
  { key: 'CELEBRATE', label: 'Celebrate', icon: '🎉' },
  { key: 'SUPPORT', label: 'Support', icon: '🙌' },
] as const;
const REPORT_REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: 'HARASSMENT', label: 'Harassment or abuse' },
  { value: 'BULLYING', label: 'Bullying' },
  { value: 'SEXUAL_CONTENT', label: 'Sexual or adult content' },
  { value: 'HATE_DISCRIMINATION', label: 'Hate or discrimination' },
  { value: 'THREAT', label: 'Threat or intimidation' },
  { value: 'VIOLENCE', label: 'Violent content' },
  { value: 'PRIVACY_VIOLATION', label: 'Privacy violation' },
  { value: 'SCAM', label: 'Scam or unsafe link' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'ACADEMIC_CHEATING', label: 'Academic cheating service' },
  { value: 'INAPPROPRIATE_FILE', label: 'Inappropriate file' },
  { value: 'IMPERSONATION', label: 'Impersonation' },
  { value: 'OTHER', label: 'Other' },
];

export function AcademicCommunityChatPro() {
  const [communities, setCommunities] = React.useState<Community[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [workspace, setWorkspace] = React.useState<Workspace | null>(null);
  const [communityQuery, setCommunityQuery] = React.useState('');
  const [body, setBody] = React.useState('');
  const [files, setFiles] = React.useState<File[]>([]);
  const [replyTo, setReplyTo] = React.useState<Message | null>(null);
  const [threadFor, setThreadFor] = React.useState<Message | null>(null);
  const [threadReplies, setThreadReplies] = React.useState<Message[]>([]);
  const [reportMessage, setReportMessage] = React.useState<Message | null>(null);
  const [reportReason, setReportReason] = React.useState<ReportReason>('HARASSMENT');
  const [reportDescription, setReportDescription] = React.useState('');
  const [editMessage, setEditMessage] = React.useState<Message | null>(null);
  const [editBody, setEditBody] = React.useState('');
  const [deleteMessage, setDeleteMessage] = React.useState<Message | null>(null);
  const [sideTab, setSideTab] = React.useState<SideTab>('members');
  const [sideOpen, setSideOpen] = React.useState(true);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [messageQuery, setMessageQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<Message[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [pollOpen, setPollOpen] = React.useState(false);
  const [pollQuestion, setPollQuestion] = React.useState('');
  const [pollOptions, setPollOptions] = React.useState(['', '']);
  const [pollMultiple, setPollMultiple] = React.useState(false);
  const [loadingCommunities, setLoadingCommunities] = React.useState(true);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [loadingWorkspace, setLoadingWorkspace] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showCommunitiesMobile, setShowCommunitiesMobile] = React.useState(true);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recordingChunksRef = React.useRef<Blob[]>([]);
  const messageEndRef = React.useRef<HTMLDivElement>(null);
  const typingStopRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = React.useRef(0);
  const latestMessageAtRef = React.useRef<string | null>(null);

  const selectedCommunity = React.useMemo(
    () => communities.find((item) => item.id === selectedId) ?? null,
    [communities, selectedId],
  );
  const filteredCommunities = React.useMemo(() => {
    const query = communityQuery.trim().toLowerCase();
    if (!query) return communities;
    return communities.filter((item) => `${item.name} ${item.description ?? ''} ${item.type}`.toLowerCase().includes(query));
  }, [communities, communityQuery]);
  const pollByMessage = React.useMemo(
    () => new Map((workspace?.polls ?? []).map((poll) => [poll.messageId, poll])),
    [workspace?.polls],
  );

  const loadCommunities = React.useCallback(async () => {
    setLoadingCommunities(true);
    try {
      const response = await fetch('/api/community/chat/communities', { cache: 'no-store' });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok || !payload || typeof payload !== 'object' || !Array.isArray((payload as { communities?: unknown }).communities)) {
        throw new Error(readApiError(payload, 'Unable to load academic communities.'));
      }
      const next = (payload as { communities: Community[] }).communities;
      setCommunities(next);
      setSelectedId((current) => current && next.some((item) => item.id === current) ? current : next[0]?.id ?? null);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to load academic communities.');
    } finally {
      setLoadingCommunities(false);
    }
  }, []);

  const loadMessages = React.useCallback(async (communityId: string, quiet = false) => {
    if (!quiet) setLoadingMessages(true);
    try {
      const response = await fetch(`/api/community/chat/communities/${communityId}/messages?limit=60`, { cache: 'no-store' });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok || !payload || typeof payload !== 'object' || !Array.isArray((payload as { messages?: unknown }).messages)) {
        throw new Error(readApiError(payload, 'Unable to load messages.'));
      }
      const next = (payload as { messages: Message[] }).messages;
      setMessages(next);
      latestMessageAtRef.current = next[next.length - 1]?.createdAt ?? null;
      window.setTimeout(() => messageEndRef.current?.scrollIntoView({ block: 'end' }), quiet ? 0 : 30);
    } catch (cause: unknown) {
      if (!quiet) setError(cause instanceof Error ? cause.message : 'Unable to load messages.');
    } finally {
      if (!quiet) setLoadingMessages(false);
    }
  }, []);

  const loadWorkspace = React.useCallback(async (communityId: string, quiet = false) => {
    if (!quiet) setLoadingWorkspace(true);
    try {
      const response = await fetch(`/api/community/chat/communities/${communityId}/workspace`, { cache: 'no-store' });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok || !payload || typeof payload !== 'object' || !Array.isArray((payload as { members?: unknown }).members)) {
        throw new Error(readApiError(payload, 'Unable to load community workspace.'));
      }
      setWorkspace(payload as Workspace);
    } catch (cause: unknown) {
      if (!quiet) setError(cause instanceof Error ? cause.message : 'Unable to load community workspace.');
    } finally {
      if (!quiet) setLoadingWorkspace(false);
    }
  }, []);

  const sendPresence = React.useCallback(async (communityId: string, action: 'heartbeat' | 'typing_start' | 'typing_stop') => {
    try {
      await fetch(`/api/community/chat/communities/${communityId}/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
    } catch {
      // Presence is best-effort. The SSE stream remains authoritative for display state.
    }
  }, []);

  React.useEffect(() => {
    void loadCommunities();
  }, [loadCommunities]);

  React.useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setWorkspace(null);
      return;
    }
    void Promise.all([loadMessages(selectedId), loadWorkspace(selectedId)]);
    void sendPresence(selectedId, 'heartbeat');
    const heartbeat = window.setInterval(() => void sendPresence(selectedId, 'heartbeat'), 30_000);
    return () => window.clearInterval(heartbeat);
  }, [selectedId, loadMessages, loadWorkspace, sendPresence]);

  React.useEffect(() => {
    if (!selectedId) return;
    const after = latestMessageAtRef.current ?? new Date(Date.now() - 30_000).toISOString();
    const events = new EventSource(`/api/community/chat/communities/${selectedId}/events?after=${encodeURIComponent(after)}`);
    const refresh = () => {
      void loadMessages(selectedId, true);
      void loadCommunities();
    };
    const presence = (event: Event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as {
          online: Array<{ userId: string; lastSeenAt: string }>;
          typing: Workspace['typing'];
        };
        setWorkspace((current) => current && current.community.id === selectedId ? {
          ...current,
          typing: data.typing,
          members: current.members.map((member) => {
            const online = data.online.find((item) => item.userId === member.user.id);
            return { ...member, online: Boolean(online), lastSeenAt: online?.lastSeenAt ?? member.lastSeenAt };
          }),
        } : current);
      } catch {
        // Ignore malformed realtime events; the next valid heartbeat will repair state.
      }
    };
    events.addEventListener('messages', refresh);
    events.addEventListener('presence', presence);
    return () => events.close();
  }, [selectedId, loadCommunities, loadMessages]);

  React.useEffect(() => () => {
    if (typingStopRef.current) clearTimeout(typingStopRef.current);
    typingStopRef.current = null;
  }, [selectedId]);

  React.useEffect(() => () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state !== 'inactive') recorder.stop();
    recorder.stream.getTracks().forEach((track) => track.stop());
    mediaRecorderRef.current = null;
  }, []);

  const chooseCommunity = (id: string) => {
    setSelectedId(id);
    setReplyTo(null);
    setThreadFor(null);
    setSideTab('members');
    setShowCommunitiesMobile(false);
  };

  const addFiles = (incoming: FileList | File[]) => {
    const next = [...files];
    for (const file of Array.from(incoming)) {
      if (next.length >= 5) break;
      const limit = file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/') ? FIVE_MB : TEN_MB;
      if (file.size > limit) {
        setError(`${file.name} is too large. Media is limited to 5 MB; documents to 10 MB.`);
        continue;
      }
      next.push(file);
    }
    setFiles(next);
  };

  const stopTyping = React.useCallback(() => {
    if (selectedId) void sendPresence(selectedId, 'typing_stop');
  }, [selectedId, sendPresence]);

  const changeBody = (value: string) => {
    setBody(value);
    if (!selectedId) return;
    if (value.trim() && Date.now() - lastTypingSentRef.current > 2500) {
      lastTypingSentRef.current = Date.now();
      void sendPresence(selectedId, 'typing_start');
    }
    if (typingStopRef.current) clearTimeout(typingStopRef.current);
    typingStopRef.current = setTimeout(stopTyping, 3500);
  };

  const sendMessage = async () => {
    if (!selectedId || sending || (!body.trim() && files.length === 0)) return;
    setSending(true);
    setError(null);
    stopTyping();
    try {
      const form = new FormData();
      form.set('body', body.trim());
      if (replyTo) form.set('replyToId', replyTo.id);
      files.forEach((file) => form.append('files', file));
      const response = await fetch(`/api/community/chat/communities/${selectedId}/messages`, { method: 'POST', body: form });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(readApiError(payload, 'Message could not be sent.'));
      setBody('');
      setFiles([]);
      setReplyTo(null);
      await Promise.all([loadMessages(selectedId, true), loadWorkspace(selectedId, true), loadCommunities()]);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const actionMessage = async (path: string, options: RequestInit = {}) => {
    if (!selectedId) return false;
    const response = await fetch(path, options);
    const payload: unknown = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(readApiError(payload, 'Action could not be completed.'));
      return false;
    }
    await Promise.all([loadMessages(selectedId, true), loadWorkspace(selectedId, true), loadCommunities()]);
    return true;
  };

  const openThread = async (message: Message) => {
    setThreadFor(message);
    setThreadReplies([]);
    setSideOpen(true);
    try {
      const response = await fetch(`/api/community/chat/messages/${message.id}/thread`, { cache: 'no-store' });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(readApiError(payload, 'Thread could not be loaded.'));
        return;
      }
      if (Array.isArray(payload)) setThreadReplies(payload as Message[]);
    } catch {
      setError('Thread could not be loaded.');
    }
  };

  const submitReport = async () => {
    if (!reportMessage) return;
    try {
      const response = await fetch(`/api/community/chat/messages/${reportMessage.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason, description: reportDescription.trim() || undefined }),
      });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(readApiError(payload, 'Report could not be submitted.'));
        return;
      }
      setReportMessage(null);
      setReportDescription('');
      if (selectedId) await loadWorkspace(selectedId, true);
    } catch {
      setError('Report could not be submitted.');
    }
  };

  const saveEdit = async () => {
    if (!editMessage || !editBody.trim()) return;
    const ok = await actionMessage(`/api/community/chat/messages/${editMessage.id}/manage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: editBody.trim() }),
    });
    if (ok) setEditMessage(null);
  };

  const confirmDelete = async () => {
    if (!deleteMessage) return;
    const ok = await actionMessage(`/api/community/chat/messages/${deleteMessage.id}/manage`, { method: 'DELETE' });
    if (ok) setDeleteMessage(null);
  };

  const changeNotification = async (level: Workspace['notificationLevel']) => {
    if (!selectedId) return;
    try {
      const response = await fetch(`/api/community/chat/communities/${selectedId}/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level }),
      });
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => ({}));
        setError(readApiError(payload, 'Notification preference could not be updated.'));
        return;
      }
      setWorkspace((current) => current ? { ...current, notificationLevel: level } : current);
      void loadCommunities();
    } catch {
      setError('Notification preference could not be updated.');
    }
  };

  const runSearch = React.useCallback(async () => {
    if (!selectedId || messageQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const response = await fetch(`/api/community/chat/communities/${selectedId}/search?q=${encodeURIComponent(messageQuery.trim())}`, { cache: 'no-store' });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(payload)) throw new Error(readApiError(payload, 'Search failed.'));
      setSearchResults(payload as Message[]);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Search failed.');
    } finally {
      setSearching(false);
    }
  }, [messageQuery, selectedId]);

  React.useEffect(() => {
    if (!searchOpen) return;
    const timer = setTimeout(() => void runSearch(), 280);
    return () => clearTimeout(timer);
  }, [searchOpen, runSearch]);

  const createPoll = async () => {
    if (!selectedId || pollQuestion.trim().length < 5) return;
    const options = pollOptions.map((item) => item.trim()).filter(Boolean);
    if (options.length < 2) {
      setError('Add at least two poll options.');
      return;
    }
    try {
      const response = await fetch(`/api/community/chat/communities/${selectedId}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: pollQuestion.trim(), options, isMultipleChoice: pollMultiple }),
      });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(readApiError(payload, 'Poll could not be created.'));
        return;
      }
      setPollOpen(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setPollMultiple(false);
      await Promise.all([loadMessages(selectedId, true), loadWorkspace(selectedId, true)]);
    } catch {
      setError('Poll could not be created.');
    }
  };

  const votePoll = async (pollId: string, optionId: string, multiple: boolean) => {
    if (!selectedId || !workspace) return;
    const poll = workspace.polls.find((item) => item.id === pollId);
    if (!poll) return;
    const selected = poll.options.filter((option) => option.selectedByMe).map((option) => option.id);
    const optionIds = multiple
      ? selected.includes(optionId) ? selected.filter((id) => id !== optionId) : [...selected, optionId]
      : [optionId];
    if (!optionIds.length) return;
    try {
      const response = await fetch(`/api/community/chat/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionIds }),
      });
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => ({}));
        setError(readApiError(payload, 'Vote could not be recorded.'));
        return;
      }
      await loadWorkspace(selectedId, true);
    } catch {
      setError('Vote could not be recorded.');
    }
  };

  const startVoiceRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm';
        const blob = new Blob(recordingChunksRef.current, { type });
        stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;
        setRecording(false);
        if (blob.size > FIVE_MB) {
          setError('Voice notes are limited to 5 MB.');
          return;
        }
        addFiles([new File([blob], `voice-note-${Date.now()}.webm`, { type })]);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError('Microphone access is unavailable. Check browser permission and try again.');
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-[0_18px_55px_rgba(15,30,55,0.10)]" aria-label="Academic collaboration workspace">
      <div className={`grid min-h-[calc(100dvh-176px)] ${sideOpen ? 'xl:grid-cols-[292px_minmax(0,1fr)_330px]' : 'xl:grid-cols-[292px_minmax(0,1fr)]'}`}>
        <CommunityRail
          communities={filteredCommunities}
          query={communityQuery}
          onQuery={setCommunityQuery}
          selectedId={selectedId}
          loading={loadingCommunities}
          onRefresh={() => void loadCommunities()}
          onChoose={chooseCommunity}
          visibleMobile={showCommunitiesMobile}
        />

        <main className={`${showCommunitiesMobile && !selectedCommunity ? 'hidden' : 'flex'} min-h-0 min-w-0 flex-col bg-white xl:flex`}>
          {selectedCommunity ? (
            <>
              <header className="flex min-h-[76px] items-center justify-between gap-3 border-b border-[#E1E7EF] px-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <button type="button" onClick={() => setShowCommunitiesMobile(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#D7E0EB] xl:hidden" aria-label="Show communities"><ArrowLeft className="h-4 w-4" /></button>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF0FF] text-[#1754E8]"><CommunityIcon type={selectedCommunity.type} /></span>
                  <div className="min-w-0">
                    <h2 className="truncate text-[15px] font-black text-[#101D38] sm:text-base">{selectedCommunity.name}</h2>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-[#667085]">
                      <span>{selectedCommunity.memberCount} members</span><span>•</span><span>{workspace?.members.filter((member) => member.online).length ?? 0} online</span><span>•</span><span>{pretty(selectedCommunity.type)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => { setSearchOpen(true); setMessageQuery(''); setSearchResults([]); }} className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D7E0EB] text-[#53627A] hover:border-[#AFC3EB] hover:text-[#1754E8]" aria-label="Search messages"><Search className="h-4 w-4" /></button>
                  <button type="button" onClick={() => { setSideOpen(true); setSideTab('info'); }} className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D7E0EB] text-[#53627A] hover:border-[#AFC3EB] hover:text-[#1754E8]" aria-label="Community details"><Info className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setSideOpen((value) => !value)} className="hidden h-10 w-10 items-center justify-center rounded-lg border border-[#D7E0EB] text-[#53627A] hover:text-[#1754E8] xl:flex" aria-label="Toggle details panel"><Menu className="h-4 w-4" /></button>
                </div>
              </header>

              {error && <div role="alert" className="mx-4 mt-3 flex items-start justify-between gap-3 rounded-xl border border-[#F1CBC7] bg-[#FFF7F6] px-3 py-2.5 text-xs font-semibold text-[#9F2D24]"><span>{error}</span><button type="button" onClick={() => setError(null)} aria-label="Dismiss error"><X className="h-4 w-4" /></button></div>}

              <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFD] px-3 py-4 sm:px-5" aria-live="polite">
                {loadingMessages ? <MessageSkeleton /> : messages.length ? (
                  <div className="mx-auto max-w-[900px] space-y-2">
                    {messages.map((message) => (
                      <MessageRow
                        key={message.id}
                        message={message}
                        currentUserId={workspace?.currentUserId ?? ''}
                        canModerate={Boolean(workspace?.permissions.canModerate)}
                        canPin={Boolean(workspace?.permissions.canPin)}
                        poll={pollByMessage.get(message.id)}
                        onVote={votePoll}
                        onReply={() => setReplyTo(message)}
                        onThread={() => void openThread(message)}
                        onReact={(reaction) => void actionMessage(`/api/community/chat/messages/${message.id}/reactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reactionType: reaction }) })}
                        onBookmark={() => void actionMessage(`/api/community/chat/messages/${message.id}/bookmark`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })}
                        onPin={() => void actionMessage(`/api/community/chat/messages/${message.id}/pin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })}
                        onEdit={() => { setEditMessage(message); setEditBody(message.body); }}
                        onDelete={() => setDeleteMessage(message)}
                        onReport={() => { setReportMessage(message); setReportReason('HARASSMENT'); }}
                      />
                    ))}
                    {workspace?.typing.length ? <div className="flex items-center gap-2 px-12 py-2 text-xs font-semibold text-[#667085]"><span className="inline-flex gap-1"><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1754E8]" /><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1754E8] [animation-delay:120ms]" /><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1754E8] [animation-delay:240ms]" /></span>{workspace.typing.slice(0, 2).map((item) => item.user.name).join(', ')} {workspace.typing.length > 1 ? 'are typing' : 'is typing'}…</div> : null}
                    <div ref={messageEndRef} />
                  </div>
                ) : <EmptyMessages />}
              </div>

              <Composer
                body={body}
                files={files}
                replyTo={replyTo}
                recording={recording}
                sending={sending}
                canPoll={Boolean(workspace?.permissions.canPoll)}
                onBody={changeBody}
                onBlur={stopTyping}
                onFiles={addFiles}
                onRemoveFile={(index) => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                onCancelReply={() => setReplyTo(null)}
                onVoice={() => void startVoiceRecording()}
                onPoll={() => setPollOpen(true)}
                onSend={() => void sendMessage()}
              />
            </>
          ) : <NoSelectedCommunity onOpen={() => setShowCommunitiesMobile(true)} />}
        </main>

        {sideOpen && selectedCommunity && (
          <DetailsPanel
            workspace={workspace}
            loading={loadingWorkspace}
            tab={sideTab}
            threadFor={threadFor}
            threadReplies={threadReplies}
            onTab={setSideTab}
            onClose={() => setSideOpen(false)}
            onNotification={changeNotification}
            onJump={(id) => document.getElementById(`chat-message-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          />
        )}
      </div>

      {searchOpen && <Modal title="Search this community" onClose={() => setSearchOpen(false)} wide><label className="flex h-11 items-center gap-2 rounded-xl border border-[#CCD7E5] px-3 focus-within:border-[#1754E8]"><Search className="h-4 w-4 text-[#7A8698]" /><input autoFocus value={messageQuery} onChange={(event) => setMessageQuery(event.target.value)} placeholder="Search messages, links or topics" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />{searching && <Loader2 className="h-4 w-4 animate-spin text-[#1754E8]" />}</label><div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto">{messageQuery.trim().length < 2 ? <Hint text="Enter at least two characters." /> : searchResults.length ? searchResults.map((message) => <button key={message.id} type="button" onClick={() => { setSearchOpen(false); document.getElementById(`chat-message-${message.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} className="w-full rounded-xl border border-[#E1E7EF] p-3 text-left hover:border-[#B8C9E8] hover:bg-[#F8FAFD]"><div className="flex items-center justify-between gap-3"><span className="text-xs font-black text-[#17223B]">{message.author.name}</span><span className="text-[10px] text-[#98A2B3]">{messageTime(message.createdAt)}</span></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#667085]">{message.body}</p></button>) : !searching && <Hint text="No authorised messages match your search." />}</div></Modal>}

      {pollOpen && <Modal title="Create a community poll" onClose={() => setPollOpen(false)}><label className="text-xs font-black text-[#344054]">Question<textarea value={pollQuestion} onChange={(event) => setPollQuestion(event.target.value)} maxLength={500} rows={3} className="mt-1.5 w-full rounded-xl border border-[#CCD7E5] p-3 text-sm font-normal outline-none focus:border-[#1754E8]" placeholder="What should the class decide?" /></label><div className="mt-4 space-y-2">{pollOptions.map((option, index) => <div key={index} className="flex gap-2"><input value={option} onChange={(event) => setPollOptions((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} maxLength={200} placeholder={`Option ${index + 1}`} className="h-10 flex-1 rounded-lg border border-[#CCD7E5] px-3 text-sm outline-none focus:border-[#1754E8]" />{pollOptions.length > 2 && <button type="button" onClick={() => setPollOptions((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="h-10 w-10 rounded-lg border border-[#E1E7EF] text-[#667085]" aria-label={`Remove option ${index + 1}`}><X className="mx-auto h-4 w-4" /></button>}</div>)}</div>{pollOptions.length < 10 && <button type="button" onClick={() => setPollOptions((current) => [...current, ''])} className="mt-2 text-xs font-black text-[#1754E8]">+ Add option</button>}<label className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#53627A]"><input type="checkbox" checked={pollMultiple} onChange={(event) => setPollMultiple(event.target.checked)} />Allow multiple selections</label><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setPollOpen(false)} className="h-10 rounded-lg border border-[#D7E0EB] px-4 text-xs font-black text-[#53627A]">Cancel</button><button type="button" onClick={() => void createPoll()} className="h-10 rounded-lg bg-[#1754E8] px-4 text-xs font-black text-white">Publish poll</button></div></Modal>}

      {reportMessage && <Modal title="Report message" onClose={() => setReportMessage(null)}><p className="rounded-xl bg-[#F7F9FC] p-3 text-xs leading-5 text-[#667085]">“{reportMessage.body.slice(0, 180)}”</p><label className="mt-4 block text-xs font-black text-[#344054]">Reason<select value={reportReason} onChange={(event) => setReportReason(event.target.value as ReportReason)} className="mt-1.5 h-10 w-full rounded-lg border border-[#CCD7E5] px-3 text-sm font-normal outline-none">{REPORT_REASONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="mt-4 block text-xs font-black text-[#344054]">Additional context<textarea value={reportDescription} onChange={(event) => setReportDescription(event.target.value)} maxLength={1000} rows={3} className="mt-1.5 w-full rounded-xl border border-[#CCD7E5] p-3 text-sm font-normal outline-none" /></label><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setReportMessage(null)} className="h-10 rounded-lg border border-[#D7E0EB] px-4 text-xs font-black">Cancel</button><button type="button" onClick={() => void submitReport()} className="h-10 rounded-lg bg-[#A63D31] px-4 text-xs font-black text-white">Submit report</button></div></Modal>}

      {editMessage && <Modal title="Edit message" onClose={() => setEditMessage(null)}><textarea autoFocus value={editBody} onChange={(event) => setEditBody(event.target.value)} rows={5} maxLength={5000} className="w-full rounded-xl border border-[#CCD7E5] p-3 text-sm outline-none focus:border-[#1754E8]" /><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setEditMessage(null)} className="h-10 rounded-lg border border-[#D7E0EB] px-4 text-xs font-black">Cancel</button><button type="button" onClick={() => void saveEdit()} className="h-10 rounded-lg bg-[#1754E8] px-4 text-xs font-black text-white">Save changes</button></div></Modal>}

      {deleteMessage && <Modal title="Delete message?" onClose={() => setDeleteMessage(null)}><p className="text-sm leading-6 text-[#667085]">This removes the message from the community conversation. Moderation and audit records remain available to authorised staff where required.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setDeleteMessage(null)} className="h-10 rounded-lg border border-[#D7E0EB] px-4 text-xs font-black">Cancel</button><button type="button" onClick={() => void confirmDelete()} className="h-10 rounded-lg bg-[#A63D31] px-4 text-xs font-black text-white">Delete</button></div></Modal>}
    </section>
  );
}

function CommunityRail(props: { communities: Community[]; query: string; onQuery: (value: string) => void; selectedId: string | null; loading: boolean; onRefresh: () => void; onChoose: (id: string) => void; visibleMobile: boolean }) {
  return <aside className={`${props.visibleMobile ? 'flex' : 'hidden'} min-h-0 flex-col bg-[#0B1739] text-white xl:flex`}><div className="border-b border-white/10 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#92A7D5]">CampusOS collaboration</p><h1 className="mt-1 text-lg font-black tracking-[-0.03em]">Academic Communities</h1></div><button type="button" onClick={props.onRefresh} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-[#C9D5F1] hover:bg-white/10" aria-label="Refresh communities"><RefreshCw className={`h-4 w-4 ${props.loading ? 'animate-spin' : ''}`} /></button></div><label className="mt-4 flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 focus-within:border-[#7BA2FF]"><Search className="h-4 w-4 text-[#93A8D2]" aria-hidden="true" /><input value={props.query} onChange={(event) => props.onQuery(event.target.value)} placeholder="Search communities" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#8295BD]" /></label></div><div className="min-h-0 flex-1 overflow-y-auto p-2">{props.loading ? <RailSkeleton /> : props.communities.length ? props.communities.map((community) => <button key={community.id} type="button" onClick={() => props.onChoose(community.id)} className={`mb-1 flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${props.selectedId === community.id ? 'border-[#5D82DB] bg-[#163066]' : 'border-transparent hover:border-white/10 hover:bg-white/5'}`}><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${community.type === 'COURSE' ? 'bg-[#2D59B5] text-white' : 'bg-[#123F3D] text-[#7CE0C5]'}`}><CommunityIcon type={community.type} /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-[13px] font-extrabold">{community.name}</span><span className="shrink-0 text-[10px] font-bold text-[#8295BD]">{relativeTime(community.lastActivityAt)}</span></span><span className="mt-1 block truncate text-[11px] text-[#A9B8D9]">{community.lastMessagePreview ?? community.description ?? 'No messages yet'}</span><span className="mt-2 flex items-center justify-between"><span className="text-[9px] font-black uppercase tracking-[0.08em] text-[#8295BD]">{pretty(community.type)}</span>{community.unreadCount > 0 && <span className="rounded-full bg-[#4E7DFF] px-2 py-0.5 text-[9px] font-black">{community.unreadCount > 99 ? '99+' : community.unreadCount}</span>}</span></span></button>) : <EmptyRail />}</div><div className="border-t border-white/10 p-3 text-[10px] leading-4 text-[#94A7CE]"><ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-[#70D1B6]" />Access is derived from active programme, section, enrolment and faculty assignment records.</div></aside>;
}

function Composer(props: { body: string; files: File[]; replyTo: Message | null; recording: boolean; sending: boolean; canPoll: boolean; onBody: (value: string) => void; onBlur: () => void; onFiles: (files: FileList) => void; onRemoveFile: (index: number) => void; onCancelReply: () => void; onVoice: () => void; onPoll: () => void; onSend: () => void }) {
  return <div className="border-t border-[#E1E7EF] bg-white p-3 sm:p-4"><div className="mx-auto max-w-[900px]">{props.replyTo && <div className="mb-2 flex items-start justify-between gap-3 rounded-xl border border-[#D7E0EB] bg-[#F7F9FC] px-3 py-2"><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#1754E8]">Replying to {props.replyTo.author.name}</p><p className="mt-0.5 truncate text-xs text-[#667085]">{props.replyTo.body}</p></div><button type="button" onClick={props.onCancelReply} aria-label="Cancel reply"><X className="h-4 w-4 text-[#667085]" /></button></div>}{props.files.length > 0 && <div className="mb-2 flex flex-wrap gap-2">{props.files.map((file, index) => <span key={`${file.name}-${index}`} className="inline-flex max-w-[230px] items-center gap-2 rounded-lg border border-[#D7E0EB] bg-[#F8FAFC] px-2.5 py-1.5 text-[11px] font-semibold text-[#53627A]"><Paperclip className="h-3.5 w-3.5" /><span className="truncate">{file.name}</span><button type="button" onClick={() => props.onRemoveFile(index)} aria-label={`Remove ${file.name}`}><X className="h-3.5 w-3.5" /></button></span>)}</div>}<div className="rounded-2xl border border-[#CCD7E5] bg-white shadow-[0_7px_20px_rgba(15,30,55,0.06)] focus-within:border-[#91ABDE] focus-within:ring-2 focus-within:ring-[#1754E8]/10"><textarea value={props.body} onChange={(event) => props.onBody(event.target.value)} onBlur={() => { if (props.body.trim()) props.onBlur(); }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); props.onSend(); } }} rows={2} maxLength={5000} placeholder="Message this academic community…" className="min-h-[64px] w-full resize-none bg-transparent px-4 pt-3 text-sm text-[#17223B] outline-none placeholder:text-[#98A2B3]" /><div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#EEF1F5] px-2.5 py-2"><div className="flex items-center gap-1"><label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[#667085] hover:bg-[#F0F4FA] hover:text-[#1754E8]" title="Add image, short video or document"><Paperclip className="h-4 w-4" /><input type="file" multiple accept={ACCEPTED_FILES} className="sr-only" onChange={(event) => { if (event.target.files) props.onFiles(event.target.files); event.target.value = ''; }} /></label><button type="button" onClick={props.onVoice} className={`flex h-9 w-9 items-center justify-center rounded-lg ${props.recording ? 'bg-[#FDECEC] text-[#C0362C]' : 'text-[#667085] hover:bg-[#F0F4FA] hover:text-[#1754E8]'}`} aria-label={props.recording ? 'Stop voice recording' : 'Record voice note'}><Mic className="h-4 w-4" /></button>{props.canPoll && <button type="button" onClick={props.onPoll} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#667085] hover:bg-[#F0F4FA] hover:text-[#1754E8]" aria-label="Create poll"><Plus className="h-4 w-4" /></button>}<span className="hidden pl-1 text-[10px] font-semibold text-[#98A2B3] sm:inline">Media 5 MB · Documents 10 MB</span></div><button type="button" onClick={props.onSend} disabled={props.sending || (!props.body.trim() && props.files.length === 0)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#1754E8] px-4 text-xs font-black text-white shadow-sm hover:bg-[#1046C4] disabled:cursor-not-allowed disabled:opacity-50">{props.sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Send</button></div></div><p className="mt-2 flex items-center gap-1.5 text-[10px] text-[#8792A5]"><ShieldCheck className="h-3.5 w-3.5 text-[#087A55]" />Messages are tenant-scoped, academically authorised and checked against CampusOS community safety rules.</p></div></div>;
}

function DetailsPanel(props: { workspace: Workspace | null; loading: boolean; tab: SideTab; threadFor: Message | null; threadReplies: Message[]; onTab: (tab: SideTab) => void; onClose: () => void; onNotification: (level: Workspace['notificationLevel']) => void; onJump: (id: string) => void }) {
  return <aside className="fixed inset-y-0 right-0 z-[70] w-[min(92vw,360px)] border-l border-[#E1E7EF] bg-white shadow-[-20px_0_45px_rgba(15,30,55,0.14)] xl:static xl:z-auto xl:w-auto xl:shadow-none"><div className="flex h-full min-h-0 flex-col"><div className="flex min-h-[76px] items-center justify-between border-b border-[#E1E7EF] px-4"><div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#7A8698]">Community workspace</p><h3 className="mt-1 text-sm font-black text-[#17223B]">{props.tab === 'members' ? 'People' : pretty(props.tab)}</h3></div><button type="button" onClick={props.onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D7E0EB] text-[#667085]" aria-label="Close details"><X className="h-4 w-4" /></button></div><div className="flex gap-1 overflow-x-auto border-b border-[#E1E7EF] px-2 py-2">{(['members', 'info', 'media', 'saved'] as SideTab[]).map((tab) => <button key={tab} type="button" onClick={() => props.onTab(tab)} className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.06em] ${props.tab === tab ? 'bg-[#EAF0FF] text-[#1754E8]' : 'text-[#667085] hover:bg-[#F5F7FA]'}`}>{tab}</button>)}{props.workspace?.permissions.canModerate && <button type="button" onClick={() => props.onTab('moderation')} className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.06em] ${props.tab === 'moderation' ? 'bg-[#FFF0ED] text-[#A63D31]' : 'text-[#667085] hover:bg-[#F5F7FA]'}`}>Moderation{props.workspace.moderationCases.length ? ` · ${props.workspace.moderationCases.length}` : ''}</button>}</div><div className="min-h-0 flex-1 overflow-y-auto p-4">{props.loading ? <PanelSkeleton /> : props.workspace ? <WorkspacePanel workspace={props.workspace} tab={props.tab} threadFor={props.threadFor} threadReplies={props.threadReplies} onNotification={props.onNotification} onJump={props.onJump} /> : null}</div></div></aside>;
}

function MessageRow(props: { message: Message; currentUserId: string; canModerate: boolean; canPin: boolean; poll?: Poll; onVote: (pollId: string, optionId: string, multiple: boolean) => void; onReply: () => void; onThread: () => void; onReact: (reaction: string) => void; onBookmark: () => void; onPin: () => void; onEdit: () => void; onDelete: () => void; onReport: () => void }) {
  const { message } = props;
  const mine = message.author.id === props.currentUserId;
  return <article id={`chat-message-${message.id}`} className="group rounded-2xl border border-transparent px-3 py-3 transition hover:border-[#E1E7EF] hover:bg-white hover:shadow-[0_5px_18px_rgba(15,30,55,0.05)] sm:px-4"><div className="flex gap-3"><Avatar user={message.author} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-[13px] font-black text-[#17223B]">{message.author.name}</span><RoleBadge role={message.author.role} /><span className="text-[10px] text-[#98A2B3]">{messageTime(message.createdAt)}</span>{message.isEdited && <span className="text-[10px] text-[#98A2B3]">edited</span>}{message.isPinned && <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#A56B00]"><Pin className="h-3 w-3" />Pinned</span>}</div>{message.replyTo && <div className="mt-2 rounded-lg border-l-2 border-[#AFC3EB] bg-[#F7F9FC] px-3 py-1.5 text-[11px] text-[#667085]"><span className="font-black text-[#344054]">{message.replyTo.authorName}</span> · {message.replyTo.bodyPreview}</div>}{message.body && <p className="mt-1.5 whitespace-pre-wrap break-words text-[13px] leading-6 text-[#344054]">{message.body}</p>}{message.attachments.length > 0 && <AttachmentGrid attachments={message.attachments} />}{props.poll && <PollCard poll={props.poll} onVote={props.onVote} />}<div className="mt-2 flex flex-wrap items-center gap-1.5">{message.reactions.map((reaction) => { const config = REACTIONS.find((item) => item.key === reaction.reactionType); return <button key={reaction.reactionType} type="button" onClick={() => props.onReact(reaction.reactionType)} className="rounded-full border border-[#DCE3EC] bg-white px-2 py-1 text-[10px] font-bold text-[#53627A] hover:border-[#ABC1E8]">{config?.icon ?? '•'} {reaction.count}</button>; })}</div><div className="mt-2 flex flex-wrap items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"><ActionButton icon={Reply} label="Reply" onClick={props.onReply} /><ActionButton icon={MessageCircle} label={message.replyCount ? `${message.replyCount} replies` : 'Thread'} onClick={props.onThread} /><ActionButton icon={Bookmark} label={message.isBookmarked ? 'Saved' : 'Save'} onClick={props.onBookmark} active={message.isBookmarked} />{props.canPin && <ActionButton icon={Pin} label={message.isPinned ? 'Unpin' : 'Pin'} onClick={props.onPin} active={message.isPinned} />}{REACTIONS.slice(0, 3).map((reaction) => <button key={reaction.key} type="button" onClick={() => props.onReact(reaction.key)} title={reaction.label} className="flex h-7 w-7 items-center justify-center rounded-md text-sm hover:bg-[#EEF3FA]">{reaction.icon}</button>)}{mine && <ActionButton icon={Pencil} label="Edit" onClick={props.onEdit} />}{(mine || props.canModerate) && <ActionButton icon={Trash2} label="Delete" onClick={props.onDelete} danger />}{!mine && <ActionButton icon={Flag} label="Report" onClick={props.onReport} />}</div>{message.readCount !== undefined && mine && <p className="mt-1 text-[9px] font-semibold text-[#98A2B3]">Seen by {Math.max(0, message.readCount - 1)} {message.readCount - 1 === 1 ? 'person' : 'people'}</p>}</div></div></article>;
}

function WorkspacePanel({ workspace, tab, threadFor, threadReplies, onNotification, onJump }: { workspace: Workspace; tab: SideTab; threadFor: Message | null; threadReplies: Message[]; onNotification: (level: Workspace['notificationLevel']) => void; onJump: (id: string) => void }) {
  if (threadFor) return <div><button type="button" className="mb-3 text-xs font-black text-[#1754E8]" onClick={() => onJump(threadFor.id)}>View original message</button><p className="rounded-xl bg-[#F6F8FB] p-3 text-xs leading-5 text-[#53627A]">{threadFor.body}</p><h4 className="mt-5 text-xs font-black uppercase tracking-[0.08em] text-[#667085]">Thread replies</h4><div className="mt-3 space-y-3">{threadReplies.length ? threadReplies.map((message) => <div key={message.id} className="rounded-xl border border-[#E1E7EF] p-3"><div className="flex items-center gap-2"><Avatar user={message.author} small /><div><p className="text-xs font-black text-[#17223B]">{message.author.name}</p><p className="text-[10px] text-[#98A2B3]">{messageTime(message.createdAt)}</p></div></div><p className="mt-2 text-xs leading-5 text-[#53627A]">{message.body}</p></div>) : <Hint text="No replies yet." />}</div></div>;
  if (tab === 'members') return <div><div className="mb-4 grid grid-cols-2 gap-2"><Stat label="Members" value={String(workspace.members.length)} /><Stat label="Online" value={String(workspace.members.filter((member) => member.online).length)} /></div><div className="space-y-2">{workspace.members.map((member) => <div key={member.id} className="flex items-center gap-3 rounded-xl border border-[#E7ECF2] p-2.5"><span className="relative"><Avatar user={member.user} /><i className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${member.online ? 'bg-[#16A36A]' : 'bg-[#CBD3DE]'}`} /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-black text-[#17223B]">{member.user.name}</p><p className="mt-0.5 text-[10px] text-[#7A8698]">{pretty(member.user.role)} · {pretty(member.role)}</p></div><span className="text-[9px] text-[#98A2B3]">{member.online ? 'Online' : member.lastSeenAt ? relativeTime(member.lastSeenAt) : ''}</span></div>)}</div></div>;
  if (tab === 'info') return <div className="space-y-5"><div><p className="text-sm font-black text-[#17223B]">{workspace.community.name}</p><p className="mt-1 text-xs leading-5 text-[#667085]">{workspace.community.description ?? 'Academic collaboration space.'}</p></div><div className="rounded-xl border border-[#E1E7EF] p-3"><p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.08em] text-[#7A8698]"><Bell className="h-3.5 w-3.5" />Notifications</p><select value={workspace.notificationLevel} onChange={(event) => onNotification(event.target.value as Workspace['notificationLevel'])} className="mt-2 h-10 w-full rounded-lg border border-[#CCD7E5] px-2.5 text-xs font-bold text-[#344054] outline-none"><option value="ALL">All messages</option><option value="MENTIONS_ONLY">Mentions only</option><option value="IMPORTANT_ONLY">Important only</option><option value="MUTED">Muted</option></select></div><div><p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#7A8698]">Community policy</p><div className="mt-2 space-y-2 rounded-xl bg-[#F7F9FC] p-3 text-xs leading-5 text-[#53627A]">{(workspace.community.rules ?? 'Respect institutional policy and academic integrity.').split('\n').filter(Boolean).map((line) => <p key={line}>• {line}</p>)}</div></div><div className="grid grid-cols-2 gap-2"><Stat label="Posting" value={pretty(workspace.community.postingPolicy)} small /><Stat label="Media" value={pretty(workspace.community.mediaPolicy)} small /></div></div>;
  if (tab === 'media') return workspace.media.length ? <div className="grid grid-cols-2 gap-2">{workspace.media.map((item) => <a key={item.id} href={item.fileUrl} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-[#E1E7EF] bg-[#F8FAFD] hover:border-[#B8C9E8]"><div className="flex aspect-[4/3] items-center justify-center bg-[#EEF3F8]">{item.attachmentType === 'IMAGE' || item.attachmentType === 'GIF' ? <img src={item.fileUrl} alt={item.fileName} className="h-full w-full object-cover" /> : item.attachmentType === 'VIDEO' ? <Video className="h-7 w-7 text-[#1754E8]" /> : <FileText className="h-7 w-7 text-[#667085]" />}</div><div className="p-2"><p className="truncate text-[10px] font-black text-[#344054]">{item.fileName}</p><p className="mt-0.5 text-[9px] text-[#98A2B3]">{fileSize(item.fileSizeBytes)} · {item.author.name}</p></div></a>)}</div> : <Hint text="No shared media yet." />;
  if (tab === 'saved') return <div><PanelList title="Pinned" icon={Pin} messages={workspace.pinned} onJump={onJump} /><div className="my-5 border-t border-[#E1E7EF]" /><PanelList title="Saved by you" icon={Bookmark} messages={workspace.bookmarks} onJump={onJump} /></div>;
  return workspace.moderationCases.length ? <div className="space-y-3">{workspace.moderationCases.map((item) => <div key={item.id} className="rounded-xl border border-[#F1D2CE] bg-[#FFF9F8] p-3"><div className="flex items-center justify-between gap-2"><span className="rounded-full bg-[#FBE9E6] px-2 py-1 text-[9px] font-black uppercase text-[#A63D31]">{item.severity}</span><span className="text-[9px] text-[#98A2B3]">{relativeTime(item.createdAt)}</span></div><p className="mt-2 text-xs font-black text-[#344054]">{item.report?.reason ? pretty(item.report.reason) : 'Automated review'}</p><p className="mt-1 line-clamp-3 text-[11px] leading-5 text-[#667085]">{item.message.body}</p><button type="button" onClick={() => onJump(item.message.id)} className="mt-2 text-[10px] font-black text-[#1754E8]">View message</button></div>)}</div> : <Hint text="No open moderation cases in this community." />;
}

function PanelList({ title, icon: Icon, messages, onJump }: { title: string; icon: React.ComponentType<{ className?: string }>; messages: Message[]; onJump: (id: string) => void }) {
  return <section><h4 className="flex items-center gap-2 text-xs font-black text-[#344054]"><Icon className="h-4 w-4 text-[#1754E8]" />{title}</h4><div className="mt-3 space-y-2">{messages.length ? messages.map((message) => <button key={message.id} type="button" onClick={() => onJump(message.id)} className="w-full rounded-xl border border-[#E1E7EF] p-3 text-left hover:border-[#B8C9E8]"><p className="text-[10px] font-black text-[#344054]">{message.author.name}</p><p className="mt-1 line-clamp-2 text-[11px] leading-5 text-[#667085]">{message.body || `[${pretty(message.messageType)}]`}</p></button>) : <Hint text={`No ${title.toLowerCase()} yet.`} />}</div></section>;
}

function PollCard({ poll, onVote }: { poll: Poll; onVote: (pollId: string, optionId: string, multiple: boolean) => void }) {
  const total = poll.options.reduce((sum, option) => sum + option.voteCount, 0);
  return <div className="mt-3 max-w-xl rounded-xl border border-[#CFDBEC] bg-[#F9FBFE] p-3"><p className="text-xs font-black text-[#17223B]">{poll.question}</p><div className="mt-3 space-y-2">{poll.options.map((option) => { const pct = total ? Math.round(option.voteCount / total * 100) : 0; return <button key={option.id} type="button" onClick={() => onVote(poll.id, option.id, poll.isMultipleChoice)} className={`relative block w-full overflow-hidden rounded-lg border px-3 py-2.5 text-left ${option.selectedByMe ? 'border-[#7FA4EE] bg-[#EEF3FF]' : 'border-[#DCE3EC] bg-white'}`}><span className="absolute inset-y-0 left-0 bg-[#E4ECFF]" style={{ width: `${pct}%` }} /><span className="relative flex items-center justify-between gap-3 text-[11px]"><span className="font-bold text-[#344054]">{option.selectedByMe && <Check className="mr-1 inline h-3 w-3 text-[#1754E8]" />}{option.text}</span><span className="font-black text-[#667085]">{pct}%</span></span></button>; })}</div><p className="mt-2 text-[9px] text-[#98A2B3]">{total} vote{total === 1 ? '' : 's'}{poll.isMultipleChoice ? ' · multiple selections allowed' : ''}</p></div>;
}

function AttachmentGrid({ attachments }: { attachments: Attachment[] }) {
  return <div className="mt-3 grid max-w-2xl gap-2 sm:grid-cols-2">{attachments.map((attachment) => <a key={attachment.id} href={attachment.fileUrl} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white hover:border-[#B8C9E8]">{attachment.attachmentType === 'IMAGE' || attachment.attachmentType === 'GIF' ? <img src={attachment.fileUrl} alt={attachment.altText ?? attachment.fileName} className="max-h-64 w-full object-cover" /> : attachment.attachmentType === 'VIDEO' ? <video src={attachment.fileUrl} controls preload="metadata" className="max-h-64 w-full bg-black" /> : attachment.mimeType.startsWith('audio/') ? <div className="p-3"><audio src={attachment.fileUrl} controls preload="metadata" className="w-full" /><p className="mt-2 text-[10px] font-bold text-[#667085]">{attachment.fileName} · {fileSize(attachment.fileSizeBytes)}</p></div> : <div className="flex min-h-20 items-center gap-3 p-3"><FileText className="h-7 w-7 text-[#1754E8]" /><div className="min-w-0"><p className="truncate text-xs font-black text-[#344054]">{attachment.fileName}</p><p className="mt-1 text-[10px] text-[#98A2B3]">{fileSize(attachment.fileSizeBytes)}</p></div></div>}</a>)}</div>;
}

function Modal({ title, children, onClose, wide = false }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  const dialogRef = React.useRef<HTMLElement>(null);
  const closeRef = React.useRef(onClose);
  React.useEffect(() => { closeRef.current = onClose; }, [onClose]);
  React.useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, []);
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#08142E]/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={`max-h-[88dvh] overflow-y-auto rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-2xl outline-none ${wide ? 'w-full max-w-2xl' : 'w-full max-w-md'}`}><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-base font-black text-[#17223B]">{title}</h2><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D7E0EB]" aria-label="Close"><X className="h-4 w-4" /></button></div>{children}</section></div>;
}

function relativeTime(value: string | null) { if (!value) return ''; const ms = Date.now() - new Date(value).getTime(); if (!Number.isFinite(ms)) return ''; const minutes = Math.max(0, Math.round(ms / 60_000)); if (minutes < 1) return 'now'; if (minutes < 60) return `${minutes}m`; const hours = Math.round(minutes / 60); if (hours < 24) return `${hours}h`; return `${Math.round(hours / 24)}d`; }
function messageTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }).format(date); }
function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'CO'; }
function pretty(value: string) { return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function readApiError(payload: unknown, fallback: string) { return payload && typeof payload === 'object' && 'error' in payload && typeof (payload as { error?: unknown }).error === 'string' ? (payload as { error: string }).error : fallback; }
function fileSize(value: number) { return value < 1024 * 1024 ? `${Math.max(1, Math.round(value / 1024))} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`; }
function Avatar({ user, small = false }: { user: SafeUser; small?: boolean }) { const size = small ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-[11px]'; return user.avatarUrl ? <img src={user.avatarUrl} alt="" className={`${size} shrink-0 rounded-xl object-cover`} /> : <span className={`${size} flex shrink-0 items-center justify-center rounded-xl bg-[#EAF0FF] font-black text-[#1754E8]`}>{initials(user.name)}</span>; }
function RoleBadge({ role }: { role: string }) { const faculty = ['FACULTY', 'HOD', 'DEAN', 'INSTITUTION_ADMIN', 'SUPER_ADMIN'].includes(role); return <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.05em] ${faculty ? 'bg-[#E7F6F0] text-[#087A55]' : 'bg-[#EEF2F7] text-[#667085]'}`}>{pretty(role)}</span>; }
function ActionButton({ icon: Icon, label, onClick, active = false, danger = false }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; active?: boolean; danger?: boolean }) { return <button type="button" onClick={onClick} className={`inline-flex h-7 items-center gap-1 rounded-md px-2 text-[9px] font-black ${danger ? 'text-[#A63D31] hover:bg-[#FFF0ED]' : active ? 'bg-[#EAF0FF] text-[#1754E8]' : 'text-[#667085] hover:bg-[#EEF3FA] hover:text-[#1754E8]'}`}><Icon className="h-3 w-3" />{label}</button>; }
function CommunityIcon({ type }: { type: string }) { if (type === 'COURSE') return <BookOpen className="h-5 w-5" />; if (type === 'SECTION' || type === 'BATCH') return <UsersRound className="h-5 w-5" />; return <MessageCircle className="h-5 w-5" />; }
function Stat({ label, value, small = false }: { label: string; value: string; small?: boolean }) { return <div className="rounded-xl border border-[#E1E7EF] bg-[#F9FBFD] p-3"><p className="text-[9px] font-black uppercase tracking-[0.06em] text-[#7A8698]">{label}</p><p className={`mt-1 font-black text-[#17223B] ${small ? 'text-xs leading-4' : 'text-xl'}`}>{value}</p></div>; }
function Hint({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-[#D7E0EB] p-5 text-center text-xs leading-5 text-[#7A8698]">{text}</div>; }
function RailSkeleton() { return <div className="space-y-2 p-2">{[1, 2, 3, 4, 5].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-white/5" />)}</div>; }
function PanelSkeleton() { return <div className="space-y-3">{[1, 2, 3, 4].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-[#F0F3F7]" />)}</div>; }
function MessageSkeleton() { return <div className="mx-auto max-w-[900px] space-y-4">{[1, 2, 3, 4].map((item) => <div key={item} className="flex animate-pulse gap-3"><div className="h-10 w-10 rounded-xl bg-[#E8EDF4]" /><div className="flex-1"><div className="h-3 w-36 rounded bg-[#E8EDF4]" /><div className="mt-3 h-16 rounded-xl bg-[#EEF2F6]" /></div></div>)}</div>; }
function EmptyRail() { return <div className="p-6 text-center"><UsersRound className="mx-auto h-8 w-8 text-[#8195BE]" /><p className="mt-3 text-sm font-black">No authorised communities</p><p className="mt-1 text-xs leading-5 text-[#9DB0D4]">Groups are created from active academic records.</p></div>; }
function EmptyMessages() { return <div className="flex h-full min-h-[360px] items-center justify-center"><div className="max-w-sm text-center"><Sparkles className="mx-auto h-10 w-10 text-[#91A0B5]" /><h3 className="mt-3 text-sm font-black text-[#344054]">Start the academic conversation</h3><p className="mt-1 text-xs leading-5 text-[#7A8698]">Share a question, class update, image, voice note, short video, document or safe link with authorised members.</p></div></div>; }
function NoSelectedCommunity({ onOpen }: { onOpen: () => void }) { return <div className="flex min-h-[520px] flex-1 items-center justify-center p-6"><div className="max-w-sm text-center"><MessageCircle className="mx-auto h-12 w-12 text-[#A5B0C0]" /><h2 className="mt-4 text-lg font-black text-[#17223B]">Select an academic community</h2><p className="mt-2 text-sm leading-6 text-[#667085]">Only groups authorised by your CampusOS academic records are shown.</p><button type="button" onClick={onOpen} className="mt-5 rounded-lg bg-[#1754E8] px-4 py-2.5 text-xs font-black text-white xl:hidden">Open communities</button></div></div>; }
