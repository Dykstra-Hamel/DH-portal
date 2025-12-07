import styles from '../Auth.module.scss';

interface AuthMethodToggleProps {
  authMethod: 'magic-link' | 'otp' | 'password' | 'reset-password';
  onMethodChange: (method: 'magic-link' | 'otp' | 'password' | 'reset-password') => void;
}

export function AuthMethodToggle({ authMethod, onMethodChange }: AuthMethodToggleProps) {
  // Map otp/magic-link to magic link mode, password to password mode
  const isMagicLinkMode = authMethod === 'otp' || authMethod === 'magic-link';
  
  const handleToggle = () => {
    if (isMagicLinkMode) {
      onMethodChange('password');
    } else {
      onMethodChange('otp');
    }
  };

  return (
    <div className={styles.authMethodToggle}>
      <span className={styles.toggleLabel}>Email &amp; Password</span>
      <label className={styles.toggleSwitch}>
        <input
          type="checkbox"
          checked={isMagicLinkMode}
          onChange={handleToggle}
          className={styles.toggleInput}
        />
        <span className={styles.toggleSlider}></span>
      </label>
      <span className={styles.toggleLabel}>Magic Link</span>
    </div>
  );
}