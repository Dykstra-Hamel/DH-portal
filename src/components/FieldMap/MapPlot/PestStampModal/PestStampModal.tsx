'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { MapStampGlyph } from '@/components/FieldMap/MapPlot/glyphs';
import { isMapPestStampType } from '@/components/FieldMap/MapPlot/types';
import { Mic, MicOff } from 'lucide-react';

// ─── Conducive Conditions List ────────────────────────────────────────────────

const CONDUCIVE_CONDITIONS: { group: string; items: string[] }[] = [
  {
    group: 'Moisture & Water',
    items: [
      'Standing Water',
      'Poor Drainage',
      'Excessive Moisture',
      'Leaking Pipes',
      'Condensation Issues',
      'Clogged Gutters',
      'Wet Mulch / Soil',
      'Sprinkler Overspray on Structure',
      'Roof Leak',
      'Basement Moisture',
      'Crawl Space Moisture',
      'Improper Grading (Water Toward Foundation)',
    ],
  },
  {
    group: 'Structural',
    items: [
      'Faulty Grade',
      'Earth-Wood Contact',
      'Wood Decay / Rot',
      'Gaps in Foundation',
      'Cracks in Walls / Foundation',
      'Damaged Fascia or Soffits',
      'Loose or Missing Mortar',
      'Deteriorated Caulking',
      'Open Utility Penetrations',
      'Unsealed Vents',
      'Damaged Weatherstripping',
      'Gaps Around Pipes / Conduit',
      'Missing or Damaged Screens',
      'Gap Under Door',
      'Open Crawl Space Access',
      'Chimney Without Cap',
      'Missing Vent Covers',
    ],
  },
  {
    group: 'Vegetation',
    items: [
      'Overgrown Vegetation Against Structure',
      'Tree Branches Touching Roof',
      'Dense Ground Cover',
      'Ivy / Vines on Structure',
      'Leaf Litter Accumulation',
      'Mulch Too Close to Foundation',
      'Stumps or Dead Trees Nearby',
      'Woodpile Adjacent to Structure',
      'Tall Grass / Weeds',
    ],
  },
  {
    group: 'Harborage',
    items: [
      'Debris Accumulation',
      'Clutter or Storage Near Foundation',
      'Dense Landscaping',
      'Hollow Trees or Logs',
      'Abandoned Equipment',
      'Cardboard / Paper Storage',
      'Rodent Burrows',
      'Rodent Runways',
    ],
  },
  {
    group: 'Food Sources',
    items: [
      'Exposed Trash / Refuse',
      'Pet Food Left Outdoors',
      'Bird Feeders Near Structure',
      'Fruit Trees / Fallen Fruit',
      'Open Compost',
      'Outdoor Dining Area',
      'Grease Accumulation',
      'Unsecured Food Storage',
    ],
  },
  {
    group: 'Birds',
    items: [
      'Nesting Sites (Ledges, HVAC)',
      'Roosting Areas',
      'Open Eaves',
      'Active Bird Nests Present',
      'Bird-Accessible Food Source',
      'Standing Water / Birdbath',
    ],
  },
  {
    group: 'Inaccessible Areas',
    items: [
      'Inaccessible Crawl Space',
      'Inaccessible Attic',
      'Locked / Blocked Area',
      'Limited Access Behind Appliances',
    ],
  },
];

const ALL_CONDITION_OPTIONS = CONDUCIVE_CONDITIONS.flatMap(g =>
  g.items.map(item => ({ group: g.group, label: item }))
);
import { getMapStampOption, isMapConditionStampType } from '@/components/FieldMap/MapPlot/types';
import type { MapPlotStamp } from '@/components/FieldMap/MapPlot/types';
import styles from './PestStampModal.module.scss';

interface PestStampModalProps {
  stamp: MapPlotStamp;
  companyId: string;
  iconSvg?: string | null;
  onSave: (stampId: string, notes: string, photoUrls: string[], customConditionText?: string) => void;
  onDelete: (stampId: string) => void;
  onClose: () => void;
  onSheetReady?: (sheetHeight: number) => void;
}

export function PestStampModal({ stamp, companyId, iconSvg, onSave, onDelete, onClose, onSheetReady }: PestStampModalProps) {
  const option = getMapStampOption(stamp.type);
  const isCondition = isMapConditionStampType(stamp.type);
  const isOtherCondition = stamp.type === 'other-condition';
  const isPestStamp = isMapPestStampType(stamp.type);
  const displayLabel = stamp.displayLabel || option.label;
  const [notes, setNotes] = useState(stamp.notes ?? '');
  const [customConditionText, setCustomConditionText] = useState(stamp.customConditionText ?? '');
  const [photoUrls, setPhotoUrls] = useState<string[]>(stamp.photoUrls ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [conditionError, setConditionError] = useState(false);

  // Dictation
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);
  const hasSpeechSupport =
    typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    if (searchActive) searchInputRef.current?.focus();
  }, [searchActive]);

  const filteredOptions = searchQuery.trim()
    ? ALL_CONDITION_OPTIONS.filter(o =>
        o.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.group.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  function startDictation(onAppend: (text: string) => void) {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    let lastResultIndex = 0;
    recognition.onresult = (event: any) => {
      const newText = Array.from(
        { length: event.results.length - lastResultIndex },
        (_: unknown, i: number) => (event.results[lastResultIndex + i][0].transcript as string)
      ).join(' ').trim();
      lastResultIndex = event.results.length;
      if (newText) onAppend(newText);
    };
    recognition.onend = () => setIsDictating(false);
    recognition.onerror = () => setIsDictating(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsDictating(true);
  }

  function stopDictation() {
    recognitionRef.current?.stop();
    setIsDictating(false);
  }

  async function analyzeImage(base64: string, mimeType: string) {
    if (!isPestStamp && !isOtherCondition) return;
    console.log('[analyzeImage] starting, stampType:', isOtherCondition ? 'condition' : 'pest', 'base64 len:', base64.length);
    setAiAnalyzing(true);
    setAiSuggestions([]);
    try {
      const payload: Record<string, unknown> = {
        stampType: isOtherCondition ? 'condition' : 'pest',
        image: { mimeType, data: base64 },
      };
      if (!isOtherCondition) {
        payload.pestLabel = stamp.displayLabel || stamp.pestSlug || stamp.type;
      } else {
        payload.conditionOptions = CONDUCIVE_CONDITIONS.flatMap(g => g.items);
      }
      const res = await fetch('/api/field-map/analyze-stamp-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const result = await res.json();
        const desc: string = result.description ?? '';
        console.log('[analyzeImage] result:', result, 'desc:', desc);
        if (desc) {
          setNotes(prev => prev ? `${prev} ${desc}` : desc);
        }
        if (isOtherCondition && Array.isArray(result.suggestions) && result.suggestions.length > 0) {
          setAiSuggestions(result.suggestions);
        }
      } else {
        const errBody = await res.json().catch(() => ({}));
        console.error('[analyzeImage] API error', res.status, errBody);
      }
    } catch (err) {
      console.error('[analyzeImage] fetch failed', err);
    } finally {
      setAiAnalyzing(false);
    }
  }

  async function uploadFiles(files: File[]) {
    if (!files.length) return;
    setUploading(true);
    setUploadError(null);
    let errorMessage: string | null = null;

    try {
      for (const file of files) {
        // Read as base64 for AI analysis in parallel with upload
        const base64Promise = new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onload = e => resolve(((e.target?.result as string) ?? '').split(',')[1] ?? '');
          reader.readAsDataURL(file);
        });

        const formData = new FormData();
        formData.append('file', file);
        if (companyId) formData.append('companyId', companyId);

        const [uploadRes, base64] = await Promise.all([
          fetch('/api/field-map/upload-photo', { method: 'POST', body: formData }).then(r =>
            r.json().then(d => ({ ok: r.ok, data: d }))
          ),
          base64Promise,
        ]);

        if (!uploadRes.ok) {
          errorMessage = uploadRes.data.error ?? 'Upload failed';
          continue;
        }
        setPhotoUrls(prev => [...prev, uploadRes.data.url]);
        if (base64) void analyzeImage(base64, file.type);
      }
    } catch {
      errorMessage = 'Upload failed. Please try again.';
    } finally {
      setUploading(false);
      if (errorMessage) setUploadError(errorMessage);
    }
  }

  function handleCameraChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    void uploadFiles([file]);
  }

  function handleUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    void uploadFiles(files);
  }

  function removePhoto(url: string) {
    setPhotoUrls(prev => prev.filter(u => u !== url));
  }

  const canSave = !isCondition || photoUrls.length > 0;

  const isBusy = uploading || aiAnalyzing;
  // For conducive conditions: gate the dropdown + notes until a photo has been uploaded and AI analysis is complete
  const conditionReady = isOtherCondition ? (photoUrls.length > 0 && !aiAnalyzing) : true;

  const sheetRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (sheetRef.current && onSheetReady) {
      onSheetReady(sheetRef.current.getBoundingClientRect().height);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div ref={sheetRef} className={styles.sheet} onClick={e => e.stopPropagation()}>

        {/* Full-modal loading overlay */}
        {isBusy && (
          <div className={styles.modalLoadingOverlay}>
            <span className={styles.modalLoadingSpinner} />
            <p className={styles.modalLoadingText}>
              {uploading ? 'Uploading\u2026' : 'Analyzing image\u2026'}
            </p>
          </div>
        )}
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.stampIcon} style={{ backgroundColor: '#ffffff', color: isCondition ? 'var(--UI-Alert-500, #FD484F)' : 'var(--blue-500, #0075de)' }}>
            {iconSvg ? (
              <span className={styles.stampIconSvg} dangerouslySetInnerHTML={{ __html: iconSvg }} />
            ) : (
              <MapStampGlyph type={stamp.type} size={28} />
            )}
          </div>
          <div className={styles.headerText}>
            <h3 className={styles.title}>
              {isCondition ? 'Conducive Condition' : `${displayLabel} Finding`}
            </h3>
            <p className={styles.subtitle}>
              {isOtherCondition
                ? (conditionReady ? 'Add notes and photos for this conducive condition' : 'Upload a photo to get started')
                : isCondition
                  ? 'Add notes and photos for this conducive condition'
                  : 'Add notes and photos for this pest location'}
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Condition dropdown (shown only after photo uploaded + AI done) */}
        {isOtherCondition && conditionReady && (
          <div className={styles.field}>
            <div className={styles.fieldLabelRow}>
              <span className={styles.fieldLabel}>
                Condition Description <span style={{ color: 'var(--red-500, #ef4444)' }}>*</span>
              </span>
            </div>

            {/* AI suggested condition pills */}
            {!isBusy && aiSuggestions.length > 0 && (
              <div className={styles.aiSuggestionsRow}>
                <span className={styles.aiSuggestionsLabel}>Suggestions</span>
                <div className={styles.aiSuggestions}>
                  {aiSuggestions.map(s => (
                    <button
                      key={s}
                      type="button"
                      className={`${styles.aiSuggestionPill} ${customConditionText === s ? styles.aiSuggestionActive : ''}`}
                      onClick={() => { setCustomConditionText(s); setDropdownOpen(false); setConditionError(false); }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selector trigger + dropdown as one unit */}
            <div className={styles.conditionSelectorWrap}>
            <button
              type="button"
              className={`${styles.conditionSelector} ${dropdownOpen ? styles.conditionSelectorOpen : ''} ${conditionError ? styles.conditionSelectorError : ''}`}
              onClick={() => { setDropdownOpen(o => !o); setSearchActive(false); setSearchQuery(''); }}
            >
              <span className={customConditionText ? styles.conditionSelectorValue : styles.conditionSelectorPlaceholder}>
                {customConditionText || 'Select a condition…'}
              </span>
              <span className={styles.conditionSelectorIcons}>
                <span
                  role="button"
                  tabIndex={0}
                  className={styles.conditionSearchTrigger}
                  onClick={e => {
                    e.stopPropagation();
                    setDropdownOpen(true);
                    setSearchActive(s => !s);
                    setSearchQuery('');
                  }}
                  onKeyDown={e => e.key === 'Enter' && e.currentTarget.click()}
                  aria-label="Search conditions"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                <svg
                  className={`${styles.conditionChevron} ${dropdownOpen ? styles.conditionChevronOpen : ''}`}
                  width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>

            {/* Dropdown panel — sits flush below selector inside the same wrapper */}
            {dropdownOpen && (
              <div className={styles.conditionDropdown}>
                {searchActive && (
                  <div className={styles.conditionSearchRow}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <input
                      ref={searchInputRef}
                      type="text"
                      className={styles.conditionSearchInput}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search conditions…"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className={styles.conditionSearchClear}
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search"
                      >✕</button>
                    )}
                  </div>
                )}

                <div
                  className={styles.conditionList}
                  onTouchMove={e => e.stopPropagation()}
                >
                  {filteredOptions ? (
                    filteredOptions.length > 0 ? (
                      filteredOptions.map(opt => (
                        <button
                          key={opt.label}
                          type="button"
                          className={`${styles.conditionOption} ${customConditionText === opt.label ? styles.conditionOptionActive : ''}`}
                          onClick={() => {
                            setCustomConditionText(opt.label);
                            setDropdownOpen(false);
                            setSearchActive(false);
                            setSearchQuery('');
                            setConditionError(false);
                          }}
                        >
                          <span className={styles.conditionOptionGroup}>{opt.group}</span>
                          {opt.label}
                        </button>
                      ))
                    ) : (
                      <p className={styles.conditionNoResults}>No conditions match &quot;{searchQuery}&quot;</p>
                    )
                  ) : (
                    CONDUCIVE_CONDITIONS.map(group => (
                      <div key={group.group}>
                        <p className={styles.conditionGroupHeader}>{group.group}</p>
                        {group.items.map(item => (
                          <button
                            key={item}
                            type="button"
                            className={`${styles.conditionOption} ${customConditionText === item ? styles.conditionOptionActive : ''}`}
                            onClick={() => {
                              setCustomConditionText(item);
                              setDropdownOpen(false);
                              setSearchActive(false);
                              setConditionError(false);
                            }}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            </div>{/* end conditionSelectorWrap */}
            {conditionError && (
              <p className={styles.conditionErrorMsg}>Condition Description required</p>
            )}
          </div>
        )}

        {/* Notes (for conditions: only shown after photo uploaded + AI done) */}
        {(!isOtherCondition || conditionReady) && (
          <div className={styles.field}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel} htmlFor={`pest-notes-${stamp.id}`}>
                {isCondition ? 'Additional Notes' : 'Description'}
              </label>
              {hasSpeechSupport && (
                <button
                  type="button"
                  className={`${styles.dictateBtn} ${isDictating ? styles.dictateBtnActive : ''}`}
                  onClick={() => isDictating ? stopDictation() : startDictation(text => setNotes(prev => prev ? `${prev} ${text}` : text))}
                  aria-label={isDictating ? 'Stop dictation' : 'Dictate notes'}
                >
                  {isDictating ? <MicOff size={13} /> : <Mic size={13} />}
                  {isDictating ? 'Stop' : 'Dictate'}
                </button>
              )}
            </div>
            <textarea
              id={`pest-notes-${stamp.id}`}
              className={styles.textarea}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={isCondition
                ? 'Any additional observations...'
                : 'Describe the finding — severity, location details, activity observed...'}
              rows={3}
            />
          </div>
        )}

        {/* Photos */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Photos</label>

          {photoUrls.length > 0 && (
            <div className={styles.photoGrid}>
              {photoUrls.map(url => (
                <div key={url} className={styles.photoThumb}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Finding photo" className={styles.photoImg} />
                  <button
                    type="button"
                    className={styles.photoRemove}
                    onClick={() => removePhoto(url)}
                    aria-label="Remove photo"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploadError && <p className={styles.uploadError}>{uploadError}</p>}

          <div className={styles.photoActions}>
            <label
              className={`${styles.photoActionBtn} ${uploading ? styles.photoActionBtnDisabled : ''}`}
            >
              {uploading ? (
                <>
                  <span className={styles.spinner} />
                  Uploading...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  Take Photo
                </>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className={styles.actionInput}
                onChange={handleCameraChange}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={() => onDelete(stamp.id)}
          >
            Remove Stamp
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            disabled={!canSave}
            onClick={() => {
              if (isOtherCondition && !customConditionText.trim()) {
                setConditionError(true);
                return;
              }
              onSave(stamp.id, notes, photoUrls, isOtherCondition ? customConditionText : undefined);
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
