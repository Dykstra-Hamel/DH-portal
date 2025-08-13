'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './Auth.module.scss';

interface OTPInputProps {
  length: number;
  onComplete: (otp: string) => void;
  loading?: boolean;
}

export function OTPInput({ length, onComplete, loading = false }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }

    // Call onComplete when all digits are filled
    if (newOtp.every(digit => digit !== '')) {
      onComplete(newOtp.join(''));
    }
  };

  const handleClick = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    const pasteArray = paste.split('').slice(0, length);
    
    if (pasteArray.every(char => !isNaN(Number(char)))) {
      const newOtp = new Array(length).fill('');
      pasteArray.forEach((char, index) => {
        newOtp[index] = char;
      });
      setOtp(newOtp);
      
      if (newOtp.every(digit => digit !== '')) {
        onComplete(newOtp.join(''));
      }
    }
  };

  return (
    <div className={styles.otpContainer}>
      <div className={styles.otpInputGroup}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{1}"
            maxLength={6}
            className={styles.otpInput}
            value={digit}
            onChange={e => handleChange(index, e.target.value)}
            onClick={() => handleClick(index)}
            onKeyDown={e => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={loading}
          />
        ))}
      </div>
      {loading && <div className={styles.otpLoading}>Verifying...</div>}
    </div>
  );
}