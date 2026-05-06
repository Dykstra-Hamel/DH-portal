import Image from 'next/image';
import styles from './InspectorCard.module.scss';

interface InspectorCardProps {
  name: string;
  title?: string | null;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  address?: string;
  companyPhone?: string | null;
}

export function InspectorCard({
  name,
  title,
  phone,
  email,
  avatarUrl,
  address,
  companyPhone,
}: InspectorCardProps) {
  return (
    <div className={styles.inspectorCard}>
      <div className={styles.inspectorInfo}>
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            width={57}
            height={57}
            className={styles.inspectorAvatar}
          />
        ) : (
          <div className={styles.inspectorAvatarFallback}>{name.charAt(0)}</div>
        )}
        <div className={styles.inspectorText}>
          <p className={styles.inspectorName}>{name}</p>
          <p className={styles.inspectorTitle}>
            {title || 'Lead Sales Inspector'}
          </p>
          {(phone || companyPhone) && (
            <p className={styles.inspectorPhone}>{phone || companyPhone}</p>
          )}
          {email && <p className={styles.inspectorEmail}>{email}</p>}
        </div>
      </div>
      {address && (
        <>
          <div className={styles.inspectorSeparator} />
          <div className={styles.inspectorAddress}>
            <p className={styles.inspectorAddressLabel}>Inspection Address:</p>
            <div className={styles.inspectorAddressSeparator} />
            <p className={styles.inspectorAddressValue}>
              {(() => {
                const comma = address.indexOf(',');
                if (comma === -1) return address;
                return (
                  <>
                    {address.slice(0, comma)}
                    <br />
                    {address.slice(comma + 1).trim()}
                  </>
                );
              })()}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
