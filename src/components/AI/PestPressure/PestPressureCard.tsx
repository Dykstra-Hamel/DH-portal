'use client';

import { PestPressurePredictionV2 } from '@/lib/ai/types';
import PressureGauge from './PressureGauge';
import styles from './PestPressureCard.module.scss';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  MapPin,
  Calendar,
  Activity,
} from 'lucide-react';

interface PestPressureCardProps {
  prediction: PestPressurePredictionV2;
  showDetails?: boolean;
}

export default function PestPressureCard({
  prediction,
  showDetails = true,
}: PestPressureCardProps) {
  const {
    pestType,
    currentPressure = 0,
    predictedPressure = 0,
    confidenceScore = 0,
    trend = 'stable',
    trendPercentage = 0,
    predictionWindow,
    locationCity,
    locationState,
    anomalyDetected,
    anomalySeverity,
    contributingFactors = [],
    recommendations = [],
    dataPointsUsed,
  } = prediction;

  // Format pest type for display
  const formattedPestType = pestType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Get window label
  const windowLabel = {
    '7d': '7 Days',
    '30d': '30 Days',
    '90d': '90 Days',
  }[predictionWindow];

  // Get trend icon and color
  function getTrendIcon() {
    if (trend === 'increasing' || trend === 'spike')
      return <TrendingUp size={20} className={styles.trendIconUp} />;
    if (trend === 'decreasing') return <TrendingDown size={20} className={styles.trendIconDown} />;
    return <Minus size={20} className={styles.trendIconStable} />;
  }

  function getTrendLabel() {
    if (trend === 'spike') return 'Spike Detected';
    return trend.charAt(0).toUpperCase() + trend.slice(1);
  }

  return (
    <div
      className={`${styles.pestPressureCard} ${anomalyDetected ? styles.anomalyCard : ''}`}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3 className={styles.pestType}>{formattedPestType}</h3>
          {(locationCity || locationState) && (
            <div className={styles.location}>
              <MapPin size={14} />
              <span>
                {locationCity}
                {locationCity && locationState && ', '}
                {locationState}
              </span>
            </div>
          )}
        </div>
        <div className={styles.headerRight}>
          {anomalyDetected && (
            <div className={`${styles.anomalyBadge} ${styles[anomalySeverity || 'medium']}`}>
              <AlertTriangle size={14} />
              <span>Anomaly</span>
            </div>
          )}
        </div>
      </div>

      {/* Gauge and Trend */}
      <div className={styles.gaugeSection}>
        <PressureGauge
          value={currentPressure}
          size="medium"
          showLabel={false}
          comparisonValue={predictedPressure}
        />

        <div className={styles.trendInfo}>
          <div className={styles.predictionWindow}>
            <Calendar size={16} />
            <span>{windowLabel} Forecast</span>
          </div>

          <div className={`${styles.trendIndicator} ${styles[trend]}`}>
            {getTrendIcon()}
            <div className={styles.trendText}>
              <span className={styles.trendLabel}>{getTrendLabel()}</span>
              {trendPercentage > 0 && (
                <span className={styles.trendPercentage}>
                  {trendPercentage > 0 ? '+' : ''}
                  {trendPercentage.toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          <div className={styles.confidence}>
            <Activity size={16} />
            <span>
              {confidenceScore.toFixed(0)}% confidence
              {dataPointsUsed && ` (${dataPointsUsed} data points)`}
            </span>
          </div>
        </div>
      </div>

      {/* Details Section */}
      {showDetails && (contributingFactors.length > 0 || recommendations.length > 0) && (
        <div className={styles.details}>
          {/* Contributing Factors */}
          {contributingFactors.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Contributing Factors</h4>
              <ul className={styles.factorsList}>
                {contributingFactors.slice(0, 3).map((factor, index) => (
                  <li key={index} className={styles.factorItem}>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Recommendations</h4>
              <ul className={styles.recommendationsList}>
                {recommendations.slice(0, 3).map((rec, index) => (
                  <li key={index} className={styles.recommendationItem}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
