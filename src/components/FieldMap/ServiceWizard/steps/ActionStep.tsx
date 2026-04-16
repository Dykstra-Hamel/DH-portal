'use client';

import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';
import { ReadyToScheduleModal } from '@/components/Common/ReadyToScheduleModal/ReadyToScheduleModal';
import styles from '../ServiceWizard.module.scss';
import type { QuoteLineItem } from './QuoteBuildStep';
import { formatCurrency, formatLineItemLabel, getQuoteTotals } from './QuoteBuildStep';
import { MapPlotData } from '@/components/FieldMap/MapPlot/types';

interface ActionStepProps {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  address: string;
  pestTypes: string[];
  quoteLineItems: QuoteLineItem[];
  notes: string;
  mapPlotData: MapPlotData;
  inspectorName: string;
  companyName: string;
  companyId: string;
}

type ActionState = 'idle' | 'sending' | 'sent' | 'savingLead' | 'savedLead' | 'scheduled' | 'error';

export function ActionStep({
  clientName,
  clientEmail,
  clientPhone,
  address,
  pestTypes,
  quoteLineItems,
  notes,
  mapPlotData,
  inspectorName,
  companyName,
  companyId,
}: ActionStepProps) {
  const { totalInitial, totalRecurring, recurringByFrequency } = getQuoteTotals(quoteLineItems);
  const router = useRouter();
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCustomerReviewModal, setShowCustomerReviewModal] = useState(false);
  const [showReadyToScheduleModal, setShowReadyToScheduleModal] = useState(false);
  const [scheduleSuccessMessage, setScheduleSuccessMessage] = useState<string>('A lead has been created and is ready to be scheduled by the office.');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signedBy, setSignedBy] = useState(clientName || '');
  const [isCustomerNameEditable, setIsCustomerNameEditable] = useState(!(clientName || '').trim());
  const customerNameInputRef = useRef<HTMLInputElement | null>(null);
  const signatureRef = useRef<SignatureCanvas | null>(null);

  // Email capture state for when no clientEmail is available
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [enteredEmail, setEnteredEmail] = useState('');
  const todayLabel = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const callSendQuoteApi = useCallback(async (emailOverride: string | null, sendEmail: boolean) => {
    const res = await fetch('/api/field-map/send-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName,
        clientEmail: emailOverride ?? clientEmail,
        clientPhone,
        address,
        pestTypes,
        quoteLineItems,
        notes,
        mapPlotData,
        inspectorName,
        companyName,
        sendEmail,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Failed to send quote');
    return data;
  }, [clientName, clientEmail, clientPhone, address, pestTypes, quoteLineItems, notes, mapPlotData, inspectorName, companyName]);

  async function handleSendQuote() {
    // If no email on file, show email capture input first
    if (!clientEmail && !showEmailInput) {
      setShowEmailInput(true);
      return;
    }
    setActionState('sending');
    setErrorMsg(null);
    try {
      await callSendQuoteApi(enteredEmail || null, true);
      setActionState('sent');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to connect to server');
      setActionState('error');
    }
  }

  async function handleSaveLead() {
    setActionState('savingLead');
    setErrorMsg(null);
    try {
      await callSendQuoteApi(null, false);
      setActionState('savedLead');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to connect to server');
      setActionState('error');
    }
  }

  async function handleSchedule(option: 'now' | 'later' | 'someone_else', assignedTo?: string) {
    setActionState('sending');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/field-map/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientEmail,
          address,
          pestTypes,
          quoteLineItems,
          notes,
          mapPlotData,
          signatureData,
          signedBy,
          scheduleOption: option,
          assignedTo,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Failed to schedule');
        setActionState('error');
        return;
      }

      if (option === 'now') {
        router.push(`/tickets/scheduling${data.leadId ? `?leadId=${data.leadId}` : ''}`);
        return;
      }

      setScheduleSuccessMessage(
        option === 'someone_else'
          ? 'A lead has been created and assigned for scheduling.'
          : 'A lead has been created and marked ready to schedule.'
      );
      setActionState('scheduled');
    } catch {
      setErrorMsg('Failed to connect to server');
      setActionState('error');
    }
  }

  function handleOpenScheduleReview() {
    setErrorMsg(null);
    setShowCustomerReviewModal(true);
  }

  function handleConfirmCustomerReview() {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setErrorMsg('Customer signature is required before scheduling.');
      return;
    }

    if (!signedBy.trim()) {
      setErrorMsg('Enter the customer name for the signature.');
      setIsCustomerNameEditable(true);
      requestAnimationFrame(() => customerNameInputRef.current?.focus());
      return;
    }

    setSignatureData(signatureRef.current.toDataURL());
    setShowCustomerReviewModal(false);
    setShowReadyToScheduleModal(true);
  }

  function handleEnableCustomerNameEdit() {
    setIsCustomerNameEditable(true);
    requestAnimationFrame(() => customerNameInputRef.current?.focus());
  }

  function handleLockCustomerName() {
    if (signedBy.trim()) {
      setIsCustomerNameEditable(false);
    }
  }

  if (actionState === 'sent') {
    return (
      <div className={styles.successState}>
        <div className={styles.successIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className={styles.successTitle}>Quote Sent!</h2>
        <p className={styles.successSub}>
          A lead has been created and the quote email is on its way.
        </p>
        <button
          type="button"
          className={styles.nextBtn}
          onClick={() => router.push('/field-sales/dashboard')}
          style={{ marginTop: 8 }}
        >
          Back to Route
        </button>
      </div>
    );
  }

  if (actionState === 'savedLead') {
    return (
      <div className={styles.successState}>
        <div className={styles.successIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className={styles.successTitle}>Lead Saved!</h2>
        <p className={styles.successSub}>
          The lead has been created with a &ldquo;Quoted&rdquo; status. No email was sent.
        </p>
        <button
          type="button"
          className={styles.nextBtn}
          onClick={() => router.push('/field-sales/dashboard')}
          style={{ marginTop: 8 }}
        >
          Back to Route
        </button>
      </div>
    );
  }

  if (actionState === 'scheduled') {
    return (
      <div className={styles.successState}>
        <div className={styles.successIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M9 16l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className={styles.successTitle}>Ready to Schedule</h2>
        <p className={styles.successSub}>
          {scheduleSuccessMessage}
        </p>
        <button
          type="button"
          className={styles.nextBtn}
          onClick={() => router.push('/field-sales/dashboard')}
          style={{ marginTop: 8 }}
        >
          Back to Route
        </button>
      </div>
    );
  }

  const isBusy = actionState === 'sending';

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className={styles.section}>
          <span className={styles.label}>Finalize</span>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.5 }}>
            Choose how to proceed with this inspection result.
          </p>
        </div>

        {errorMsg && <div className={styles.errorMsg}>{errorMsg}</div>}

        <div className={styles.actionBtns}>
          <button
            type="button"
            className={styles.quoteBtn}
            onClick={handleSendQuote}
            disabled={isBusy}
          >
            {actionState === 'sending' ? 'Sending\u2026' : 'Send Quote'}
          </button>
          <button
            type="button"
            className={styles.scheduleBtn}
            onClick={handleOpenScheduleReview}
            disabled={isBusy || !companyId}
          >
            Schedule
          </button>
        </div>

        {showEmailInput && (
          <div className={styles.section}>
            <label className={styles.label} htmlFor="fieldmap-quote-email">
              Customer Email
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="fieldmap-quote-email"
                type="email"
                className={styles.priceInput}
                value={enteredEmail}
                onChange={e => setEnteredEmail(e.target.value)}
                placeholder="customer@example.com"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className={styles.nextBtn}
                style={{ padding: '0 16px', flexShrink: 0 }}
                disabled={!enteredEmail.trim() || isBusy}
                onClick={handleSendQuote}
              >
                Send
              </button>
            </div>
          </div>
        )}

        {!companyId && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-400)', textAlign: 'center' }}>
            Select a company to enable scheduling.
          </p>
        )}
      </div>

      {showCustomerReviewModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
            padding: 16,
          }}
          onClick={event => {
            if (event.target === event.currentTarget) {
              setShowCustomerReviewModal(false);
            }
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 680,
              maxHeight: '90vh',
              overflow: 'auto',
              background: '#fff',
              borderRadius: 12,
              border: '1px solid var(--gray-200)',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>
                Customer Review
              </h3>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--gray-600)' }}>
                Confirm the customer details, review pricing, and capture signature before scheduling.
              </p>
            </div>

            <div className={styles.reviewCard}>
              <div className={styles.reviewRow}>
                <span className={styles.reviewLabel}>Customer</span>
                <span className={styles.reviewValue}>{clientName || 'N/A'}</span>
              </div>
              <div className={styles.reviewRow}>
                <span className={styles.reviewLabel}>Address</span>
                <span className={styles.reviewValue}>{address || 'N/A'}</span>
              </div>
              {pestTypes.length > 0 && (
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Pests</span>
                  <span className={styles.reviewValue}>{pestTypes.join(', ')}</span>
                </div>
              )}
            </div>

            {quoteLineItems.length > 0 && (
              <div className={styles.reviewCard}>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Quote</span>
                </div>
                {quoteLineItems.map((item, i) => (
                  <div key={item.id} className={styles.reviewRow}>
                    <span className={styles.reviewLabel}>{i + 1}. {formatLineItemLabel(item)}</span>
                    <span className={styles.reviewValue}>
                      {item.initialCost != null && formatCurrency(item.initialCost)}
                      {item.initialCost != null && item.recurringCost != null && ' · '}
                      {item.recurringCost != null && `${formatCurrency(item.recurringCost)}/${item.frequency ?? 'mo'}`}
                    </span>
                  </div>
                ))}
                <div className={styles.reviewRow} style={{ borderTop: '1px solid var(--gray-100)', paddingTop: 6, marginTop: 2 }}>
                  <span className={styles.reviewLabel}>Total Initial</span>
                  <span className={styles.reviewValue}>{formatCurrency(totalInitial)}</span>
                </div>
                {recurringByFrequency.map(({ frequency, total }) => (
                  <div key={frequency} className={styles.reviewRow}>
                    <span className={styles.reviewLabel}>Recurring / {frequency}</span>
                    <span className={styles.reviewValue}>{formatCurrency(total)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.section}>
              <div className={styles.customerNameHeader}>
                <label className={styles.label} htmlFor="fieldmap-customer-sign-name">
                  Customer Name
                </label>
                {isCustomerNameEditable ? (
                  (clientName || '').trim() && (
                    <button
                      type="button"
                      className={styles.inlineEditBtn}
                      onClick={handleLockCustomerName}
                    >
                      Lock
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    className={styles.inlineEditBtn}
                    onClick={handleEnableCustomerNameEdit}
                  >
                    Edit
                  </button>
                )}
              </div>
              <input
                id="fieldmap-customer-sign-name"
                ref={customerNameInputRef}
                className={`${styles.priceInput} ${!isCustomerNameEditable ? styles.readOnlyInput : ''}`}
                value={signedBy}
                onChange={event => setSignedBy(event.target.value)}
                placeholder="Full name"
                readOnly={!isCustomerNameEditable}
                aria-readonly={!isCustomerNameEditable}
              />
            </div>

            <div className={styles.section}>
              <span className={styles.label}>Signature</span>
              <div
                style={{
                  border: '1px solid var(--gray-200)',
                  borderRadius: 10,
                  background: '#fff',
                  overflow: 'hidden',
                }}
              >
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    width: 640,
                    height: 180,
                    style: { width: '100%', height: 180, display: 'block' },
                  }}
                  backgroundColor="white"
                />
              </div>
              <button
                type="button"
                onClick={() => signatureRef.current?.clear()}
                className={styles.signatureMetaBtn}
              >
                Clear signature
              </button>
              <p className={styles.signatureDate}>Date: {todayLabel}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className={styles.prevBtn}
                style={{ width: 'auto', padding: '0 20px' }}
                onClick={() => setShowCustomerReviewModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.nextBtn}
                style={{ padding: '0 24px' }}
                onClick={handleConfirmCustomerReview}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <ReadyToScheduleModal
        isOpen={showReadyToScheduleModal}
        onClose={() => setShowReadyToScheduleModal(false)}
        onSubmit={(option, assignedTo) => {
          void handleSchedule(option, assignedTo);
        }}
        companyId={companyId}
      />
    </>
  );
}
