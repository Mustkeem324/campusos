'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { PostCard, Post } from './PostCard';
import { PostComposer } from './PostComposer';
import { Loader2 } from 'lucide-react';

export const CommunityFeed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/community/posts');
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const res = await fetch(`/api/community/posts/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete post');
      setPosts(posts.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete post');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Community Hub</h1>
        <p className="text-gray-600">Connect, share, and engage with your campus community.</p>
      </div>

      <PostComposer onSuccess={fetchPosts} />

      <div aria-live="polite" className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" aria-label="Loading posts" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg" role="alert">
            {error}
            <button 
              onClick={fetchPosts}
              className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200 text-gray-500">
            No posts found. Be the first to start a conversation!
          </div>
        ) : (
          posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onDelete={handleDelete}
              // Ideally we'd get currentUserId from a context or session hook
              currentUserId={undefined} 
            />
          ))
        )}
      </div>
    </div>
  );
};
