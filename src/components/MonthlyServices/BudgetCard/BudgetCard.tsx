'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './BudgetCard.module.scss';

interface BudgetCardProps {
  budgetType: 'google_ads' | 'social_media' | 'lsa';
  budgetAmount: number;
  actualSpend: number | null;
  maxBudget?: number;
  onBudgetChange: (newAmount: number) => void;
  onActualSpendChange: (actualSpend: number) => void;
  isUpdating?: boolean;
}

const BUDGET_TYPE_LABELS = {
  google_ads: 'Google Ads Budget',
  social_media: 'Social Media Budget',
  lsa: 'LSA Budget',
};

export function BudgetCard({
  budgetType,
  budgetAmount,
  actualSpend,
  maxBudget = 10000,
  onBudgetChange,
  onActualSpendChange,
  isUpdating = false,
}: BudgetCardProps) {
  const [localBudget, setLocalBudget] = useState(budgetAmount);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(budgetAmount.toString());
  const [isEditingActual, setIsEditingActual] = useState(false);
  const [actualInput, setActualInput] = useState(actualSpend?.toString() || '');
  const budgetInputRef = useRef<HTMLInputElement>(null);
  const actualInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Sync local budget with prop changes
  useEffect(() => {
    setLocalBudget(budgetAmount);
    if (!isEditingBudget) {
      setBudgetInput(budgetAmount.toString());
    }
  }, [budgetAmount, isEditingBudget]);

  // Sync actual spend with prop changes
  useEffect(() => {
    if (!isEditingActual) {
      setActualInput(actualSpend?.toString() || '');
    }
  }, [actualSpend, isEditingActual]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingBudget && budgetInputRef.current) {
      budgetInputRef.current.focus();
      budgetInputRef.current.select();
    }
  }, [isEditingBudget]);

  useEffect(() => {
    if (isEditingActual && actualInputRef.current) {
      actualInputRef.current.focus();
      actualInputRef.current.select();
    }
  }, [isEditingActual]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setLocalBudget(newValue);
    setBudgetInput(newValue.toString());

    // Debounce the API call
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      onBudgetChange(newValue);
    }, 500);
  };

  const handleBudgetClick = () => {
    setIsEditingBudget(true);
  };

  const handleBudgetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBudgetInput(e.target.value);
  };

  const handleBudgetInputBlur = () => {
    const parsed = parseFloat(budgetInput);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= maxBudget) {
      if (parsed !== budgetAmount) {
        onBudgetChange(parsed);
      }
      setLocalBudget(parsed);
    } else {
      setBudgetInput(budgetAmount.toString());
    }
    setIsEditingBudget(false);
  };

  const handleBudgetInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBudgetInputBlur();
    } else if (e.key === 'Escape') {
      setBudgetInput(budgetAmount.toString());
      setIsEditingBudget(false);
    }
  };

  const handleActualClick = () => {
    setIsEditingActual(true);
  };

  const handleActualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActualInput(e.target.value);
  };

  const handleActualInputBlur = () => {
    const parsed = parseFloat(actualInput);
    if (!isNaN(parsed) && parsed >= 0) {
      if (parsed !== actualSpend) {
        onActualSpendChange(parsed);
      }
    } else if (actualInput === '') {
      // Allow clearing actual spend
      if (actualSpend !== null) {
        onActualSpendChange(0);
      }
    } else {
      setActualInput(actualSpend?.toString() || '');
    }
    setIsEditingActual(false);
  };

  const handleActualInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleActualInputBlur();
    } else if (e.key === 'Escape') {
      setActualInput(actualSpend?.toString() || '');
      setIsEditingActual(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const spendPercentage = actualSpend !== null && localBudget > 0
    ? (actualSpend / localBudget) * 100
    : 0;

  const isOverBudget = actualSpend !== null && actualSpend > localBudget;

  return (
    <div className={styles.budgetCard}>
      <div className={styles.budgetHeader}>
        <h3 className={styles.budgetTitle}>{BUDGET_TYPE_LABELS[budgetType]}</h3>
      </div>

      <div className={styles.budgetAmount}>
        {isEditingBudget ? (
          <input
            ref={budgetInputRef}
            type="number"
            value={budgetInput}
            onChange={handleBudgetInputChange}
            onBlur={handleBudgetInputBlur}
            onKeyDown={handleBudgetInputKeyDown}
            className={styles.budgetInput}
            min="0"
            max={maxBudget}
            step="1"
          />
        ) : (
          <button
            onClick={handleBudgetClick}
            className={styles.budgetAmountButton}
            disabled={isUpdating}
          >
            {formatCurrency(localBudget)}
          </button>
        )}
      </div>

      <div className={styles.sliderContainer}>
        <input
          type="range"
          min="0"
          max={maxBudget}
          step="10"
          value={localBudget}
          onChange={handleSliderChange}
          className={styles.slider}
          disabled={isUpdating}
          style={{
            // @ts-expect-error - CSS custom property
            '--value-percent': `${(localBudget / maxBudget) * 100}%`
          }}
        />
        <div className={styles.sliderLabels}>
          <span>$0</span>
          <span>{formatCurrency(maxBudget)}</span>
        </div>
      </div>

      <div className={styles.actualSpendSection}>
        <label htmlFor={`actual-${budgetType}`} className={styles.actualLabel}>
          Actual Spend:
        </label>
        {isEditingActual ? (
          <input
            ref={actualInputRef}
            id={`actual-${budgetType}`}
            type="number"
            value={actualInput}
            onChange={handleActualInputChange}
            onBlur={handleActualInputBlur}
            onKeyDown={handleActualInputKeyDown}
            className={styles.actualInput}
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        ) : (
          <button
            onClick={handleActualClick}
            className={`${styles.actualAmountButton} ${isOverBudget ? styles.overBudget : ''}`}
            disabled={isUpdating}
          >
            {actualSpend !== null ? formatCurrency(actualSpend) : 'Not set'}
          </button>
        )}
      </div>

      {actualSpend !== null && (
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div
              className={`${styles.progressFill} ${isOverBudget ? styles.overBudgetFill : ''}`}
              style={{ width: `${spendPercentage}%` }}
            />
          </div>
          <div className={styles.progressLabel}>
            <span className={isOverBudget ? styles.overBudgetText : ''}>
              {spendPercentage.toFixed(1)}% of budget
            </span>
            {isOverBudget && (
              <span className={styles.overBudgetWarning}>Over budget!</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
