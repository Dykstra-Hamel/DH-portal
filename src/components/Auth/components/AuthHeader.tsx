import Image from 'next/image';
import styles from '../Auth.module.scss';

interface AuthHeaderProps {
  logoUrl?: string | null;
  companyName?: string;
  slogans?: {
    line1: string;
    line2: string;
    line3: string;
  };
}

export function AuthHeader({ logoUrl, companyName, slogans }: AuthHeaderProps) {
  return (
    <>
      {/* Company Logo or Name */}
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`${companyName} logo`}
          width={200}
          height={80}
          className={styles.companyLogo}
        />
      ) : companyName ? (
        <h1>{companyName}</h1>
      ) : (
        <h1>
          <img src="/pmpcentral-logo.svg" alt="pmpcentral logo" />
        </h1>
      )}

      {/* Company Slogans */}
      {slogans && (slogans.line1 || slogans.line2 || slogans.line3) && (
        <div className={styles.slogansContainer}>
          {slogans.line1 && (
            <p className={styles.sloganPrimary}>
              {slogans.line1}
            </p>
          )}
          {slogans.line2 && (
            <p className={styles.sloganSecondary}>{slogans.line2}</p>
          )}
          {slogans.line3 && (
            <p className={styles.sloganTertiary}>
              {slogans.line3}
            </p>
          )}
        </div>
      )}
    </>
  );
}