'use client';

import { useEffect, useState } from 'react';
import styles from './PressureGauge.module.scss';

interface PressureGaugeProps {
  value: number; // 0-10
  maxValue?: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  comparisonValue?: number; // Optional predicted value to show comparison
}

export default function PressureGauge({
  value,
  maxValue = 10,
  size = 'medium',
  showLabel = true,
  label,
  animated = true,
  comparisonValue,
}: PressureGaugeProps) {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);

  // Animate value change
  useEffect(() => {
    if (animated) {
      const duration = 1000; // 1 second
      const steps = 60;
      const stepValue = value / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        setDisplayValue(Math.min(stepValue * currentStep, value));

        if (currentStep >= steps) {
          clearInterval(interval);
        }
      }, duration / steps);

      return () => clearInterval(interval);
    } else {
      setDisplayValue(value);
    }
  }, [value, animated]);

  // Calculate percentage and rotation for gauge
  const percentage = (displayValue / maxValue) * 100;
  const rotation = (percentage / 100) * 180 - 90; // -90 to 90 degrees

  // Determine color based on pressure level
  function getPressureColor(val: number): string {
    if (val <= 2.5) return '#10b981'; // Green
    if (val <= 5) return '#f59e0b'; // Yellow
    if (val <= 7.5) return '#fb923c'; // Orange
    return '#ef4444'; // Red
  }

  // Get pressure level label
  function getPressureLabel(val: number): string {
    if (val <= 2.5) return 'Low';
    if (val <= 5) return 'Moderate';
    if (val <= 7.5) return 'High';
    return 'Critical';
  }

  const gaugeColor = getPressureColor(displayValue);
  const pressureLabel = getPressureLabel(displayValue);

  return (
    <div className={`${styles.pressureGauge} ${styles[size]}`}>
      <svg viewBox="0 0 200 120" className={styles.gaugeSvg}>
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Colored segments */}
        <path
          d="M 20 100 A 80 80 0 0 1 60 35"
          fill="none"
          stroke="#10b981"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.3"
        />
        <path
          d="M 60 35 A 80 80 0 0 1 100 20"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.3"
        />
        <path
          d="M 100 20 A 80 80 0 0 1 140 35"
          fill="none"
          stroke="#fb923c"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.3"
        />
        <path
          d="M 140 35 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#ef4444"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* Active arc showing current value */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={gaugeColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(percentage / 100) * 251.2} 251.2`}
          className={animated ? styles.animatedStroke : ''}
        />

        {/* Center circle */}
        <circle cx="100" cy="100" r="50" fill="white" stroke="#e5e7eb" strokeWidth="2" />

        {/* Value text */}
        <text
          x="100"
          y="95"
          textAnchor="middle"
          className={styles.valueText}
          fill={gaugeColor}
        >
          {displayValue.toFixed(1)}
        </text>

        {/* Label text */}
        <text x="100" y="115" textAnchor="middle" className={styles.labelText} fill="#6b7280">
          {pressureLabel}
        </text>

        {/* Needle (optional alternative visualization) */}
        {/* <line
          x1="100"
          y1="100"
          x2="100"
          y2="40"
          stroke={gaugeColor}
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${rotation} 100 100)`}
          className={animated ? styles.animatedNeedle : ''}
        />
        <circle cx="100" cy="100" r="6" fill={gaugeColor} /> */}
      </svg>

      {/* Comparison indicator */}
      {comparisonValue !== undefined && comparisonValue !== value && (
        <div className={styles.comparison}>
          <span className={styles.comparisonLabel}>Predicted:</span>
          <span
            className={`${styles.comparisonValue} ${
              comparisonValue > value ? styles.increasing : styles.decreasing
            }`}
          >
            {comparisonValue.toFixed(1)}
            {comparisonValue > value ? ' ↑' : ' ↓'}
          </span>
        </div>
      )}

      {/* Optional external label */}
      {showLabel && label && <div className={styles.externalLabel}>{label}</div>}
    </div>
  );
}
