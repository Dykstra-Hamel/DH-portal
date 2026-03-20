import { Suspense } from 'react';
import RecordingPlayer from '@/components/Recording/RecordingPlayer/RecordingPlayer';

interface RecordingPageProps {
  searchParams: Promise<{ url?: string }>;
}

export default async function RecordingPage({ searchParams }: RecordingPageProps) {
  const { url } = await searchParams;

  return (
    <Suspense fallback={null}>
      <RecordingPlayer url={url} />
    </Suspense>
  );
}
