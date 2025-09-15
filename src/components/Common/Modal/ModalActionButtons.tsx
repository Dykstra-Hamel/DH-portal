import React from 'react'
import { ArrowLeft, Trash2, Plus, CheckCircle } from 'lucide-react'
import styles from './Modal.module.scss'

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
            <ArrowLeft size={16} />
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