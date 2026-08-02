'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, ThumbsUp, MessageCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';

export function DiscussionForumConsole() {
  const { currentSession } = useAuthStore();
  const [posts, setPosts] = useState([
    {
      id: 'post_1',
      author: 'MUSTKEEM AHMAD',
      email: 'mustkeem.129078@stu.upes.ac.in',
      title: 'Best strategy for Distributed Database Concurrency Control in Unit 4?',
      likes: 12,
      replies: 4,
      time: '2 hours ago',
    },
    {
      id: 'post_2',
      author: 'Alex Vance',
      email: 'alex@stu.upes.ac.in',
      title: 'CampusOS Hackathon 2026 Team Formation — Looking for Full Stack Devs!',
      likes: 8,
      replies: 7,
      time: '5 hours ago',
    },
  ]);

  const [newTitle, setNewTitle] = useState('');

  const handlePost = () => {
    if (!newTitle.trim()) return;
    setPosts([
      {
        id: `post_${Date.now()}`,
        author: currentSession.name,
        email: currentSession.email,
        title: newTitle,
        likes: 0,
        replies: 0,
        time: 'Just now',
      },
      ...posts,
    ]);
    setNewTitle('');
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare size={20} className="text-indigo-500" />
            <span>Campus Discussion Forum & Peer Study Network</span>
          </h2>
          <p className="text-xs text-gray-500">
            Ask technical questions, share study notes, and collaborate with peers across UPES University
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Start a new discussion thread..."
          className="flex-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border text-xs font-bold"
        />
        <button
          onClick={handlePost}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow transition flex items-center gap-1.5"
        >
          <Send size={14} />
          <span>Post Thread</span>
        </button>
      </div>

      <div className="space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{p.author} ({p.email})</span>
              <span className="text-gray-400 font-mono text-[10px]">{p.time}</span>
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{p.title}</h4>
            <div className="flex items-center gap-4 text-gray-400 font-mono text-[11px] pt-1">
              <span className="flex items-center gap-1 hover:text-emerald-500 cursor-pointer">
                <ThumbsUp size={14} /> {p.likes} Likes
              </span>
              <span className="flex items-center gap-1 hover:text-indigo-500 cursor-pointer">
                <MessageCircle size={14} /> {p.replies} Replies
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
