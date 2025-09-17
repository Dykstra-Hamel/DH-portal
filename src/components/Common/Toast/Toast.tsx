import React, { useEffect } from 'react'
import styles from './Toast.module.scss'

export interface ToastProps {
  message: string
  isVisible: boolean
  onClose: () => void
  type?: 'success'
  duration?: number
  showUndo?: boolean
  onUndo?: () => void
  undoText?: string
  undoLoading?: boolean
}

export function Toast({
  message,
  isVisible,
  onClose,
  type = 'success',
  duration = 4000,
  showUndo = false,
  onUndo,
  undoText = 'Undo',
  undoLoading = false
}: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <div className={styles.iconContainer}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 26 27" fill="none" className={styles.icon}>
          <circle cx="13" cy="13.54" r="12" fill="white" stroke="#25B762" strokeWidth="2"/>
          <path d="M9.4 13.54L11.8 15.94L16.6 11.14" fill="none" stroke="#25B762" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <span className={styles.message}>{message}</span>
      {showUndo && onUndo && (
        <button
          onClick={onUndo}
          className={styles.undoButton}
          disabled={undoLoading}
        >
          {undoLoading ? 'Undoing...' : undoText}
        </button>
      )}
    </div>
  )
}