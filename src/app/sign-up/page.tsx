'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './page.module.scss';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  message?: string;
}

export default function SignUp() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'firstName':
        if (!value.trim()) return 'First name is required';
        if (value.trim().length < 2)
          return 'First name must be at least 2 characters';
        if (!/^[a-zA-Z\s'-]+$/.test(value))
          return 'First name can only contain letters, spaces, hyphens, and apostrophes';
        return '';
      case 'lastName':
        if (!value.trim()) return 'Last name is required';
        if (value.trim().length < 2)
          return 'Last name must be at least 2 characters';
        if (!/^[a-zA-Z\s'-]+$/.test(value))
          return 'Last name can only contain letters, spaces, hyphens, and apostrophes';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return 'Please enter a valid email address';
        return '';
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        const cleanPhone = value.replace(/[\s\-\(\)\.]/g, '');
        if (!phoneRegex.test(cleanPhone))
          return 'Please enter a valid phone number';
        if (cleanPhone.length < 10)
          return 'Phone number must be at least 10 digits';
        return '';
      case 'message':
        if (!value.trim()) return 'Message is required';
        if (value.trim().length < 10)
          return 'Message must be at least 10 characters';
        if (value.trim().length > 1000)
          return 'Message cannot exceed 1000 characters';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Form submission successful, now initiate Retell AI call
        try {
          const retellResponse = await fetch('/api/retell-call', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          });

          const retellData = await retellResponse.json();

          if (!retellResponse.ok) {
            console.error('Retell AI call failed:', retellData.error);
            console.error('Retell AI error details:', retellData.details);
            // Don't show error to user, just log it
          }
        } catch (retellError) {
          console.error('Failed to initiate Retell AI call:', retellError);
          // Don't show error to user, just log it
        }

        setIsSuccess(true);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          message: '',
        });
        setErrors({});
      } else {
        setError(data.error || 'Failed to submit form. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <Image
            className={styles.logo}
            src="/icon-192x192.png"
            alt="DH Portal logo"
            width={150}
            height={150}
            priority
          />

          <div
            style={{
              padding: '2rem',
              backgroundColor: '#dcfce7',
              border: '1px solid #bbf7d0',
              borderRadius: '0.375rem',
              color: '#166534',
              marginBottom: '1rem',
              maxWidth: '400px',
              textAlign: 'center',
            }}
          >
            <h2>Thank you!</h2>
            <p>
              Your message has been sent successfully. We&apos;ll get back to
              you soon.
            </p>
          </div>

          <button
            onClick={() => setIsSuccess(false)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
            }}
          >
            Send Another Message
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/icon-192x192.png"
          alt="DH Portal logo"
          width={150}
          height={150}
          priority
        />

        <h1>Sign Up</h1>

        {error && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '0.375rem',
              color: '#991b1b',
              marginBottom: '1rem',
              maxWidth: '400px',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxWidth: '400px',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                minLength={2}
                maxLength={25}
                style={{
                  padding: '0.75rem',
                  border: `1px solid ${errors.firstName ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  width: '100%',
                }}
              />
              {errors.firstName && (
                <div
                  style={{
                    color: '#ef4444',
                    fontSize: '0.875rem',
                    marginTop: '0.25rem',
                  }}
                >
                  {errors.firstName}
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                minLength={2}
                maxLength={25}
                style={{
                  padding: '0.75rem',
                  border: `1px solid ${errors.lastName ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  width: '100%',
                }}
              />
              {errors.lastName && (
                <div
                  style={{
                    color: '#ef4444',
                    fontSize: '0.875rem',
                    marginTop: '0.25rem',
                  }}
                >
                  {errors.lastName}
                </div>
              )}
            </div>
          </div>

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              style={{
                padding: '0.75rem',
                border: `1px solid ${errors.email ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '0.375rem',
                fontSize: '1rem',
                width: '100%',
              }}
            />
            {errors.email && (
              <div
                style={{
                  color: '#ef4444',
                  fontSize: '0.875rem',
                  marginTop: '0.25rem',
                }}
              >
                {errors.email}
              </div>
            )}
          </div>

          <div>
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number (e.g., +1-555-123-4567)"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              style={{
                padding: '0.75rem',
                border: `1px solid ${errors.phone ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '0.375rem',
                fontSize: '1rem',
                width: '100%',
              }}
            />
            {errors.phone && (
              <div
                style={{
                  color: '#ef4444',
                  fontSize: '0.875rem',
                  marginTop: '0.25rem',
                }}
              >
                {errors.phone}
              </div>
            )}
          </div>

          <div>
            <textarea
              name="message"
              placeholder="Your Message (minimum 10 characters)"
              value={formData.message}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              minLength={10}
              maxLength={1000}
              rows={4}
              style={{
                padding: '0.75rem',
                border: `1px solid ${errors.message ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '0.375rem',
                fontSize: '1rem',
                resize: 'vertical',
                width: '100%',
              }}
            />
            {errors.message && (
              <div
                style={{
                  color: '#ef4444',
                  fontSize: '0.875rem',
                  marginTop: '0.25rem',
                }}
              >
                {errors.message}
              </div>
            )}
            <div
              style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                marginTop: '0.25rem',
              }}
            >
              {formData.message.length}/1000 characters
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: isSubmitting ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </main>
    </div>
  );
}
