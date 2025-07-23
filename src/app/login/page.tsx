'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';
import styles from '@/app/styles/page.module.scss';
import Auth from '@/components/Auth';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <>
      {error && (
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
          Authentication error: {decodeURIComponent(error)}
        </div>
      )}

      <Auth />
    </>
  );
}

export default function Login() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/icon-192x192.png"
          alt="DH Portal logo"
          width={150}
          height={150}
          priority
        />

        <Suspense fallback={<div>Loading...</div>}>
          <LoginContent />
        </Suspense>
      </main>
    </div>
  );
}
