'use client';

import { useEffect, useState } from 'react';
import { useAI } from '@/contexts/AIContext';
import PestPressureCard from './PestPressureCard';
import AnomalyAlertBanner from './AnomalyAlertBanner';
import AdminControls from './AdminControls';
import styles from './PestPressureDashboard.module.scss';
import { Loader, AlertCircle, RefreshCw, Filter, Bug } from 'lucide-react';

interface PestPressureDashboardProps {
  autoLoad?: boolean;
  showFilters?: boolean;
}

export default function PestPressureDashboard({
  autoLoad = true,
  showFilters = true,
}: PestPressureDashboardProps) {
  const {
    pestPressurePredictions,
    isLoadingPestPressure,
    pestPressureError,
    fetchPestPressurePredictions,
    anomalyAlerts,
  } = useAI();

  const [selectedWindow, setSelectedWindow] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedPestType, setSelectedPestType] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'pressure' | 'pest' | 'trend'>('pressure');

  useEffect(() => {
    if (autoLoad) {
      fetchPestPressurePredictions();
    }
  }, [autoLoad]);

  const handleRefresh = () => {
    fetchPestPressurePredictions();
  };

  // Get unique pest types and locations from predictions
  const uniquePestTypes = Array.from(
    new Set(pestPressurePredictions.map((p) => p.pestType).filter(Boolean))
  ).sort();

  const uniqueLocations = Array.from(
    new Set(
      pestPressurePredictions
        .map((p) => {
          if (p.locationCity && p.locationState) {
            return `${p.locationCity}, ${p.locationState}`;
          }
          return p.locationState || null;
        })
        .filter(Boolean) as string[]
    )
  ).sort();

  // Filter predictions
  const filteredPredictions = pestPressurePredictions
    .filter((p) => {
      if (selectedWindow !== 'all' && p.predictionWindow !== selectedWindow) return false;
      if (selectedPestType !== 'all' && p.pestType !== selectedPestType) return false;
      if (selectedLocation !== 'all') {
        const location = p.locationCity && p.locationState
          ? `${p.locationCity}, ${p.locationState}`
          : p.locationState;
        if (location !== selectedLocation) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'pressure') {
        return (b.predictedPressure || 0) - (a.predictedPressure || 0);
      }
      if (sortBy === 'pest') {
        return a.pestType.localeCompare(b.pestType);
      }
      if (sortBy === 'trend') {
        const trendOrder = { spike: 0, increasing: 1, stable: 2, decreasing: 3 };
        return (
          (trendOrder[a.trend || 'stable'] || 2) - (trendOrder[b.trend || 'stable'] || 2)
        );
      }
      return 0;
    });

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Bug size={32} className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>Pest Pressure Predictions</h1>
            <p className={styles.subtitle}>
              ML-powered forecasting with real-time anomaly detection
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className={styles.refreshButton}
          disabled={isLoadingPestPressure}
          title="Refresh predictions"
        >
          <RefreshCw size={18} className={isLoadingPestPressure ? styles.spinning : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Admin Controls */}
      <AdminControls onComplete={handleRefresh} />

      {/* Anomaly Alerts */}
      {anomalyAlerts.length > 0 && <AnomalyAlertBanner anomalies={anomalyAlerts} />}

      {/* Filters */}
      {showFilters && (
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <Filter size={16} />
            <span className={styles.filterLabel}>Filters:</span>
          </div>

          {/* Prediction Window */}
          <div className={styles.filterGroup}>
            <label htmlFor="window-filter" className={styles.filterLabel}>
              Window:
            </label>
            <select
              id="window-filter"
              value={selectedWindow}
              onChange={(e) => setSelectedWindow(e.target.value as any)}
              className={styles.filterSelect}
            >
              <option value="all">All Windows</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="90d">90 Days</option>
            </select>
          </div>

          {/* Pest Type */}
          <div className={styles.filterGroup}>
            <label htmlFor="pest-filter" className={styles.filterLabel}>
              Pest Type:
            </label>
            <select
              id="pest-filter"
              value={selectedPestType}
              onChange={(e) => setSelectedPestType(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Pests</option>
              {uniquePestTypes.map((type) => (
                <option key={type} value={type}>
                  {type
                    .split('_')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          {uniqueLocations.length > 0 && (
            <div className={styles.filterGroup}>
              <label htmlFor="location-filter" className={styles.filterLabel}>
                Location:
              </label>
              <select
                id="location-filter"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Locations</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort By */}
          <div className={styles.filterGroup}>
            <label htmlFor="sort-filter" className={styles.filterLabel}>
              Sort By:
            </label>
            <select
              id="sort-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={styles.filterSelect}
            >
              <option value="pressure">Highest Pressure</option>
              <option value="pest">Pest Type</option>
              <option value="trend">Trend Priority</option>
            </select>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoadingPestPressure && (
        <div className={styles.loadingState}>
          <Loader className={styles.spinner} size={48} />
          <p>Generating pest pressure predictions...</p>
        </div>
      )}

      {/* Error State */}
      {pestPressureError && !isLoadingPestPressure && (
        <div className={styles.errorState}>
          <AlertCircle size={48} />
          <h3>Failed to load predictions</h3>
          <p>{pestPressureError}</p>
          <button type="button" onClick={handleRefresh} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      )}

      {/* Predictions Grid */}
      {!isLoadingPestPressure && !pestPressureError && filteredPredictions.length > 0 && (
        <>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{filteredPredictions.length}</span>
              <span className={styles.statLabel}>
                {filteredPredictions.length === 1 ? 'Prediction' : 'Predictions'}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {filteredPredictions.filter((p) => p.trend === 'increasing' || p.trend === 'spike').length}
              </span>
              <span className={styles.statLabel}>Increasing</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {filteredPredictions.filter((p) => (p.predictedPressure || 0) > 7).length}
              </span>
              <span className={styles.statLabel}>High Risk</span>
            </div>
          </div>

          <div className={styles.grid}>
            {filteredPredictions.map((prediction, index) => (
              <PestPressureCard key={index} prediction={prediction} showDetails={true} />
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {!isLoadingPestPressure &&
        !pestPressureError &&
        pestPressurePredictions.length === 0 && (
          <div className={styles.emptyState}>
            <Bug size={64} />
            <h3>No predictions available</h3>
            <p>
              Train the ML models first to generate pest pressure predictions for your service
              areas.
            </p>
            <button type="button" onClick={handleRefresh} className={styles.generateButton}>
              Generate Predictions
            </button>
          </div>
        )}

      {/* Filtered Empty State */}
      {!isLoadingPestPressure &&
        !pestPressureError &&
        pestPressurePredictions.length > 0 &&
        filteredPredictions.length === 0 && (
          <div className={styles.emptyState}>
            <Filter size={64} />
            <h3>No predictions match your filters</h3>
            <p>Try adjusting your filter settings to see more results.</p>
          </div>
        )}
    </div>
  );
}
