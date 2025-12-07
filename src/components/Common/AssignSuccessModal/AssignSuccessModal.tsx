import Image from 'next/image';
import { Users } from 'lucide-react';
import styles from './AssignSuccessModal.module.scss';

interface AssignSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReturnToPage: () => void;
  assigneeName: string;
  assigneeTitle: string;
  assigneeAvatar?: string | null;
}

export function AssignSuccessModal({
  isOpen,
  onClose,
  onReturnToPage,
  assigneeName,
  assigneeTitle,
  assigneeAvatar,
}: AssignSuccessModalProps) {
  if (!isOpen) return null;

  const isTeam = assigneeName.includes('Team');

  const DefaultAvatar = ({ name }: { name: string }) => (
    <div className={styles.defaultAvatar}>
      {name.charAt(0).toUpperCase()}
    </div>
  );

  const TeamAvatar = () => (
    <div className={styles.teamAvatar}>
      <Users size={32} color="white" />
    </div>
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Ticket assigned successfully</h2>

        <div className={styles.assigneeInfo}>
          <div className={styles.avatarContainer}>
            {isTeam ? (
              <TeamAvatar />
            ) : assigneeAvatar ? (
              <Image
                src={assigneeAvatar}
                alt={assigneeName}
                width={64}
                height={64}
                className={styles.avatar}
              />
            ) : (
              <DefaultAvatar name={assigneeName} />
            )}
          </div>
          <div className={styles.assigneeDetails}>
            <div className={styles.assigneeName}>{assigneeName}</div>
            <div className={styles.assigneeTitle}>{assigneeTitle}</div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.undoButton} onClick={onClose}>
            Undo
          </button>
          <button className={styles.returnButton} onClick={onReturnToPage}>
            Return to Leads
          </button>
        </div>
      </div>
    </div>
  );
}
