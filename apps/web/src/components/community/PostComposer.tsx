'use client';

import React, { useState } from 'react';
import { Send, Image as ImageIcon, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface PostComposerProps {
  onSuccess: () => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({ onSuccess }) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('DISCUSSION');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          title: title.trim() || undefined,
          content: content.trim(),
          visibility: 'INSTITUTION'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      setContent('');
      setTitle('');
      setType('DISCUSSION');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
      <form onSubmit={handleSubmit} aria-label="Create a new post">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2" role="alert">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
        
        <div className="mb-3">
          <label htmlFor="post-type" className="sr-only">Post Type</label>
          <select
            id="post-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="block w-[200px] rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm mb-3 px-3 py-2 bg-gray-50 border"
          >
            <option value="DISCUSSION">Discussion</option>
            <option value="QUESTION">Question</option>
            <option value="ANNOUNCEMENT">Announcement</option>
            <option value="EVENT">Event</option>
          </select>

          <label htmlFor="post-title" className="sr-only">Title (Optional)</label>
          <input
            id="post-title"
            type="text"
            placeholder="Title (Optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm mb-3 px-3 py-2 bg-transparent border-b"
          />

          <label htmlFor="post-content" className="sr-only">What&apos;s on your mind?</label>
          <textarea
            id="post-content"
            rows={3}
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="block w-full rounded-md border-none focus:ring-0 resize-none px-3 py-2 placeholder-gray-400 sm:text-sm"
            required
            aria-required="true"
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <button type="button" className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors" aria-label="Add image">
              <ImageIcon className="w-5 h-5" />
            </button>
            <button type="button" className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors" aria-label="Add link">
              <LinkIcon className="w-5 h-5" />
            </button>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
            <Send className="ml-2 w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
};
