'use client';

import Link from 'next/link';
import React from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FileText,
  Flag,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Paperclip,
  RefreshCw,
  Reply,
  Search,
  Send,
  ShieldCheck,
  ThumbsUp,
  UsersRound,
  Video,
  X,
} from 'lucide-react';

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

type Reaction = {
  reactionType: string;
  count: number;
  userIds?: string[];
  reactedByMe?: boolean;
};

type Message = {
  id: string;
  communityId: string;
  author: { name: string; avatarUrl: string | null; role: string };
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
};

type ReportReason = 'SEXUAL_CONTENT' | 'HARASSMENT' | 'BULLYING' | 'HATE_DISCRIMINATION' | 'THREAT' | 'VIOLENCE' | 'SPAM' | 'SCAM' | 'PRIVACY_VIOLATION' | 'IMPERSONATION' | 'ACADEMIC_CHEATING' | 'INAPPROPRIATE_FILE' | 'OTHER';

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

const FIVE_MB = 5 * 1024 * 1024;
const TEN_MB = 10 * 1024 * 1024;
const ACCEPTED_FILES = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,audio/webm,audio/ogg,audio/mpeg,audio/mp4,audio/wav,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv';

function relativeTime(value: string | null) {
  if (!value) return '';
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return '';
  const minutes = Math.max(0, Math.round((Date.now() - time) / 60_000));
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function messageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }).format(date);
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'CO';
}

function formatRole(role: string) {
  return role.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isCommunityResponse(value: unknown): value is { communities: Community[] } {
  return Boolean(value && typeof value === 'object' && Array.isArray((value as { communities?: unknown }).communities));
}

function isMessagesResponse(value: unknown): value is { messages: Message[]; hasMore: boolean } {
  return Boolean(value && typeof value === 'object' && Array.isArray((value as { messages?: unknown }).messages));
}

export function AcademicCommunityChat() {
  const [communities, setCommunities] = React.useState<Community[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [communityQuery, setCommunityQuery] = React.useState('');
  const [body, setBody] = React.useState('');
  const [files, setFiles] = React.useState<File[]>([]);
  const [replyTo, setReplyTo] = React.useState<Message | null>(null);
  const [threadFor, setThreadFor] = React.useState<Message | null>(null);
  const [threadReplies, setThreadReplies] = React.useState<Message[]>([]);
  const [reportMessage, setReportMessage] = React.useState<Message | null>(null);
  const [reportReason, setReportReason] = React.useState<ReportReason>('HARASSMENT');
  const [reportDescription, setReportDescription] = React.useState('');
  const [loadingCommunities, setLoadingCommunities] = React.useState(true);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showCommunitiesMobile, setShowCommunitiesMobile] = React.useState(true);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recordingChunksRef = React.useRef<Blob[]>([]);
  const messageEndRef = React.useRef<HTMLDivElement>(null);

  const selectedCommunity = React.useMemo(() => communities.find((item) => item.id === selectedId) ?? null, [communities, selectedId]);
  const filteredCommunities = React.useMemo(() => {
    const query = communityQuery.trim().toLowerCase();
    return query ? communities.filter((item) => `${item.name} ${item.description ?? ''} ${item.type}`.toLowerCase().includes(query)) : communities;
  }, [communities, communityQuery]);

  const loadCommunities = React.useCallback(async () => {
    setLoadingCommunities(true);
    setError(null);
    try {
      const response = await fetch('/api/community/chat/communities', { cache: 'no-store' });
      const payload: unknown = await response.json();
      if (!response.ok || !isCommunityResponse(payload)) throw new Error(readApiError(payload, 'Unable to load your academic communities.'));
      setCommunities(payload.communities);
      setSelectedId((current) => current && payload.communities.some((item) => item.id === current) ? current : payload.communities[0]?.id ?? null);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to load your academic communities.');
    } finally {
      setLoadingCommunities(false);
    }
  }, []);

  const loadMessages = React.useCallback(async (communityId: string, quiet = false) => {
    if (!quiet) setLoadingMessages(true);
    try {
      const response = await fetch(`/api/community/chat/communities/${communityId}/messages?limit=60`, { cache: 'no-store' });
      const payload: unknown = await response.json();
      if (!response.ok || !isMessagesResponse(payload)) throw new Error(readApiError(payload, 'Unable to load messages.'));
      setMessages(payload.messages);
      window.setTimeout(() => messageEndRef.current?.scrollIntoView({ block: 'end' }), 20);
    } catch (cause: unknown) {
      if (!quiet) setError(cause instanceof Error ? cause.message : 'Unable to load messages.');
    } finally {
      if (!quiet) setLoadingMessages(false);
    }
  }, []);

  React.useEffect(() => { void loadCommunities(); }, [loadCommunities]);
  React.useEffect(() => { if (selectedId) void loadMessages(selectedId); else setMessages([]); }, [selectedId, loadMessages]);

  React.useEffect(() => {
    if (!selectedId) return;
    const after = messages[messages.length - 1]?.createdAt ?? new Date(Date.now() - 30_000).toISOString();
    const events = new EventSource(`/api/community/chat/communities/${selectedId}/events?after=${encodeURIComponent(after)}`);
    const refresh = () => void loadMessages(selectedId, true);
    events.addEventListener('messages', refresh);
    events.onerror = () => events.close();
    return () => events.close();
  }, [selectedId, loadMessages, messages.length]);

  const chooseCommunity = (id: string) => {
    setSelectedId(id);
    setReplyTo(null);
    setThreadFor(null);
    setShowCommunitiesMobile(false);
  };

  const addFiles = (incoming: FileList | File[]) => {
    const next = [...files];
    for (const file of Array.from(incoming)) {
      if (next.length >= 5) break;
      const limit = file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/') ? FIVE_MB : TEN_MB;
      if (file.size > limit) {
        setError(`${file.name} is too large. Images, short videos and voice notes are limited to 5 MB; documents to 10 MB.`);
        continue;
      }
      next.push(file);
    }
    setFiles(next);
  };

  const sendMessage = async () => {
    if (!selectedId || sending || (!body.trim() && files.length === 0)) return;
    setSending(true);
    setError(null);
    try {
      const form = new FormData();
      form.set('body', body.trim());
      if (replyTo) form.set('replyToId', replyTo.id);
      files.forEach((file) => form.append('files', file));
      const response = await fetch(`/api/community/chat/communities/${selectedId}/messages`, { method: 'POST', body: form });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(readApiError(payload, 'Message could not be sent.'));
      setBody('');
      setFiles([]);
      setReplyTo(null);
      await loadMessages(selectedId, true);
      await loadCommunities();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const toggleReaction = async (messageId: string, reactionType: 'LIKE' | 'HELPFUL') => {
    if (!selectedId) return;
    const response = await fetch(`/api/community/chat/messages/${messageId}/reactions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reactionType }),
    });
    if (response.ok) await loadMessages(selectedId, true);
  };

  const openThread = async (message: Message) => {
    setThreadFor(message);
    setThreadReplies([]);
    const response = await fetch(`/api/community/chat/messages/${message.id}/thread`, { cache: 'no-store' });
    const payload: unknown = await response.json();
    if (response.ok && Array.isArray(payload)) setThreadReplies(payload as Message[]);
  };

  const submitReport = async () => {
    if (!reportMessage) return;
    const response = await fetch(`/api/community/chat/messages/${reportMessage.id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reportReason, description: reportDescription.trim() || undefined }),
    });
    const payload: unknown = await response.json();
    if (!response.ok) {
      setError(readApiError(payload, 'Report could not be submitted.'));
      return;
    }
    setReportMessage(null);
    setReportDescription('');
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
      recorder.ondataavailable = (event) => { if (event.data.size) recordingChunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm';
        const blob = new Blob(recordingChunksRef.current, { type });
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        if (blob.size > FIVE_MB) { setError('Voice notes are limited to 5 MB.'); return; }
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
    <section className="overflow-hidden rounded-[16px] border border-[#D8E2EF] bg-white shadow-[0_14px_42px_rgba(16,29,56,0.08)]" aria-label="Academic community chat">
      <div className="grid min-h-[calc(100dvh-190px)] lg:grid-cols-[280px_minmax(0,1fr)_300px]">
        <aside className={`${showCommunitiesMobile ? 'flex' : 'hidden'} min-h-0 flex-col border-r border-[#E1E7EF] bg-[#F8FAFD] lg:flex`}>
          <div className="border-b border-[#E1E7EF] p-4">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#667085]">CampusOS collaboration</p><h1 className="mt-1 text-lg font-extrabold tracking-[-0.025em] text-[#101D38]">Academic Communities</h1></div>
              <button type="button" onClick={() => void loadCommunities()} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D7E0EB] bg-white text-[#667085] hover:text-[#1754E8]" aria-label="Refresh communities"><RefreshCw className={`h-4 w-4 ${loadingCommunities ? 'animate-spin' : ''}`} /></button>
            </div>
            <label className="mt-4 flex h-10 items-center gap-2 rounded-[10px] border border-[#D7E0EB] bg-white px-3 focus-within:border-[#1754E8]">
              <Search className="h-4 w-4 text-[#7A8698]" aria-hidden="true" />
              <input value={communityQuery} onChange={(event) => setCommunityQuery(event.target.value)} placeholder="Search your communities" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#98A2B3]" />
            </label>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loadingCommunities ? <CommunitySkeleton /> : filteredCommunities.length ? filteredCommunities.map((community) => (
              <button key={community.id} type="button" onClick={() => chooseCommunity(community.id)} className={`mb-1 flex w-full items-start gap-3 rounded-[11px] border p-3 text-left transition ${selectedId === community.id ? 'border-[#BCD0F3] bg-[#EAF0FF]' : 'border-transparent hover:border-[#E1E7EF] hover:bg-white'}`}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${community.type === 'COURSE' ? 'bg-[#EAF0FF] text-[#1754E8]' : 'bg-[#EEF6F2] text-[#087A55]'}`}><CommunityIcon type={community.type} /></span>
                <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-[13px] font-extrabold text-[#26344D]">{community.name}</span><span className="shrink-0 text-[10px] font-bold text-[#98A2B3]">{relativeTime(community.lastActivityAt)}</span></span><span className="mt-1 block truncate text-[11px] text-[#667085]">{community.lastMessagePreview ?? community.description ?? 'No messages yet'}</span><span className="mt-2 flex items-center justify-between"><span className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#7A8698]">{community.type.replaceAll('_', ' ')}</span>{community.unreadCount > 0 && <span className="rounded-full bg-[#1754E8] px-2 py-0.5 text-[9px] font-black text-white">{community.unreadCount > 99 ? '99+' : community.unreadCount}</span>}</span></span>
              </button>
            )) : <div className="p-5 text-center"><UsersRound className="mx-auto h-8 w-8 text-[#98A2B3]" /><p className="mt-3 text-sm font-extrabold text-[#344054]">No authorised communities</p><p className="mt-1 text-xs leading-5 text-[#7A8698]">Branch and course communities appear automatically from your active academic records.</p></div>}
          </div>
          <div className="border-t border-[#E1E7EF] p-3 text-[10px] leading-4 text-[#7A8698]"><ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-[#087A55]" />Membership is verified from CampusOS enrolment and teaching assignments.</div>
        </aside>

        <main className={`${showCommunitiesMobile && !selectedCommunity ? 'hidden' : 'flex'} min-h-0 min-w-0 flex-col lg:flex`}>
          {selectedCommunity ? (
            <>
              <header className="flex min-h-[72px] items-center justify-between gap-3 border-b border-[#E1E7EF] px-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <button type="button" onClick={() => setShowCommunitiesMobile(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#D7E0EB] lg:hidden" aria-label="Show communities"><ArrowLeft className="h-4 w-4" /></button>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#EAF0FF] text-[#1754E8]"><CommunityIcon type={selectedCommunity.type} /></span>
                  <div className="min-w-0"><h2 className="truncate text-[15px] font-extrabold text-[#101D38]">{selectedCommunity.name}</h2><p className="mt-0.5 flex items-center gap-2 text-[11px] text-[#667085]"><span>{selectedCommunity.memberCount} members</span><span aria-hidden="true">•</span><span>{selectedCommunity.type.replaceAll('_', ' ')}</span></p></div>
                </div>
                <div className="flex items-center gap-2"><button type="button" onClick={() => void loadMessages(selectedCommunity.id)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D7E0EB] text-[#667085] hover:text-[#1754E8]" aria-label="Refresh messages"><RefreshCw className={`h-4 w-4 ${loadingMessages ? 'animate-spin' : ''}`} /></button><button type="button" onClick={() => setThreadFor(null)} className="hidden h-10 w-10 items-center justify-center rounded-lg border border-[#D7E0EB] text-[#667085] lg:flex" aria-label="Community details"><MoreHorizontal className="h-4 w-4" /></button></div>
              </header>

              {error && <div role="alert" className="mx-4 mt-3 flex items-start justify-between gap-3 rounded-[10px] border border-[#F2C6C2] bg-[#FFF7F6] px-3 py-2.5 text-xs font-semibold text-[#9F2D24]"><span>{error}</span><button type="button" onClick={() => setError(null)} aria-label="Dismiss error"><X className="h-4 w-4" /></button></div>}

              <div className="min-h-0 flex-1 overflow-y-auto bg-[#FBFCFE] px-3 py-4 sm:px-5" aria-live="polite">
                {loadingMessages ? <MessageSkeleton /> : messages.length ? <div className="mx-auto max-w-[880px] space-y-1">{messages.map((message) => <MessageRow key={message.id} message={message} onReply={() => setReplyTo(message)} onThread={() => void openThread(message)} onReact={(reaction) => void toggleReaction(message.id, reaction)} onReport={() => { setReportMessage(message); setReportReason('HARASSMENT'); }} />)}<div ref={messageEndRef} /></div> : <div className="flex h-full min-h-[340px] items-center justify-center"><div className="max-w-sm text-center"><MessageCircle className="mx-auto h-10 w-10 text-[#A6B0BE]" /><h3 className="mt-3 text-base font-extrabold text-[#26344D]">Start the academic conversation</h3><p className="mt-2 text-sm leading-6 text-[#667085]">Messages in this community are limited to authorised members from the same academic scope.</p></div></div>}
              </div>

              <footer className="border-t border-[#E1E7EF] bg-white p-3 sm:p-4">
                <div className="mx-auto max-w-[900px]">
                  {replyTo && <div className="mb-2 flex items-center justify-between gap-3 rounded-[9px] border border-[#D7E2F4] bg-[#F5F8FE] px-3 py-2"><div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#1754E8]">Replying to {replyTo.author.name}</p><p className="truncate text-xs text-[#667085]">{replyTo.body}</p></div><button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply"><X className="h-4 w-4 text-[#667085]" /></button></div>}
                  {files.length > 0 && <div className="mb-2 flex gap-2 overflow-x-auto pb-1">{files.map((file, index) => <div key={`${file.name}-${index}`} className="flex shrink-0 items-center gap-2 rounded-lg border border-[#D7E0EB] bg-[#F8FAFD] px-3 py-2"><AttachmentIcon mimeType={file.type} /><span className="max-w-[160px] truncate text-xs font-semibold text-[#475467]">{file.name}</span><button type="button" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} aria-label={`Remove ${file.name}`}><X className="h-3.5 w-3.5 text-[#667085]" /></button></div>)}</div>}
                  <div className="rounded-[12px] border border-[#CBD7E7] bg-white shadow-[0_3px_12px_rgba(16,24,40,0.04)] focus-within:border-[#9AB5E5]">
                    <textarea value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} rows={2} maxLength={5000} placeholder={`Message ${selectedCommunity.type === 'COURSE' ? 'this course' : 'this academic'} community…`} className="max-h-36 min-h-[64px] w-full resize-none bg-transparent px-4 pt-3 text-sm leading-6 text-[#26344D] outline-none placeholder:text-[#98A2B3]" />
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#EDF1F5] px-2.5 py-2">
                      <div className="flex items-center gap-1"><label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[#667085] hover:bg-[#F2F5F9] hover:text-[#1754E8]" title="Attach image, video, voice or document"><Paperclip className="h-4 w-4" /><input type="file" className="sr-only" multiple accept={ACCEPTED_FILES} onChange={(event) => { if (event.target.files) addFiles(event.target.files); event.currentTarget.value = ''; }} /></label><button type="button" onClick={() => void startVoiceRecording()} className={`flex h-9 w-9 items-center justify-center rounded-lg ${recording ? 'bg-[#FDE8E6] text-[#B42318]' : 'text-[#667085] hover:bg-[#F2F5F9] hover:text-[#1754E8]'}`} aria-label={recording ? 'Stop voice recording' : 'Record voice note'} title={recording ? 'Stop recording' : 'Record voice note'}><Mic className={`h-4 w-4 ${recording ? 'animate-pulse' : ''}`} /></button><span className="hidden text-[10px] font-semibold text-[#98A2B3] sm:inline">Images / video / voice ≤ 5 MB</span></div>
                      <button type="button" onClick={() => void sendMessage()} disabled={sending || (!body.trim() && files.length === 0)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[9px] bg-[#1754E8] px-4 text-xs font-extrabold text-white transition hover:bg-[#1348C6] disabled:cursor-not-allowed disabled:bg-[#AEBBD0]"><Send className="h-4 w-4" />{sending ? 'Sending…' : 'Send'}</button>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] leading-4 text-[#8A95A6]">CampusOS checks membership, file type, link safety, rate limits and message policy before publishing.</p>
                </div>
              </footer>
            </>
          ) : <div className="flex h-full items-center justify-center p-8 text-center"><div><UsersRound className="mx-auto h-10 w-10 text-[#98A2B3]" /><h2 className="mt-3 text-lg font-extrabold text-[#26344D]">Choose an academic community</h2><p className="mt-2 text-sm text-[#667085]">Only communities authorised by your enrolment or teaching assignment are available.</p></div></div>}
        </main>

        <aside className="hidden min-h-0 overflow-y-auto border-l border-[#E1E7EF] bg-white lg:block">
          {threadFor ? <ThreadPanel message={threadFor} replies={threadReplies} onClose={() => setThreadFor(null)} onReply={(message) => { setReplyTo(message); setThreadFor(null); }} /> : <CommunityDetails community={selectedCommunity} />}
        </aside>
      </div>

      {reportMessage && <ReportDialog message={reportMessage} reason={reportReason} description={reportDescription} setReason={setReportReason} setDescription={setReportDescription} onClose={() => setReportMessage(null)} onSubmit={() => void submitReport()} />}
    </section>
  );
}

function MessageRow({ message, onReply, onThread, onReact, onReport }: { message: Message; onReply: () => void; onThread: () => void; onReact: (type: 'LIKE' | 'HELPFUL') => void; onReport: () => void }) {
  return <article className="group rounded-[10px] border border-transparent px-2 py-3 transition hover:border-[#E4EAF2] hover:bg-white sm:px-3"><div className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#EAF0FF] text-xs font-extrabold text-[#1754E8]">{message.author.avatarUrl ? <img src={message.author.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials(message.author.name)}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline gap-x-2 gap-y-1"><span className="text-[13px] font-extrabold text-[#26344D]">{message.author.name}</span><span className={`rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.07em] ${message.author.role === 'FACULTY' ? 'bg-[#EAF0FF] text-[#1754E8]' : 'bg-[#F0F3F7] text-[#667085]'}`}>{formatRole(message.author.role)}</span><time className="text-[10px] font-semibold text-[#98A2B3]">{messageTime(message.createdAt)}</time>{message.isEdited && <span className="text-[9px] text-[#98A2B3]">edited</span>}</div>{message.replyTo && <div className="mt-2 rounded-r-lg border-l-2 border-[#7EA4EC] bg-[#F5F8FE] px-3 py-2"><p className="text-[10px] font-bold text-[#1754E8]">{message.replyTo.authorName}</p><p className="truncate text-[11px] text-[#667085]">{message.replyTo.bodyPreview}</p></div>}<div className="mt-1.5 whitespace-pre-wrap break-words text-[13px] leading-6 text-[#344054]"><SafeText text={message.sanitizedBody ?? message.body} /></div>{message.attachments.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2">{message.attachments.map((attachment) => <AttachmentView key={attachment.id} attachment={attachment} />)}</div>}<div className="mt-2 flex flex-wrap items-center gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100"><ActionButton label="Reply" icon={Reply} onClick={onReply} /><ActionButton label={reactionLabel(message.reactions, 'LIKE', 'Like')} icon={ThumbsUp} onClick={() => onReact('LIKE')} /><ActionButton label={reactionLabel(message.reactions, 'HELPFUL', 'Helpful')} icon={CheckCircle2} onClick={() => onReact('HELPFUL')} />{message.replyCount > 0 && <ActionButton label={`${message.replyCount} repl${message.replyCount === 1 ? 'y' : 'ies'}`} icon={MessageCircle} onClick={onThread} />}<ActionButton label="Report" icon={Flag} onClick={onReport} /></div></div></div></article>;
}

function AttachmentView({ attachment }: { attachment: Attachment }) {
  if (attachment.mimeType.startsWith('image/')) return <a href={attachment.fileUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-[10px] border border-[#DDE4ED] bg-[#F6F8FB]"><img src={attachment.fileUrl} alt={attachment.altText ?? attachment.fileName} loading="lazy" className="max-h-72 w-full object-contain" /></a>;
  if (attachment.mimeType.startsWith('video/')) return <div className="overflow-hidden rounded-[10px] border border-[#DDE4ED] bg-black"><video src={attachment.fileUrl} controls preload="metadata" className="max-h-72 w-full" /></div>;
  if (attachment.mimeType.startsWith('audio/')) return <div className="rounded-[10px] border border-[#DDE4ED] bg-[#F8FAFD] p-3"><p className="mb-2 text-[10px] font-bold text-[#667085]">Voice note</p><audio src={attachment.fileUrl} controls preload="metadata" className="w-full" /></div>;
  return <a href={attachment.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-[10px] border border-[#DDE4ED] bg-[#F8FAFD] p-3 transition hover:border-[#AFC0D6]"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#1754E8]"><FileText className="h-4 w-4" /></span><span className="min-w-0"><span className="block truncate text-xs font-extrabold text-[#344054]">{attachment.fileName}</span><span className="mt-0.5 block text-[10px] text-[#7A8698]">{Math.max(1, Math.round(attachment.fileSizeBytes / 1024))} KB</span></span></a>;
}

function SafeText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return <>{parts.map((part, index) => /^https?:\/\//.test(part) ? <a key={`${part}-${index}`} href={part} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1754E8] underline decoration-[#B9CDED] underline-offset-2">{part}</a> : <React.Fragment key={`${index}-${part.slice(0, 8)}`}>{part}</React.Fragment>)}</>;
}

function CommunityDetails({ community }: { community: Community | null }) {
  if (!community) return <div className="p-5 text-sm text-[#667085]">Select a community to view its details.</div>;
  return <div className="p-5"><div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#EAF0FF] text-[#1754E8]"><CommunityIcon type={community.type} /></div><h2 className="mt-4 text-base font-extrabold text-[#101D38]">{community.name}</h2><p className="mt-2 text-xs leading-5 text-[#667085]">{community.description ?? 'Restricted academic community.'}</p><div className="mt-5 grid grid-cols-2 gap-2"><InfoStat label="Members" value={community.memberCount} /><InfoStat label="Type" value={community.type.replaceAll('_', ' ')} /></div><section className="mt-5 border-t border-[#E6EBF2] pt-5"><h3 className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#667085]">Community rules</h3><ul className="mt-3 space-y-2 text-xs leading-5 text-[#536175]"><li>• Be respectful and stay academically relevant.</li><li>• No abusive, sexual, hateful or threatening content.</li><li>• Do not expose private information or unsafe links.</li><li>• Do not sell assignments or leaked exam material.</li></ul></section><section className="mt-5 rounded-[10px] border border-[#CFE2D9] bg-[#F4FAF7] p-3"><p className="flex items-center gap-2 text-xs font-extrabold text-[#087A55]"><ShieldCheck className="h-4 w-4" />Restricted membership</p><p className="mt-1 text-[10px] leading-4 text-[#667085]">Access is resolved from CampusOS academic records. Changing a URL cannot grant membership.</p></section><div className="mt-5 text-[10px] leading-4 text-[#7A8698]">Media policy: images, short video and voice notes up to 5 MB. Documents up to 10 MB.</div></div>;
}

function ThreadPanel({ message, replies, onClose, onReply }: { message: Message; replies: Message[]; onClose: () => void; onReply: (message: Message) => void }) {
  return <div className="flex h-full flex-col"><div className="flex items-center justify-between border-b border-[#E1E7EF] px-4 py-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#667085]">Conversation thread</p><h2 className="mt-1 text-sm font-extrabold text-[#101D38]">{replies.length} replies</h2></div><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#F2F5F9]" aria-label="Close thread"><X className="h-4 w-4" /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-3"><div className="rounded-[10px] border border-[#D7E2F4] bg-[#F5F8FE] p-3"><p className="text-xs font-extrabold text-[#26344D]">{message.author.name}</p><p className="mt-1 text-xs leading-5 text-[#536175]">{message.body}</p></div><div className="mt-3 space-y-2">{replies.map((reply) => <div key={reply.id} className="rounded-[10px] border border-[#E1E7EF] p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-extrabold text-[#344054]">{reply.author.name}</span><span className="text-[9px] text-[#98A2B3]">{messageTime(reply.createdAt)}</span></div><p className="mt-1 text-xs leading-5 text-[#536175]">{reply.body}</p></div>)}</div></div><div className="border-t border-[#E1E7EF] p-3"><button type="button" onClick={() => onReply(message)} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#1754E8] px-3 text-xs font-extrabold text-white"><Reply className="h-4 w-4" />Reply in thread</button></div></div>;
}

function ReportDialog({ message, reason, description, setReason, setDescription, onClose, onSubmit }: { message: Message; reason: ReportReason; description: string; setReason: (value: ReportReason) => void; setDescription: (value: string) => void; onClose: () => void; onSubmit: () => void }) {
  return <div className="fixed inset-0 z-[160] flex items-center justify-center bg-[#0B1425]/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div role="dialog" aria-modal="true" aria-labelledby="report-chat-title" className="w-full max-w-md rounded-[14px] border border-[#D9E2ED] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.3)]"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#B42318]">Community safety</p><h2 id="report-chat-title" className="mt-1 text-lg font-extrabold text-[#101D38]">Report message</h2></div><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#F2F5F9]" aria-label="Close report"><X className="h-4 w-4" /></button></div><p className="mt-3 rounded-lg bg-[#F7F9FC] p-3 text-xs leading-5 text-[#667085]">Report content from <strong>{message.author.name}</strong>. Reports are sent to authorised university moderators and are not shown publicly.</p><label className="mt-4 block text-xs font-extrabold text-[#344054]">Reason<select value={reason} onChange={(event) => setReason(event.target.value as ReportReason)} className="mt-2 h-11 w-full rounded-lg border border-[#CDD7E4] bg-white px-3 text-sm font-semibold outline-none focus:border-[#1754E8]">{REPORT_REASONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="mt-4 block text-xs font-extrabold text-[#344054]">Additional context <span className="font-normal text-[#98A2B3]">(optional)</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} rows={3} className="mt-2 w-full resize-none rounded-lg border border-[#CDD7E4] p-3 text-sm font-normal outline-none focus:border-[#1754E8]" /></label><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="min-h-10 rounded-lg border border-[#CDD7E4] px-4 text-xs font-extrabold text-[#475467]">Cancel</button><button type="button" onClick={onSubmit} className="min-h-10 rounded-lg bg-[#B42318] px-4 text-xs font-extrabold text-white">Submit report</button></div></div></div>;
}

function ActionButton({ label, icon: Icon, onClick }: { label: string; icon: React.ComponentType<{ className?: string }>; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-[10px] font-bold text-[#667085] hover:bg-[#F2F5F9] hover:text-[#1754E8]"><Icon className="h-3.5 w-3.5" />{label}</button>;
}

function reactionLabel(reactions: Reaction[], type: string, fallback: string) {
  const reaction = reactions.find((item) => item.reactionType === type);
  return reaction?.count ? `${fallback} ${reaction.count}` : fallback;
}

function InfoStat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-[9px] border border-[#E1E7EF] bg-[#F8FAFD] p-3"><p className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#7A8698]">{label}</p><p className="mt-1 truncate text-sm font-extrabold text-[#26344D]">{value}</p></div>;
}

function CommunityIcon({ type }: { type: string }) {
  return type === 'COURSE' ? <BookOpen className="h-4 w-4" /> : type === 'SECTION' || type === 'BATCH' ? <UsersRound className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />;
}

function AttachmentIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-[#1754E8]" />;
  if (mimeType.startsWith('video/')) return <Video className="h-4 w-4 text-[#1754E8]" />;
  if (mimeType.startsWith('audio/')) return <Mic className="h-4 w-4 text-[#1754E8]" />;
  return <FileText className="h-4 w-4 text-[#1754E8]" />;
}

function CommunitySkeleton() {
  return <div className="space-y-2 p-2">{[1, 2, 3, 4, 5].map((item) => <div key={item} className="flex animate-pulse gap-3 rounded-[10px] p-3"><div className="h-10 w-10 rounded-[10px] bg-[#E8EDF4]" /><div className="flex-1"><div className="h-3 w-2/3 rounded bg-[#E8EDF4]" /><div className="mt-2 h-2.5 w-5/6 rounded bg-[#F0F3F7]" /></div></div>)}</div>;
}

function MessageSkeleton() {
  return <div className="mx-auto max-w-[880px] space-y-4">{[1, 2, 3, 4].map((item) => <div key={item} className="flex animate-pulse gap-3"><div className="h-9 w-9 rounded-[10px] bg-[#E8EDF4]" /><div className="flex-1"><div className="h-3 w-36 rounded bg-[#E8EDF4]" /><div className="mt-2 h-3 w-4/5 rounded bg-[#F0F3F7]" /><div className="mt-2 h-3 w-2/3 rounded bg-[#F0F3F7]" /></div></div>)}</div>;
}

function readApiError(value: unknown, fallback: string) {
  if (value && typeof value === 'object' && 'error' in value && typeof (value as { error?: unknown }).error === 'string') return (value as { error: string }).error;
  return fallback;
}
