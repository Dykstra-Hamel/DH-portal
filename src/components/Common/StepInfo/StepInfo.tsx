import { formatDateForDisplay } from '@/lib/utils';
import styles from './StepInfo.module.scss';

interface StepInfoProps {
  customerName: string;
  createdAt: string;
  updatedAt: string;
  onButton1Click?: () => void;
  onButton2Click?: () => void;
  onButton3Click?: () => void;
}

export function StepInfo({
  customerName,
  createdAt,
  updatedAt,
  onButton1Click,
  onButton2Click,
  onButton3Click
}: StepInfoProps) {
  return (
    <div className={styles.pageHeader}>
      <h1 className={styles.customerName}>
        {customerName}
      </h1>
      <div className={styles.timestamps}>
        <span className={styles.timestamp}>
          Created: {formatDateForDisplay(createdAt)}
        </span>
        <span className={styles.timestamp}>
          Last Update: {formatDateForDisplay(updatedAt)}
        </span>
      </div>
      <div className={styles.actionButtons}>
        <button className={styles.actionButton} onClick={onButton1Click}>
          Button 1
        </button>
        <button className={styles.actionButton} onClick={onButton2Click}>
          Button 2
        </button>
        <button className={styles.actionButton} onClick={onButton3Click}>
          Button 3
        </button>
      </div>
    </div>
  );
}