'use client';

import { useSearchParams, useParams } from 'next/navigation';
import { Suspense } from 'react';
import BrandedAuth from '@/components/Auth/BrandedAuth';

function BrandedLoginContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const authError = searchParams.get('error');
  const slug = params.slug as string;

  return (
    <>
      {authError && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '0.375rem',
            color: '#991b1b',
            marginBottom: '1rem',
            maxWidth: '400px',
            textAlign: 'center',
          }}
        >
          Authentication error: {decodeURIComponent(authError)}
        </div>
      )}

      <BrandedAuth slug={slug} />
    </>
  );
}

export default function BrandedLogin() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BrandedLoginContent />
    </Suspense>
  );
}
