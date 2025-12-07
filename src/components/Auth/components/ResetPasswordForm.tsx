import styles from '../Auth.module.scss';

interface ResetPasswordFormProps {
  email: string;
  setEmail: (email: string) => void;
  resetEmailSent: boolean;
  passwordError: string;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export function ResetPasswordForm({
  email,
  setEmail,
  resetEmailSent,
  passwordError,
  onSubmit,
  onBack,
}: ResetPasswordFormProps) {
  return (
    <>
      {!resetEmailSent ? (
        <form onSubmit={onSubmit} className={styles.emailPasswordForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="email-reset" className={styles.inputLabel}>
              Email
            </label>
            <input
              id="email-reset"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.formInput}
              required
            />
          </div>
          {passwordError && (
            <div className={styles.errorMessage}>{passwordError}</div>
          )}
          <button type="submit" className={styles.loginButton}>
            Send Reset Link
          </button>
          <button
            type="button"
            onClick={onBack}
            className={styles.backButton}
          >
            ← Back to login
          </button>
        </form>
      ) : (
        <div className={styles.successMessage}>
          Password reset link sent! Check your email.
          <div className={styles.otpActions}>
            <button
              type="button"
              onClick={onBack}
              className={styles.backButton}
            >
              ← Back to login
            </button>
          </div>
        </div>
      )}
    </>
  );
}