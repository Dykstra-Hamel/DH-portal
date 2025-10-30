'use client';

import { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import styles from './AdminControls.module.scss';
import { Play, Loader, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface AdminControlsProps {
  onComplete?: () => void;
}

interface ActionState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

interface Stats {
  dataPoints: number;
  lastAggregation: string | null;
  activeModel: string | null;
  lastTraining: string | null;
  predictionCount: number;
  lastPrediction: string | null;
}

export default function AdminControls({ onComplete }: AdminControlsProps) {
  const { selectedCompany } = useCompany();

  const [aggregationState, setAggregationState] = useState<ActionState>({
    isLoading: false,
    error: null,
    success: null,
  });

  const [trainingState, setTrainingState] = useState<ActionState>({
    isLoading: false,
    error: null,
    success: null,
  });

  const [predictionState, setPredictionState] = useState<ActionState>({
    isLoading: false,
    error: null,
    success: null,
  });

  const [stats, setStats] = useState<Stats>({
    dataPoints: 0,
    lastAggregation: null,
    activeModel: null,
    lastTraining: null,
    predictionCount: 0,
    lastPrediction: null,
  });

  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Load stats on mount and after actions
  useEffect(() => {
    if (selectedCompany) {
      loadStats();
    }
  }, [selectedCompany]);

  const loadStats = async () => {
    if (!selectedCompany) return;

    setIsLoadingStats(true);

    try {
      // Get aggregation stats
      const aggResponse = await fetch(
        `/api/ai/pest-pressure/aggregate?companyId=${selectedCompany.id}`
      );

      if (aggResponse.ok) {
        const aggData = await aggResponse.json();
        setStats(prev => ({
          ...prev,
          dataPoints: aggData.stats?.total_data_points || 0,
          lastAggregation: aggData.stats?.date_range?.latest || null,
        }));
      }

      // TODO: Add API calls for model stats and prediction stats when available
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleAggregation = async () => {
    if (!selectedCompany) return;

    setAggregationState({ isLoading: true, error: null, success: null });

    try {
      const response = await fetch('/api/ai/pest-pressure/aggregate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: selectedCompany.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Aggregation failed');
      }

      setAggregationState({
        isLoading: false,
        error: null,
        success: `Aggregated ${data.result.inserted} data points (${data.result.skipped} duplicates skipped)`,
      });

      // Reload stats
      await loadStats();
      onComplete?.();
    } catch (error: any) {
      setAggregationState({
        isLoading: false,
        error: error.message || 'Failed to run aggregation',
        success: null,
      });
    }
  };

  const handleTraining = async () => {
    if (!selectedCompany) return;

    setTrainingState({ isLoading: true, error: null, success: null });

    try {
      const response = await fetch('/api/ai/pest-pressure/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: selectedCompany.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Training failed');
      }

      setTrainingState({
        isLoading: false,
        error: null,
        success: `Trained 2 models successfully (seasonal forecast + anomaly detection)`,
      });

      // Reload stats
      await loadStats();
      onComplete?.();
    } catch (error: any) {
      setTrainingState({
        isLoading: false,
        error: error.message || 'Failed to train models',
        success: null,
      });
    }
  };

  const handlePrediction = async () => {
    if (!selectedCompany) return;

    setPredictionState({ isLoading: true, error: null, success: null });

    try {
      const response = await fetch('/api/ai/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          predictionType: 'pest_pressure',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Prediction generation failed');
      }

      setPredictionState({
        isLoading: false,
        error: null,
        success: `Generated ${data.predictions?.length || 0} predictions`,
      });

      // Reload stats
      await loadStats();
      onComplete?.();
    } catch (error: any) {
      setPredictionState({
        isLoading: false,
        error: error.message || 'Failed to generate predictions',
        success: null,
      });
    }
  };

  const clearMessage = (setter: React.Dispatch<React.SetStateAction<ActionState>>) => {
    setTimeout(() => {
      setter(prev => ({ ...prev, error: null, success: null }));
    }, 5000);
  };

  useEffect(() => {
    if (aggregationState.error || aggregationState.success) clearMessage(setAggregationState);
  }, [aggregationState.error, aggregationState.success]);

  useEffect(() => {
    if (trainingState.error || trainingState.success) clearMessage(setTrainingState);
  }, [trainingState.error, trainingState.success]);

  useEffect(() => {
    if (predictionState.error || predictionState.success) clearMessage(setPredictionState);
  }, [predictionState.error, predictionState.success]);

  if (!selectedCompany) {
    return null;
  }

  return (
    <div className={styles.adminControls}>
      <div className={styles.header}>
        <h2>Admin Controls</h2>
        <button
          type="button"
          onClick={loadStats}
          className={styles.refreshButton}
          disabled={isLoadingStats}
          title="Refresh stats"
        >
          <RefreshCw size={16} className={isLoadingStats ? styles.spinning : ''} />
        </button>
      </div>

      {/* Step 1: Aggregation */}
      <div className={styles.actionCard}>
        <div className={styles.actionHeader}>
          <div className={styles.stepNumber}>1</div>
          <div className={styles.actionInfo}>
            <h3>Aggregate Data</h3>
            <p>Collect pest data from calls and forms</p>
          </div>
        </div>

        <div className={styles.actionStatus}>
          <span className={styles.statusLabel}>Data Points:</span>
          <span className={styles.statusValue}>{stats.dataPoints.toLocaleString()}</span>
        </div>

        <button
          type="button"
          onClick={handleAggregation}
          disabled={aggregationState.isLoading}
          className={styles.actionButton}
        >
          {aggregationState.isLoading ? (
            <>
              <Loader size={18} className={styles.spinning} />
              <span>Aggregating...</span>
            </>
          ) : (
            <>
              <Play size={18} />
              <span>Run Aggregation</span>
            </>
          )}
        </button>

        {aggregationState.success && (
          <div className={styles.successMessage}>
            <CheckCircle size={16} />
            <span>{aggregationState.success}</span>
          </div>
        )}

        {aggregationState.error && (
          <div className={styles.errorMessage}>
            <AlertCircle size={16} />
            <span>{aggregationState.error}</span>
          </div>
        )}
      </div>

      {/* Step 2: Training */}
      <div className={styles.actionCard}>
        <div className={styles.actionHeader}>
          <div className={styles.stepNumber}>2</div>
          <div className={styles.actionInfo}>
            <h3>Train Models</h3>
            <p>Train ML models on collected data</p>
          </div>
        </div>

        <div className={styles.actionStatus}>
          <span className={styles.statusLabel}>Min Data Points:</span>
          <span className={styles.statusValue}>30 required</span>
        </div>

        <button
          type="button"
          onClick={handleTraining}
          disabled={trainingState.isLoading || stats.dataPoints < 30}
          className={styles.actionButton}
        >
          {trainingState.isLoading ? (
            <>
              <Loader size={18} className={styles.spinning} />
              <span>Training...</span>
            </>
          ) : (
            <>
              <Play size={18} />
              <span>Train Models</span>
            </>
          )}
        </button>

        {stats.dataPoints < 30 && (
          <div className={styles.warningMessage}>
            <AlertCircle size={16} />
            <span>Need at least 30 data points to train (currently {stats.dataPoints})</span>
          </div>
        )}

        {trainingState.success && (
          <div className={styles.successMessage}>
            <CheckCircle size={16} />
            <span>{trainingState.success}</span>
          </div>
        )}

        {trainingState.error && (
          <div className={styles.errorMessage}>
            <AlertCircle size={16} />
            <span>{trainingState.error}</span>
          </div>
        )}
      </div>

      {/* Step 3: Predictions */}
      <div className={styles.actionCard}>
        <div className={styles.actionHeader}>
          <div className={styles.stepNumber}>3</div>
          <div className={styles.actionInfo}>
            <h3>Generate Predictions</h3>
            <p>Create predictions using trained models</p>
          </div>
        </div>

        <div className={styles.actionStatus}>
          <span className={styles.statusLabel}>Status:</span>
          <span className={styles.statusValue}>
            {stats.predictionCount > 0 ? `${stats.predictionCount} active` : 'No predictions'}
          </span>
        </div>

        <button
          type="button"
          onClick={handlePrediction}
          disabled={predictionState.isLoading}
          className={styles.actionButton}
        >
          {predictionState.isLoading ? (
            <>
              <Loader size={18} className={styles.spinning} />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Play size={18} />
              <span>Generate Predictions</span>
            </>
          )}
        </button>

        {predictionState.success && (
          <div className={styles.successMessage}>
            <CheckCircle size={16} />
            <span>{predictionState.success}</span>
          </div>
        )}

        {predictionState.error && (
          <div className={styles.errorMessage}>
            <AlertCircle size={16} />
            <span>{predictionState.error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
