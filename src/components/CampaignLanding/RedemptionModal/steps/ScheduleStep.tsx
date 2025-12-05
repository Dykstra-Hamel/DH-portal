'use client';

/**
 * Schedule Step Component
 *
 * First step of redemption modal - customer selects preferred date and time
 */

import { useState } from 'react';
import styles from '../RedemptionModal.module.scss';

interface ScheduleStepProps {
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    service_address: {
      id: string;
      street_address: string;
      city: string;
      state: string;
      zip_code: string;
    } | null;
  };
  onSubmit: (data: { date: string; time: string }) => void;
}

export default function ScheduleStep({ customer, onSubmit }: ScheduleStepProps) {
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('');

  // Get today's date for min date picker value
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ date: requestedDate, time: requestedTime });
  };

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepHeading}>When would you like us to get started?</h2>

      <form onSubmit={handleSubmit}>
        <div className={styles.schedulingSection}>
          <div className={styles.formGroupRow}>
            <div className={styles.formGroup}>
              <label htmlFor="requested-date">Preferred Start Date:</label>
              <input
                type="date"
                id="requested-date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                min={today}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="requested-time">Preferred Arrival Time:</label>
              <select
                id="requested-time"
                value={requestedTime}
                onChange={(e) => setRequestedTime(e.target.value)}
                className={styles.select}
              >
                <option value="">Select a time...</option>
                <option value="morning">Morning (8am - 12pm)</option>
                <option value="afternoon">Afternoon (12pm - 4pm)</option>
                <option value="evening">Evening (4pm - 8pm)</option>
                <option value="anytime">Anytime</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.infoSection}>
          <h3>Contact Details</h3>
          <div className={styles.infoContent}>
            <p>
              <strong>Name:</strong> {customer.first_name} {customer.last_name}
            </p>
            <p>
              <strong>Email:</strong> {customer.email}
            </p>
            <p>
              <strong>Phone:</strong> {customer.phone_number}
            </p>
            {customer.service_address ? (
              <>
                <p>
                  <strong>Service Address:</strong>
                </p>
                <p>{customer.service_address.street_address}</p>
                <p>
                  {customer.service_address.city}, {customer.service_address.state}{' '}
                  {customer.service_address.zip_code}
                </p>
              </>
            ) : (
              <p>
                <strong>Service Address:</strong> Not provided (will be collected when
                scheduling)
              </p>
            )}
          </div>
        </div>

        <button type="submit" className={styles.primaryButton}>
          Continue
        </button>
      </form>
    </div>
  );
}
