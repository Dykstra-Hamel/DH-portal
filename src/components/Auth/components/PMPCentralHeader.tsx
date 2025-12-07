import Image from 'next/image';
import styles from '../Auth.module.scss';

export function PMPCentralHeader() {
  return (
    <div className={styles.pmpCentralHeader}>
      <Image
        src="/pmpcentral-logo.svg"
        alt="PMPCentral logo"
        width={180}
        height={60}
        priority
      />
    </div>
  );
}