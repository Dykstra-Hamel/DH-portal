import styles from '../Auth.module.scss';
import { OTPInput } from '../OTPInput';

interface OTPFormProps {
  email: string;
  setEmail: (email: string) => void;
  otpSent: boolean;
  verifyingOtp: boolean;
  otpError: string;
  onSendOtp: (e: React.FormEvent) => void;
  onVerifyOtp: (token: string) => void;
  onResendOtp: () => void;
  onBack: () => void;
}

export function OTPForm({
  email,
  setEmail,
  otpSent,
  verifyingOtp,
  otpError,
  onSendOtp,
  onVerifyOtp,
  onResendOtp,
  onBack,
}: OTPFormProps) {
  return (
    <>
      {!otpSent ? (
        <form onSubmit={onSendOtp} className={styles.emailPasswordForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="email-otp" className={styles.inputLabel}>
              Email
            </label>
            <input
              id="email-otp"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={styles.formInput}
              required
            />
          </div>
          <button type="submit" className={styles.loginButton}>
            Send Link To Email
          </button>
        </form>
      ) : (
        <div className={styles.otpVerificationContainer}>
          <p>
            Enter the 6-digit code sent to {email}, or click the login link
            included in the email.
          </p>

          <OTPInput
            length={6}
            onComplete={onVerifyOtp}
            loading={verifyingOtp}
          />

          {otpError && <div className={styles.errorMessage}>{otpError}</div>}

          <div className={styles.otpActions}>
            <button
              type="button"
              onClick={onResendOtp}
              className={styles.resendButton}
              disabled={verifyingOtp}
            >
              Resend Code
            </button>
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
