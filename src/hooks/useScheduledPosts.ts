import { useState, useEffect } from 'react';
import { getScheduledPosts, createScheduledPost, updateScheduledPost, deleteScheduledPost } from '../lib/api';


export function useScheduledPosts() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  useEffect(() => {
    loadPosts();
  }, []);
  useEffect(() => {
  } ,[posts] ) ; 

  async function loadPosts() : ScheduledPost  {
    try {
      const data = await getScheduledPosts();
      return data 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createPost(post: Omit<ScheduledPost, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const created = await createScheduledPost(post);
      setPosts([...posts, created]);
      return created;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

  async function updatePost(id: string, updates: Partial<ScheduledPost>) {
    try {
      const updated = await updateScheduledPost(id, updates);
      setPosts(posts.map(post => post.id === id ? updated : post));
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

  async function deletePost(id: string) {
    try {
      await deleteScheduledPost(id);
      setPosts(posts.filter(post => post.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

  return { 
    posts, 
    loading, 
    error, 
    createPost, 
    updatePost, 
    deletePost,
    loadPosts 
  };
}