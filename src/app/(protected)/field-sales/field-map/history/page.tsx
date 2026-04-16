import styles from './history.module.scss';

export default function FieldSalesFieldMapHistoryPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>History</h1>
        <p className={styles.subtitle}>Past service stops</p>
      </div>
      <div className={styles.emptyState}>
        <p>Completed stops will appear here.</p>
      </div>
    </div>
  );
}
