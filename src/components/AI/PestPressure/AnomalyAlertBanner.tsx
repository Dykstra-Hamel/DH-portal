'use client';

import { useState } from 'react';
import { PestPressurePredictionV2 } from '@/lib/ai/types';
import styles from './AnomalyAlertBanner.module.scss';
import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';

interface AnomalyAlertBannerProps {
  anomalies: PestPressurePredictionV2[];
  onDismiss?: () => void;
}

export default function AnomalyAlertBanner({ anomalies, onDismiss }: AnomalyAlertBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (anomalies.length === 0 || isDismissed) {
    return null;
  }

  // Get highest severity
  const getSeverity = () => {
    const severities = anomalies.map((a) => a.anomalySeverity || 'low');
    if (severities.includes('critical')) return 'critical';
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    return 'low';
  };

  const severity = getSeverity();

  // Group anomalies by pest type
  const anomalyGroups = anomalies.reduce(
    (acc, anomaly) => {
      const key = anomaly.pestType;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(anomaly);
      return acc;
    },
    {} as Record<string, PestPressurePredictionV2[]>
  );

  const pestTypes = Object.keys(anomalyGroups);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Format pest type for display
  const formatPestType = (pestType: string) => {
    return pestType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className={`${styles.anomalyBanner} ${styles[severity]}`}>
      <div className={styles.bannerHeader}>
        <div className={styles.headerLeft}>
          <AlertTriangle size={24} className={styles.icon} />
          <div className={styles.headerText}>
            <h3 className={styles.title}>
              {severity === 'critical' ? 'Critical ' : ''}
              {severity === 'high' ? 'High Priority ' : ''}
              Pest Pressure Anomaly Detected
            </h3>
            <p className={styles.subtitle}>
              Unusual pest activity detected for {anomalies.length}{' '}
              {anomalies.length === 1 ? 'prediction' : 'predictions'} across {pestTypes.length}{' '}
              {pestTypes.length === 1 ? 'pest type' : 'pest types'}
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.expandButton}
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className={styles.dismissButton}
            aria-label="Dismiss alert"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className={styles.expandedContent}>
          {pestTypes.map((pestType) => {
            const pestAnomalies = anomalyGroups[pestType];
            return (
              <div key={pestType} className={styles.anomalyGroup}>
                <h4 className={styles.pestTypeTitle}>{formatPestType(pestType)}</h4>

                {pestAnomalies.map((anomaly, index) => (
                  <div key={index} className={styles.anomalyDetail}>
                    <div className={styles.detailHeader}>
                      {anomaly.locationCity && (
                        <span className={styles.location}>
                          {anomaly.locationCity}
                          {anomaly.locationState && `, ${anomaly.locationState}`}
                        </span>
                      )}
                      <span className={`${styles.severityBadge} ${styles[anomaly.anomalySeverity || 'medium']}`}>
                        {anomaly.anomalySeverity}
                      </span>
                    </div>

                    {anomaly.anomalyDescription && (
                      <p className={styles.description}>{anomaly.anomalyDescription}</p>
                    )}

                    {anomaly.currentPressure !== undefined &&
                      anomaly.predictedPressure !== undefined && (
                        <div className={styles.pressureComparison}>
                          <span className={styles.pressureLabel}>Current:</span>
                          <span className={styles.pressureValue}>
                            {anomaly.currentPressure.toFixed(1)}
                          </span>
                          <span className={styles.arrow}>→</span>
                          <span className={styles.pressureLabel}>Predicted:</span>
                          <span className={styles.pressureValue}>
                            {anomaly.predictedPressure.toFixed(1)}
                          </span>
                        </div>
                      )}

                    {anomaly.recommendations && anomaly.recommendations.length > 0 && (
                      <div className={styles.recommendations}>
                        <span className={styles.recommendationsLabel}>Recommended Actions:</span>
                        <ul className={styles.recommendationsList}>
                          {anomaly.recommendations.slice(0, 2).map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
