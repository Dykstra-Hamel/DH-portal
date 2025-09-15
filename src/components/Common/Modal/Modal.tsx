import React, { ReactNode, useEffect } from 'react'
import Image from 'next/image'
import styles from './Modal.module.scss'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export interface ModalTopProps {
  title: string
  dropdown?: ReactNode
  reviewer?: {
    name: string
    avatar?: string | null
    initials?: string
  }
  onClose?: () => void
}

export interface ModalMiddleProps {
  children: ReactNode
  className?: string
}

export interface ModalBottomProps {
  children: ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, children, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={`${styles.modal} ${className || ''}`}>
        {children}
      </div>
    </div>
  )
}

export function ModalTop({ title, dropdown, reviewer, onClose }: ModalTopProps) {
  return (
    <div className={styles.modalTop}>
      <div className={styles.topRow}>
        <h1 className={styles.title}>{title}</h1>
        {onClose && (
          <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
            ×
          </button>
        )}
      </div>

      {(dropdown || reviewer) && (
        <div className={styles.topControls}>
          {dropdown && (
            <div className={styles.dropdownSection}>
              {dropdown}
            </div>
          )}

          {reviewer && (
            <div className={styles.reviewerSection}>
              <span className={styles.reviewingText}>Reviewing</span>
              <div className={styles.reviewerInfo}>
                <div className={styles.avatarContainer}>
                  {reviewer.avatar ? (
                    <Image
                      src={reviewer.avatar}
                      alt={reviewer.name}
                      width={32}
                      height={32}
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={styles.avatarInitials}>
                      {reviewer.initials || reviewer.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ModalMiddle({ children, className }: ModalMiddleProps) {
  return (
    <div className={`${styles.modalMiddle} ${className || ''}`}>
      {children}
    </div>
  )
}

export function ModalBottom({ children, className }: ModalBottomProps) {
  return (
    <div className={`${styles.modalBottom} ${className || ''}`}>
      {children}
    </div>
  )
}