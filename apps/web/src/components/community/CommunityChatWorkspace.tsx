'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, ChevronLeft, Loader2, MessageCircle, Search, Send, ShieldAlert, Smile, Users } from 'lucide-react';

type Community = {
  id: string; name: string; description: string | null; type: string; memberCount: number;
  unreadCount: number; lastMessagePreview: string | null; lastActivityAt: string | null;
  isPinned: boolean; isMuted: boolean; isArchived: boolean;
};
type ChatMessage = {
  id: string; communityId: string; body: string; messageType: string; moderationStatus: string;
  author: { id: string; name: string; avatarUrl: string | null; role: string };
  reactions: { reactionType: string; count: number; userIds: string[] }[];
  replyCount: number; isBookmarked: boolean; isPinned: boolean; isEdited: boolean; createdAt: string;
};
type ApiError = { error?: string };

const reactionLabels: Record<string, string> = { LIKE: 'Like', HELPFUL: 'Helpful', INSIGHTFUL: 'Insightful' };

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const data = await response.json().catch((): ApiError => ({}));
    throw new Error(data.error || 'The request could not be completed.');
  }
  return response.json() as Promise<T>;
}

function timeLabel(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

export function CommunityChatWorkspace({ initialCommunityId }: { initialCommunityId?: string }) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [communityId, setCommunityId] = useState<string | null>(initialCommunityId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [threadFor, setThreadFor] = useState<ChatMessage | null>(null);
  const [threadMessages, setThreadMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const loadMessages = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const payload = await requestJson<{ messages: ChatMessage[] }>(`/api/community/chat/communities/${id}/messages`);
      setMessages(payload.messages);
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : 'Unable to load messages.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    requestJson<Community[]>('/api/community/chat/communities')
      .then((items) => { setCommunities(items); if (!communityId && items[0]) setCommunityId(items[0].id); })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load communities.'));
  }, [communityId]);

  useEffect(() => { if (communityId) void loadMessages(communityId); }, [communityId, loadMessages]);

  const active = communities.find((item) => item.id === communityId) || null;
  const visibleCommunities = communities.filter((item) => `${item.name} ${item.description || ''}`.toLowerCase().includes(query.toLowerCase()));

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!communityId || !body.trim() || sending) return;
    setSending(true); setError(null);
    try {
      const created = await requestJson<ChatMessage>(`/api/community/chat/communities/${communityId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: body.trim() }) });
      setMessages((items) => [...items, created]); setBody('');
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : 'Message failed to send.'); }
    finally { setSending(false); }
  }

  async function action(message: ChatMessage, suffix: string, payload: Record<string, string> = {}) {
    try {
      await requestJson(`/api/community/chat/messages/${message.id}/${suffix}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (communityId) await loadMessages(communityId);
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : 'Action failed.'); }
  }

  async function openThread(message: ChatMessage) {
    setThreadFor(message); setThreadMessages([]);
    try { setThreadMessages(await requestJson<ChatMessage[]>(`/api/community/chat/messages/${message.id}/thread`)); }
    catch (cause: unknown) { setError(cause instanceof Error ? cause.message : 'Unable to load replies.'); }
  }

  async function sendReply(event: FormEvent) {
    event.preventDefault();
    if (!communityId || !threadFor || !replyBody.trim()) return;
    try {
      const reply = await requestJson<ChatMessage>(`/api/community/chat/communities/${communityId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: replyBody.trim(), replyToId: threadFor.id }) });
      setThreadMessages((items) => [...items, reply]); setReplyBody('');
      await loadMessages(communityId);
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : 'Reply failed to send.'); }
  }

  return <div className="h-[calc(100vh-4rem)] min-h-[620px] bg-slate-50 text-slate-900 lg:flex">
    <aside className="w-full border-r border-slate-200 bg-white lg:w-72 lg:shrink-0" aria-label="Communities">
      <div className="border-b border-slate-100 p-4"><h1 className="text-lg font-semibold">Communities</h1><label className="mt-3 flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Search communities" aria-label="Search communities" /></label></div>
      <nav className="max-h-[calc(100vh-12rem)] overflow-y-auto p-2">
        {visibleCommunities.map((item) => <button key={item.id} onClick={() => setCommunityId(item.id)} className={`mb-1 flex min-h-16 w-full items-center gap-3 rounded-xl px-3 text-left ${item.id === communityId ? 'bg-indigo-50 text-indigo-950' : 'hover:bg-slate-50'}`}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">{item.name.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{item.name}</span><span className="block truncate text-xs text-slate-500">{item.lastMessagePreview || item.description || item.type.replaceAll('_', ' ')}</span></span>{item.unreadCount > 0 && <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">{item.unreadCount}</span>}</button>)}
        {!loading && visibleCommunities.length === 0 && <p className="p-4 text-sm text-slate-500">No authorized communities found.</p>}
      </nav>
    </aside>
    <section className="flex min-w-0 flex-1 flex-col bg-white" aria-label="Conversation">
      {active ? <><header className="flex min-h-16 items-center justify-between border-b border-slate-200 px-4"><div><h2 className="font-semibold">{active.name}</h2><p className="text-xs text-slate-500">{active.type.replaceAll('_', ' ')} · {active.memberCount} members</p></div><div className="flex gap-2"><Link href={`/community/${active.id}/members`} className="rounded-lg p-2 hover:bg-slate-100" aria-label="View members"><Users size={18}/></Link><Link href={`/community/${active.id}/search`} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Search messages"><Search size={18}/></Link></div></header>
      <div className="flex-1 overflow-y-auto p-4" aria-live="polite">
        {loading ? <div className="grid h-full place-items-center"><Loader2 className="animate-spin text-indigo-600" aria-label="Loading messages" /></div> : messages.length === 0 ? <div className="grid h-full place-items-center text-center text-slate-500"><MessageCircle className="mx-auto mb-2"/><p>No messages yet. Start the course conversation.</p></div> : <div className="mx-auto max-w-3xl space-y-5">{messages.map((message) => <article key={message.id} className="group flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-bold">{message.author.name.slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><div className="flex items-baseline gap-2"><span className="text-sm font-semibold">{message.author.name}</span><span className="text-xs text-slate-500">{message.author.role.replace('_', ' ').toLowerCase()} · {timeLabel(message.createdAt)}{message.isEdited ? ' · edited' : ''}</span></div><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p><div className="mt-2 flex flex-wrap gap-1"><button onClick={() => void action(message, 'react', { reactionType: 'LIKE' })} className="rounded-md border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50">👍 {message.reactions.find((item) => item.reactionType === 'LIKE')?.count || ''}</button><button onClick={() => void openThread(message)} className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100">Reply{message.replyCount ? ` · ${message.replyCount}` : ''}</button><button onClick={() => void action(message, 'bookmark')} className="rounded-md p-1 text-slate-500 hover:bg-slate-100" aria-label="Bookmark message"><Bookmark size={15}/></button><button onClick={() => { if (window.confirm('Report this message for moderation?')) void action(message, 'report', { reason: 'OTHER' }); }} className="rounded-md p-1 text-slate-500 hover:bg-slate-100" aria-label="Report message"><ShieldAlert size={15}/></button></div></div></article>)}</div>}
      </div>
      {error && <div role="alert" className="mx-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <form onSubmit={send} className="border-t border-slate-200 p-3"><label className="sr-only" htmlFor="chat-body">Message this community</label><div className="flex items-end gap-2 rounded-xl border border-slate-300 bg-white p-2 focus-within:ring-2 focus-within:ring-indigo-500"><Smile className="mb-1 text-slate-400" size={20}/><textarea id="chat-body" value={body} onChange={(event) => setBody(event.target.value)} className="max-h-32 min-h-8 flex-1 resize-none bg-transparent text-sm outline-none" placeholder="Message this course community…" maxLength={5000}/><button type="submit" disabled={!body.trim() || sending} className="rounded-lg bg-indigo-600 p-2 text-white disabled:cursor-not-allowed disabled:opacity-50" aria-label="Send message">{sending ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>}</button></div></form></> : <div className="grid flex-1 place-items-center text-slate-500">Select an authorized community to begin.</div>}
    </section>
    {threadFor && <aside className="fixed inset-y-0 right-0 z-20 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl lg:static lg:shadow-none" aria-label="Thread">
      <header className="flex items-center gap-2 border-b p-4"><button onClick={() => setThreadFor(null)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close thread"><ChevronLeft size={18}/></button><div><h3 className="font-semibold">Thread</h3><p className="text-xs text-slate-500">Replies to {threadFor.author.name}</p></div></header><div className="flex-1 overflow-y-auto p-4"><p className="rounded-lg bg-slate-50 p-3 text-sm">{threadFor.body}</p><div className="mt-4 space-y-4">{threadMessages.map((reply) => <div key={reply.id}><p className="text-sm font-semibold">{reply.author.name}</p><p className="text-sm">{reply.body}</p></div>)}{threadMessages.length === 0 && <p className="text-sm text-slate-500">No replies yet.</p>}</div></div><form onSubmit={sendReply} className="border-t p-3"><label className="sr-only" htmlFor="thread-reply">Reply to thread</label><div className="flex gap-2"><input id="thread-reply" value={replyBody} onChange={(event) => setReplyBody(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Reply to thread…" maxLength={5000}/><button disabled={!replyBody.trim()} className="rounded-lg bg-indigo-600 p-2 text-white disabled:opacity-50" aria-label="Send reply"><Send size={18}/></button></div></form></aside>}
  </div>;
}
