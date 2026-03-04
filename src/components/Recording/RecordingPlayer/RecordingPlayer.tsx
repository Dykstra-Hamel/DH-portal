'use client';

import Image from 'next/image';
import styles from './RecordingPlayer.module.scss';

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

interface RecordingPlayerProps {
  url?: string;
}

export default function RecordingPlayer({ url }: RecordingPlayerProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <Image
          src="/images/email/footer-logo.png"
          alt="PMP Central"
          width={179}
          height={40}
          className={styles.logo}
        />
        {!url || !isAllowedUrl(url) ? (
          <p className={styles.error}>
            Recording not available or link has expired.
          </p>
        ) : (
          <audio
            className={styles.player}
            controls
            preload="metadata"
            src={url}
          >
            Your browser does not support the audio element.
          </audio>
        )}
      </div>
    </div>
  );
}
