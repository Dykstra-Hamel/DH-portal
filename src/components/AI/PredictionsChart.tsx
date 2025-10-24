'use client';

import { useEffect, useState } from 'react';
import { useAI } from '@/contexts/AIContext';
import styles from './PredictionsChart.module.scss';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { PestPressurePrediction } from '@/lib/ai/types';

interface PredictionsChartProps {
  autoLoad?: boolean;
  predictionType?: string;
  parameters?: Record<string, any>;
}

export default function PredictionsChart({
  autoLoad = true,
  predictionType = 'pest_pressure',
  parameters,
}: PredictionsChartProps) {
  const {
    predictions,
    isLoadingPredictions,
    predictionsError,
    fetchPredictions,
  } = useAI();

  const [selectedPredictionType, setSelectedPredictionType] = useState(predictionType);

  useEffect(() => {
    if (autoLoad) {
      fetchPredictions(selectedPredictionType, parameters);
    }
  }, [autoLoad, selectedPredictionType, parameters]);

  const handleRefresh = () => {
    fetchPredictions(selectedPredictionType, parameters);
  };

  const handleTypeChange = (type: string) => {
    setSelectedPredictionType(type);
    fetchPredictions(type, parameters);
  };

  // Transform pest pressure data for chart
  const chartData =
    selectedPredictionType === 'pest_pressure' && predictions.length > 0
      ? (predictions as PestPressurePrediction[]).map((prediction) => ({
          name: prediction.pestType,
          current: getPressureValue(prediction.currentPressure),
          predicted: getPressureValue(prediction.predictedPressure),
          confidence: prediction.confidenceScore,
        }))
      : [];

  function getPressureValue(pressure: string): number {
    switch (pressure) {
      case 'low':
        return 1;
      case 'medium':
        return 2;
      case 'high':
        return 3;
      case 'extreme':
        return 4;
      default:
        return 0;
    }
  }

  function getPressureLabel(value: number): string {
    switch (value) {
      case 1:
        return 'Low';
      case 2:
        return 'Medium';
      case 3:
        return 'High';
      case 4:
        return 'Extreme';
      default:
        return 'Unknown';
    }
  }

  function getBarColor(value: number): string {
    switch (value) {
      case 1:
        return '#10b981'; // green
      case 2:
        return '#f59e0b'; // yellow
      case 3:
        return '#ef4444'; // red
      case 4:
        return '#7f1d1d'; // dark red
      default:
        return '#9ca3af';
    }
  }

  return (
    <div className={styles.predictionsChart}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <TrendingUp size={24} className={styles.headerIcon} />
          <div>
            <h2 className={styles.title}>AI Predictions</h2>
            <p className={styles.subtitle}>
              Predictive analytics powered by historical data
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className={styles.refreshButton}
          disabled={isLoadingPredictions}
          title="Refresh predictions"
        >
          <RefreshCw
            size={18}
            className={isLoadingPredictions ? styles.spinning : ''}
          />
        </button>
      </div>

      {/* Prediction type selector */}
      <div className={styles.typeSelector}>
        <button
          type="button"
          onClick={() => handleTypeChange('pest_pressure')}
          className={`${styles.typeButton} ${
            selectedPredictionType === 'pest_pressure' ? styles.active : ''
          }`}
        >
          Pest Pressure
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('lead_volume')}
          className={`${styles.typeButton} ${
            selectedPredictionType === 'lead_volume' ? styles.active : ''
          }`}
          disabled
        >
          Lead Volume
          <span className={styles.comingSoon}>Coming Soon</span>
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('churn_risk')}
          className={`${styles.typeButton} ${
            selectedPredictionType === 'churn_risk' ? styles.active : ''
          }`}
          disabled
        >
          Churn Risk
          <span className={styles.comingSoon}>Coming Soon</span>
        </button>
      </div>

      {/* Loading state */}
      {isLoadingPredictions && (
        <div className={styles.loadingState}>
          <Loader className={styles.spinner} size={40} />
          <p>Generating predictions...</p>
        </div>
      )}

      {/* Error state */}
      {predictionsError && !isLoadingPredictions && (
        <div className={styles.errorState}>
          <AlertCircle size={40} />
          <p>{predictionsError}</p>
          <button type="button" onClick={handleRefresh} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      )}

      {/* Chart */}
      {!isLoadingPredictions &&
        !predictionsError &&
        selectedPredictionType === 'pest_pressure' &&
        chartData.length > 0 && (
          <>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    ticks={[1, 2, 3, 4]}
                    tickFormatter={getPressureLabel}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar
                    dataKey="current"
                    name="Current Pressure"
                    fill="#3b82f6"
                    radius={[8, 8, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-current-${index}`} fill={getBarColor(entry.current)} />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="predicted"
                    name="Predicted Pressure"
                    fill="#8b5cf6"
                    radius={[8, 8, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-predicted-${index}`} fill={getBarColor(entry.predicted)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Prediction details */}
            <div className={styles.predictionsList}>
              {(predictions as PestPressurePrediction[]).map((prediction, index) => (
                <PredictionCard key={index} prediction={prediction} />
              ))}
            </div>
          </>
        )}

      {/* Empty state */}
      {!isLoadingPredictions && !predictionsError && predictions.length === 0 && (
        <div className={styles.emptyState}>
          <TrendingUp size={48} />
          <h3>No predictions yet</h3>
          <p>Click refresh to generate AI predictions for your business.</p>
          <button type="button" onClick={handleRefresh} className={styles.generateButton}>
            Generate Predictions
          </button>
        </div>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className={styles.customTooltip}>
        <p className={styles.tooltipLabel}>{payload[0].payload.name}</p>
        <div className={styles.tooltipContent}>
          <div className={styles.tooltipItem}>
            <span className={styles.tooltipDot} style={{ background: '#3b82f6' }}></span>
            <span>Current: </span>
            <strong>{getPressureLabel(payload[0].value)}</strong>
          </div>
          {payload[1] && (
            <div className={styles.tooltipItem}>
              <span className={styles.tooltipDot} style={{ background: '#8b5cf6' }}></span>
              <span>Predicted: </span>
              <strong>{getPressureLabel(payload[1].value)}</strong>
            </div>
          )}
          <div className={styles.tooltipConfidence}>
            {payload[0].payload.confidence}% confidence
          </div>
        </div>
      </div>
    );
  }
  return null;

  function getPressureLabel(value: number): string {
    switch (value) {
      case 1:
        return 'Low';
      case 2:
        return 'Medium';
      case 3:
        return 'High';
      case 4:
        return 'Extreme';
      default:
        return 'Unknown';
    }
  }
}

function PredictionCard({ prediction }: { prediction: PestPressurePrediction }) {
  return (
    <div className={styles.predictionCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{prediction.pestType}</h3>
        <span className={styles.confidence}>{prediction.confidenceScore}% confidence</span>
      </div>

      <div className={styles.pressureComparison}>
        <div className={styles.pressureItem}>
          <span className={styles.pressureLabel}>Current</span>
          <span className={`${styles.pressureValue} ${styles[prediction.currentPressure]}`}>
            {prediction.currentPressure}
          </span>
        </div>
        <div className={styles.arrow}>→</div>
        <div className={styles.pressureItem}>
          <span className={styles.pressureLabel}>Predicted</span>
          <span className={`${styles.pressureValue} ${styles[prediction.predictedPressure]}`}>
            {prediction.predictedPressure}
          </span>
        </div>
      </div>

      {prediction.factors && prediction.factors.length > 0 && (
        <div className={styles.factors}>
          <h4>Contributing Factors:</h4>
          <ul>
            {prediction.factors.map((factor, index) => (
              <li key={index}>{factor}</li>
            ))}
          </ul>
        </div>
      )}

      {prediction.recommendations && prediction.recommendations.length > 0 && (
        <div className={styles.recommendations}>
          <h4>Recommendations:</h4>
          <ul>
            {prediction.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
