'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCompany } from '@/contexts/CompanyContext';
import styles from './NewOpportunityWizard.module.scss';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadType = 'new-lead' | 'upsell';

interface PhotoPreview {
  file: File;
  dataUrl: string;
  base64: string;
  mimeType: string;
}

interface AIResult {
  issue_detected: string;
  service_category: string;
  ai_summary: string;
  suggested_pest_type: string | null;
  severity: 'low' | 'medium' | 'high' | null;
}

interface CustomerResult {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  service_addresses?: Array<{
    id: string;
    street_address: string;
    city: string;
    state: string;
    zip: string;
    is_primary: boolean;
    latitude?: number;
    longitude?: number;
  }>;
  distance?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<{ base64: string; dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, dataUrl, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getCustomerDisplayName(c: CustomerResult): string {
  const parts = [c.first_name, c.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : c.email ?? `Customer #${c.id.slice(0, 8)}`;
}

function getPrimaryAddress(c: CustomerResult) {
  if (!c.service_addresses?.length) return null;
  return c.service_addresses.find(a => a.is_primary) ?? c.service_addresses[0];
}

// ─── Step components ──────────────────────────────────────────────────────────

function StepTypeSelect({
  onSelect,
}: {
  onSelect: (type: LeadType) => void;
}) {
  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Select Opportunity Type</h2>
      <p className={styles.stepDesc}>What kind of opportunity did you find?</p>
      <div className={styles.typeCards}>
        <button className={styles.typeCard} onClick={() => onSelect('new-lead')}>
          <span className={styles.typeCardIcon}>🌱</span>
          <span className={styles.typeCardLabel}>New Lead</span>
          <span className={styles.typeCardSub}>New customer opportunity</span>
        </button>
        <button className={styles.typeCard} onClick={() => onSelect('upsell')}>
          <span className={styles.typeCardIcon}>⬆️</span>
          <span className={styles.typeCardLabel}>Upsell Opportunity</span>
          <span className={styles.typeCardSub}>Additional service for existing customer</span>
        </button>
      </div>
    </div>
  );
}

function StepPhotos({
  photos,
  onPhotosChange,
  onAnalyze,
  isAnalyzing,
}: {
  photos: PhotoPreview[];
  onPhotosChange: (photos: PhotoPreview[]) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - photos.length;
    const toAdd = files.slice(0, remaining);

    const newPreviews: PhotoPreview[] = await Promise.all(
      toAdd.map(async file => {
        const { base64, dataUrl, mimeType } = await fileToBase64(file);
        return { file, dataUrl, base64, mimeType };
      })
    );

    onPhotosChange([...photos, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Add Photos</h2>
      <p className={styles.stepDesc}>Capture up to 5 photos of the issue</p>

      <div className={styles.photoGrid}>
        {photos.map((photo, i) => (
          <div key={i} className={styles.photoThumb}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.dataUrl} alt={`Photo ${i + 1}`} />
            <button
              className={styles.removePhotoBtn}
              onClick={() => removePhoto(i)}
              aria-label="Remove photo"
            >
              ×
            </button>
          </div>
        ))}

        {photos.length < 5 && (
          <button
            className={styles.addPhotoCard}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className={styles.cameraIcon}>📷</span>
            <span>Tap to add photo</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {photos.length > 0 && (
        <button
          className={styles.analyzeBtn}
          onClick={onAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <span className={styles.spinner} />
              Analyzing with AI…
            </>
          ) : (
            <>✨ Analyze with AI</>
          )}
        </button>
      )}
    </div>
  );
}

function StepAIReview({
  aiResult,
  notes,
  customerMentioned,
  isHighPriority,
  onAIResultChange,
  onNotesChange,
  onCustomerMentionedChange,
  onHighPriorityChange,
}: {
  aiResult: AIResult;
  notes: string;
  customerMentioned: boolean;
  isHighPriority: boolean;
  onAIResultChange: (result: AIResult) => void;
  onNotesChange: (notes: string) => void;
  onCustomerMentionedChange: (v: boolean) => void;
  onHighPriorityChange: (v: boolean) => void;
}) {
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startDictation = () => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any[])
        .map((r: any) => r[0].transcript)
        .join(' ');
      onNotesChange(notes + (notes ? ' ' : '') + transcript);
    };

    recognition.onend = () => setIsDictating(false);
    recognition.onerror = () => setIsDictating(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsDictating(true);
  };

  const stopDictation = () => {
    recognitionRef.current?.stop();
    setIsDictating(false);
  };

  const hasSpeechSupport =
    typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>AI Review</h2>
      <p className={styles.stepDesc}>Review and edit the AI&apos;s findings</p>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Issue Detected</label>
        <input
          className={styles.fieldInput}
          value={aiResult.issue_detected}
          onChange={e => onAIResultChange({ ...aiResult, issue_detected: e.target.value })}
          placeholder="What issue was found?"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Service Category</label>
        <input
          className={styles.fieldInput}
          value={aiResult.service_category}
          onChange={e => onAIResultChange({ ...aiResult, service_category: e.target.value })}
          placeholder="e.g. Pest Control, Termite Treatment"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>AI Summary</label>
        <textarea
          className={styles.fieldTextarea}
          value={aiResult.ai_summary}
          onChange={e => onAIResultChange({ ...aiResult, ai_summary: e.target.value })}
          placeholder="Summary of findings and recommended action"
          rows={3}
        />
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.notesHeader}>
          <label className={styles.fieldLabel}>Notes</label>
          {hasSpeechSupport && (
            <button
              className={`${styles.dictateBtn} ${isDictating ? styles.dictateBtnActive : ''}`}
              onClick={isDictating ? stopDictation : startDictation}
              type="button"
            >
              🎙️ {isDictating ? 'Stop' : 'Dictate'}
            </button>
          )}
        </div>
        <textarea
          className={styles.fieldTextarea}
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          placeholder="Add any additional notes about this opportunity…"
          rows={4}
        />
      </div>

      <div className={styles.checkboxGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={customerMentioned}
            onChange={e => onCustomerMentionedChange(e.target.checked)}
          />
          <span>Customer mentioned this issue</span>
        </label>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isHighPriority}
            onChange={e => onHighPriorityChange(e.target.checked)}
          />
          <span>High priority</span>
        </label>
      </div>
    </div>
  );
}

function StepSelectSite({
  companyId,
  selectedCustomer,
  onSelectCustomer,
}: {
  companyId: string;
  selectedCustomer: CustomerResult | null;
  onSelectCustomer: (customer: CustomerResult) => void;
}) {
  const [activeTab, setActiveTab] = useState<'search' | 'nearby'>('search');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerResult[]>([]);
  const [nearbyCustomers, setNearbyCustomers] = useState<CustomerResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim() || q.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/customers/search?q=${encodeURIComponent(q)}&companyId=${companyId}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.customers ?? []);
        }
      } finally {
        setIsSearching(false);
      }
    },
    [companyId]
  );

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => doSearch(query), 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [query, doSearch]);

  const loadNearby = useCallback(async () => {
    setIsLoadingNearby(true);
    setNearbyError(null);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      const { latitude, longitude } = position.coords;

      const res = await fetch(`/api/customers/search?q=&companyId=${companyId}&limit=50`);
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      const customers: CustomerResult[] = data.customers ?? [];

      const withDistance = customers
        .map(c => {
          const addr = getPrimaryAddress(c);
          if (!addr?.latitude || !addr?.longitude) return { ...c, distance: Infinity };
          return {
            ...c,
            distance: haversineDistance(latitude, longitude, addr.latitude, addr.longitude),
          };
        })
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
        .slice(0, 20);

      setNearbyCustomers(withDistance);
    } catch (err: any) {
      if (err?.code === 1) {
        setNearbyError('Location access denied. Please enable location permissions.');
      } else {
        setNearbyError('Unable to get your location. Please use the search tab.');
      }
    } finally {
      setIsLoadingNearby(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (activeTab === 'nearby' && nearbyCustomers.length === 0 && !nearbyError) {
      loadNearby();
    }
  }, [activeTab, nearbyCustomers.length, nearbyError, loadNearby]);

  const renderCustomerCard = (customer: CustomerResult) => {
    const addr = getPrimaryAddress(customer);
    const isSelected = selectedCustomer?.id === customer.id;
    return (
      <button
        key={customer.id}
        className={`${styles.customerCard} ${isSelected ? styles.customerCardSelected : ''}`}
        onClick={() => onSelectCustomer(customer)}
      >
        <div className={styles.customerCardName}>{getCustomerDisplayName(customer)}</div>
        {addr && (
          <div className={styles.customerCardAddr}>
            {addr.street_address}, {addr.city}, {addr.state} {addr.zip}
          </div>
        )}
        <div className={styles.customerCardMeta}>
          <span className={styles.customerIdBadge}>ID: {customer.id.slice(0, 8)}</span>
          {customer.distance !== undefined && customer.distance !== Infinity && (
            <span className={styles.distanceBadge}>{customer.distance.toFixed(1)} mi</span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Select Site</h2>
      <p className={styles.stepDesc}>Link this opportunity to a customer</p>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'search' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('search')}
        >
          Search
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'nearby' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('nearby')}
        >
          Nearby
        </button>
      </div>

      {activeTab === 'search' && (
        <>
          <div className={styles.searchInputWrapper}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by name or address…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
            {isSearching && <span className={styles.searchSpinner} />}
          </div>
          <div className={styles.customerList}>
            {searchResults.map(renderCustomerCard)}
            {query.length >= 2 && !isSearching && searchResults.length === 0 && (
              <p className={styles.emptyState}>No customers found for &quot;{query}&quot;</p>
            )}
          </div>
        </>
      )}

      {activeTab === 'nearby' && (
        <div className={styles.customerList}>
          {isLoadingNearby && (
            <div className={styles.loadingState}>
              <span className={styles.spinner} />
              Finding nearby customers…
            </div>
          )}
          {nearbyError && <p className={styles.errorState}>{nearbyError}</p>}
          {!isLoadingNearby && !nearbyError && nearbyCustomers.map(renderCustomerCard)}
          {!isLoadingNearby && !nearbyError && nearbyCustomers.length === 0 && (
            <p className={styles.emptyState}>No nearby customers found</p>
          )}
        </div>
      )}
    </div>
  );
}

function StepReview({
  leadType,
  photos,
  aiResult,
  notes,
  customerMentioned,
  isHighPriority,
  selectedCustomer,
}: {
  leadType: LeadType;
  photos: PhotoPreview[];
  aiResult: AIResult;
  notes: string;
  customerMentioned: boolean;
  isHighPriority: boolean;
  selectedCustomer: CustomerResult | null;
}) {
  const addr = selectedCustomer ? getPrimaryAddress(selectedCustomer) : null;

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Review</h2>
      <p className={styles.stepDesc}>Confirm before submitting</p>

      <div className={styles.reviewSection}>
        <h3 className={styles.reviewSectionTitle}>Opportunity Type</h3>
        <p className={styles.reviewValue}>
          {leadType === 'new-lead' ? '🌱 New Lead' : '⬆️ Upsell Opportunity'}
        </p>
      </div>

      <div className={styles.reviewSection}>
        <h3 className={styles.reviewSectionTitle}>Photos</h3>
        <p className={styles.reviewValue}>{photos.length} photo{photos.length !== 1 ? 's' : ''} attached</p>
        {photos.length > 0 && (
          <div className={styles.reviewPhotoRow}>
            {photos.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={p.dataUrl} alt={`Photo ${i + 1}`} className={styles.reviewThumb} />
            ))}
          </div>
        )}
      </div>

      <div className={styles.reviewSection}>
        <h3 className={styles.reviewSectionTitle}>AI Findings</h3>
        {aiResult.issue_detected && (
          <p className={styles.reviewRow}><strong>Issue:</strong> {aiResult.issue_detected}</p>
        )}
        {aiResult.service_category && (
          <p className={styles.reviewRow}><strong>Category:</strong> {aiResult.service_category}</p>
        )}
        {aiResult.ai_summary && (
          <p className={styles.reviewRow}><strong>Summary:</strong> {aiResult.ai_summary}</p>
        )}
        {aiResult.severity && (
          <p className={styles.reviewRow}><strong>Severity:</strong> {aiResult.severity}</p>
        )}
      </div>

      <div className={styles.reviewSection}>
        <h3 className={styles.reviewSectionTitle}>Notes & Flags</h3>
        {notes ? (
          <p className={styles.reviewValue}>{notes}</p>
        ) : (
          <p className={styles.reviewValueMuted}>No notes added</p>
        )}
        <div className={styles.flagRow}>
          {customerMentioned && <span className={styles.flag}>Customer mentioned</span>}
          {isHighPriority && <span className={`${styles.flag} ${styles.flagHigh}`}>High priority</span>}
        </div>
      </div>

      <div className={styles.reviewSection}>
        <h3 className={styles.reviewSectionTitle}>Site</h3>
        {selectedCustomer ? (
          <>
            <p className={styles.reviewValue}>{getCustomerDisplayName(selectedCustomer)}</p>
            {addr && (
              <p className={styles.reviewValueMuted}>
                {addr.street_address}, {addr.city}, {addr.state} {addr.zip}
              </p>
            )}
          </>
        ) : (
          <p className={styles.reviewValueMuted}>No customer selected</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

const STEP_LABELS = ['Type', 'Photos', 'AI Review', 'Site', 'Review'];

export function NewOpportunityWizard() {
  const router = useRouter();
  const { selectedCompany } = useCompany();

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  // Wizard state
  const [leadType, setLeadType] = useState<LeadType>('new-lead');
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [aiResult, setAIResult] = useState<AIResult>({
    issue_detected: '',
    service_category: '',
    ai_summary: '',
    suggested_pest_type: null,
    severity: null,
  });
  const [notes, setNotes] = useState('');
  const [customerMentioned, setCustomerMentioned] = useState(false);
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);

  const companyId = selectedCompany?.id ?? '';

  const resetWizard = () => {
    setStep(0);
    setLeadType('new-lead');
    setPhotos([]);
    setAIResult({ issue_detected: '', service_category: '', ai_summary: '', suggested_pest_type: null, severity: null });
    setNotes('');
    setCustomerMentioned(false);
    setIsHighPriority(false);
    setSelectedCustomer(null);
    setSubmitError(null);
    setIsDone(false);
  };

  const handleAnalyze = async () => {
    if (!photos.length || !companyId) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch('/api/ai/analyze-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          images: photos.map(p => ({ mimeType: p.mimeType, data: p.base64 })),
          notes,
        }),
      });
      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setAIResult(data);
      setStep(2); // advance to AI Review
    } catch {
      setAnalyzeError('AI analysis failed. You can still continue and fill in the details manually.');
      setStep(2);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!companyId) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const comments = [aiResult.ai_summary, notes ? `Tech Notes: ${notes}` : '']
        .filter(Boolean)
        .join('\n\n');

      const body: Record<string, unknown> = {
        companyId,
        comments: comments || 'TechLead opportunity',
        pestType: aiResult.suggested_pest_type ?? undefined,
        priority: isHighPriority ? 'high' : 'medium',
        leadSource: 'direct',
        leadType: 'manual',
        serviceType: aiResult.service_category || undefined,
      };

      if (selectedCustomer) {
        body.customerId = selectedCustomer.id;
      }

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to create lead');
      }

      setIsDone(true);
    } catch (err: any) {
      setSubmitError(err.message ?? 'Failed to create lead. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Thank You screen
  if (isDone) {
    return (
      <div className={styles.thankYouScreen}>
        <div className={styles.thankYouIcon}>✅</div>
        <h2 className={styles.thankYouTitle}>Opportunity Submitted!</h2>
        <p className={styles.thankYouDesc}>The lead has been created successfully.</p>
        <div className={styles.thankYouActions}>
          <button className={styles.primaryBtn} onClick={resetWizard}>
            Start Another
          </button>
          <button className={styles.secondaryBtn} onClick={() => router.push('/tech-leads')}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const canGoNext = (): boolean => {
    if (step === 1 && photos.length === 0) return false;
    return true;
  };

  const handleNext = () => {
    if (step < 4) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  return (
    <div className={styles.wizardContainer}>
      {/* Progress indicator */}
      <div className={styles.progressBar}>
        {STEP_LABELS.map((label, i) => (
          <div
            key={i}
            className={`${styles.progressStep} ${i === step ? styles.progressStepActive : ''} ${i < step ? styles.progressStepDone : ''}`}
          >
            <div className={styles.progressDot} />
            <span className={styles.progressLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className={styles.stepWrapper}>
        {step === 0 && (
          <StepTypeSelect
            onSelect={type => {
              setLeadType(type);
              setStep(1);
            }}
          />
        )}

        {step === 1 && (
          <StepPhotos
            photos={photos}
            onPhotosChange={setPhotos}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
        )}

        {step === 2 && (
          <>
            {analyzeError && <p className={styles.analyzeError}>{analyzeError}</p>}
            <StepAIReview
              aiResult={aiResult}
              notes={notes}
              customerMentioned={customerMentioned}
              isHighPriority={isHighPriority}
              onAIResultChange={setAIResult}
              onNotesChange={setNotes}
              onCustomerMentionedChange={setCustomerMentioned}
              onHighPriorityChange={setIsHighPriority}
            />
          </>
        )}

        {step === 3 && (
          <StepSelectSite
            companyId={companyId}
            selectedCustomer={selectedCustomer}
            onSelectCustomer={setSelectedCustomer}
          />
        )}

        {step === 4 && (
          <StepReview
            leadType={leadType}
            photos={photos}
            aiResult={aiResult}
            notes={notes}
            customerMentioned={customerMentioned}
            isHighPriority={isHighPriority}
            selectedCustomer={selectedCustomer}
          />
        )}
      </div>

      {/* Bottom action bar */}
      <div className={styles.actionBar}>
        {step > 0 ? (
          <button className={styles.backBtn} onClick={handleBack}>
            ← Back
          </button>
        ) : (
          <button className={styles.backBtn} onClick={() => router.push('/tech-leads')}>
            ← Cancel
          </button>
        )}

        {step < 4 && step !== 0 && (
          <button
            className={styles.nextBtn}
            onClick={handleNext}
            disabled={!canGoNext()}
          >
            Next →
          </button>
        )}

        {step === 4 && (
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className={styles.spinner} />
                Submitting…
              </>
            ) : (
              'Submit'
            )}
          </button>
        )}
      </div>

      {submitError && <p className={styles.submitError}>{submitError}</p>}
    </div>
  );
}
