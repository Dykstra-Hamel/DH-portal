import React from 'react'
import { Trash2, Plus, CheckCircle } from 'lucide-react'
import styles from './Modal.module.scss'

// Custom back arrow SVG
const BackArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
    <path d="M15.0192 18.4646C15.206 18.6514 15.311 18.9048 15.311 19.169C15.311 19.4331 15.206 19.6865 15.0192 19.8733C14.8324 20.0601 14.5791 20.165 14.3149 20.165C14.0508 20.165 13.7974 20.0601 13.6106 19.8733L6.98167 13.2444C6.88897 13.152 6.81542 13.0422 6.76523 12.9214C6.71504 12.8005 6.68921 12.6709 6.68921 12.54C6.68921 12.4092 6.71504 12.2796 6.76523 12.1587C6.81542 12.0379 6.88897 11.9281 6.98167 11.8357L13.6106 5.20678C13.7974 5.01998 14.0508 4.91504 14.3149 4.91504C14.5791 4.91504 14.8324 5.01998 15.0192 5.20678C15.206 5.39358 15.311 5.64693 15.311 5.9111C15.311 6.17528 15.206 6.42863 15.0192 6.61543L9.09547 12.5392L15.0192 18.4646Z" fill="currentColor"/>
  </svg>
)

export interface ModalActionButtonsProps {
  // Navigation
  onBack?: () => void
  showBackButton?: boolean
  isFirstStep?: boolean

  // Actions
  onJunk?: () => void
  onAddTask?: () => void
  onPrimaryAction?: () => void

  // Primary button configuration
  primaryButtonText?: string
  primaryButtonIcon?: React.ReactNode
  primaryButtonDisabled?: boolean

  // Loading states
  isLoading?: boolean
  loadingText?: string

  // Disabled states
  addTaskDisabled?: boolean
  junkDisabled?: boolean
}

export default function ModalActionButtons({
  onBack,
  showBackButton = true,
  isFirstStep = false,
  onJunk,
  onAddTask,
  onPrimaryAction,
  primaryButtonText = 'Continue',
  primaryButtonIcon,
  primaryButtonDisabled = false,
  isLoading = false,
  loadingText = 'Processing...',
  addTaskDisabled = true,
  junkDisabled = false,
}: ModalActionButtonsProps) {
  const handleBackClick = () => {
    if (onBack) {
      onBack()
    }
  }

  const handleJunkClick = () => {
    if (onJunk && !junkDisabled) {
      onJunk()
    }
  }

  const handleAddTaskClick = () => {
    if (onAddTask && !addTaskDisabled) {
      onAddTask()
    }
  }

  const handlePrimaryActionClick = () => {
    if (onPrimaryAction && !primaryButtonDisabled && !isLoading) {
      onPrimaryAction()
    }
  }

  return (
    <div className={styles.buttonGroup}>
      {/* Left side - Back button */}
      <div className={styles.leftButtons}>
        {showBackButton && (
          <button
            onClick={handleBackClick}
            className={styles.secondaryButton}
            disabled={isLoading}
          >
            <BackArrowIcon />
            {isFirstStep ? 'Cancel' : 'Back'}
          </button>
        )}
      </div>

      {/* Right side - Action buttons */}
      <div className={styles.rightButtons}>
        {onJunk && (
          <button
            onClick={handleJunkClick}
            className={styles.junkButton}
            disabled={junkDisabled || isLoading}
          >
            <Trash2 size={16} />
            Junk
          </button>
        )}

        {onAddTask && (
          <button
            onClick={handleAddTaskClick}
            className={addTaskDisabled ? styles.disabledButton : styles.secondaryButton}
            disabled={addTaskDisabled || isLoading}
          >
            <Plus size={16} />
            Add Task
          </button>
        )}

        {onPrimaryAction && (
          <button
            onClick={handlePrimaryActionClick}
            className={styles.primaryButton}
            disabled={primaryButtonDisabled || isLoading}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner}></div>
                {loadingText}
              </>
            ) : (
              <>
                {primaryButtonIcon || <CheckCircle size={16} />}
                {primaryButtonText}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}