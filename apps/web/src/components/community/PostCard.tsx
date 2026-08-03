'use client';

import React from 'react';
import { MessageSquare, Heart, Pin, Lock, MoreVertical } from 'lucide-react';

interface Author {
  id: string;
  email: string;
  role: string;
}

interface PostCount {
  replies: number;
  reactions: number;
}

export interface Post {
  id: string;
  type: string;
  title: string | null;
  content: string;
  visibility: string;
  isPinned: boolean;
  isLocked: boolean;
  commentsEnabled: boolean;
  createdAt: string;
  author: Author;
  _count: PostCount;
}

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
  currentUserId?: string;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onDelete, currentUserId }) => {
  const isAuthor = currentUserId === post.author.id;
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(new Date(post.createdAt));

  return (
    <article 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-4 hover:shadow-md transition-shadow"
      aria-labelledby={`post-title-${post.id}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold" aria-hidden="true">
            {post.author.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-900 flex items-center gap-2">
              {post.author.email.split('@')[0]}
              {post.type === 'ANNOUNCEMENT' && (
                <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                  Announcement
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <time dateTime={post.createdAt}>
                {formattedDate}
              </time>
              <span>•</span>
              <span className="capitalize">{post.visibility.toLowerCase()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {post.isPinned && (
            <Pin className="w-4 h-4 text-indigo-600" aria-label="Pinned post" />
          )}
          {post.isLocked && (
            <Lock className="w-4 h-4 text-gray-400" aria-label="Locked post" />
          )}
          {isAuthor && onDelete && (
            <button 
              onClick={() => onDelete(post.id)}
              className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"
              aria-label="Delete post"
            >
              <MoreVertical className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        {post.title && (
          <h2 id={`post-title-${post.id}`} className="text-xl font-bold text-gray-900 mb-2">
            {post.title}
          </h2>
        )}
        <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
      </div>

      <div className="flex items-center space-x-6 text-gray-500 border-t border-gray-100 pt-3 mt-4">
        <button 
          className="flex items-center space-x-1.5 hover:text-indigo-600 transition-colors"
          aria-label={`${post._count.reactions} likes`}
        >
          <Heart className="w-4 h-4" />
          <span className="text-sm font-medium">{post._count.reactions}</span>
        </button>
        <button 
          className="flex items-center space-x-1.5 hover:text-indigo-600 transition-colors"
          disabled={!post.commentsEnabled}
          aria-label={`${post._count.replies} comments`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm font-medium">{post._count.replies}</span>
        </button>
      </div>
    </article>
  );
};
