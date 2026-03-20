'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';
import { ContentPieceDetail } from '@/components/ContentPieceDetail/ContentPieceDetail';

interface ContentPieceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ContentPieceDetailPage({ params }: ContentPieceDetailPageProps) {
  const [user, setUser] = useState<User | null>(null);
  const [contentPiece, setContentPiece] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pieceId, setPieceId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    params.then(p => setPieceId(p.id));
  }, [params]);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      if (!pieceId) return;

      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        router.push('/login');
        return;
      }

      const adminStatus = isAuthorizedAdminSync(profileData);
      setIsAdmin(adminStatus);

      if (!adminStatus) {
        router.push('/dashboard');
        return;
      }

      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (currentSession?.access_token) {
          headers['Authorization'] = `Bearer ${currentSession.access_token}`;
        }

        const response = await fetch(`/api/admin/content-pieces/${pieceId}`, { headers });

        if (!response.ok) {
          setError(response.status === 404 ? 'Content piece not found' : 'Failed to load content piece');
          setLoading(false);
          return;
        }

        const data = await response.json();
        setContentPiece(data.contentPiece);
        setError(null);
      } catch (err) {
        console.error('[ContentPieceDetail] Error fetching content piece:', err);
        setError('Failed to load content piece');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetch();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [pieceId, router, supabase]);

  const handlePieceUpdate = (updated: any) => {
    setContentPiece(updated);
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading content piece...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => router.push('/admin/content-calendar')}>
          Back to Content Calendar
        </button>
      </div>
    );
  }

  if (!user || !isAdmin || !contentPiece) {
    return <div style={{ padding: '2rem' }}>Redirecting...</div>;
  }

  return (
    <ContentPieceDetail
      contentPiece={contentPiece}
      user={user}
      onPieceUpdate={handlePieceUpdate}
    />
  );
}
