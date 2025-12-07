import styles from '../Auth.module.scss';

interface PasswordFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  passwordError: string;
  onSubmit: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
}

export function PasswordForm({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  passwordError,
  onSubmit,
  onForgotPassword,
}: PasswordFormProps) {
  return (
    <>
      <form onSubmit={onSubmit} className={styles.emailPasswordForm}>
        <div className={styles.inputGroup}>
          <label htmlFor="email" className={styles.inputLabel}>
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="email@domain.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={styles.formInput}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="password" className={styles.inputLabel}>
            Password
          </label>
          <div className={styles.passwordInputWrapper}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={styles.formInput}
              required
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                // Hide password icon (eye with slash)
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.eyeIcon}
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                // Show password icon (eye)
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.eyeIcon}
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {passwordError && (
          <div className={styles.errorMessage}>{passwordError}</div>
        )}

        <button type="submit" className={styles.loginButton}>
          Login
        </button>
      </form>
      <button
        type="button"
        onClick={onForgotPassword}
        className={styles.forgotPasswordLink}
      >
        Forgot Password?
      </button>
    </>
  );
}
