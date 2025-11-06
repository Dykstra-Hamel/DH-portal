'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import {
  PEST_CONTROL_REGIONS,
  getRegionIds,
  getMetroRegions,
  getStateRegions,
  formatRegionDisplay
} from '@/lib/utils/region-definitions';
import styles from './AdminPestPressureDashboard.module.scss';
import {
  MapPin,
  TrendingUp,
  Activity,
  AlertTriangle,
  RefreshCw,
  Play,
  Building2,
  Calendar,
  Bug
} from 'lucide-react';

interface AdminPestPressureDashboardProps {
  user: User;
}

interface PredictionData {
  prediction_window: string;
  current_pressure: number;
  predicted_pressure: number;
  trend: string;
  trend_percentage: number;
  anomaly_detected?: boolean;
  anomaly_severity?: string;
  contributing_factors?: string[];
  recommendations?: string[];
  contributing_companies_count?: number;
}

interface AggregationStats {
  features_count: number;
  data_points_count: number;
  contributing_companies_count: number;
}

export default function AdminPestPressureDashboard({ user }: AdminPestPressureDashboardProps) {
  const supabase = createClient();

  // Geographic filters
  const [scopeType, setScopeType] = useState<'state' | 'city' | 'region' | 'national'>('state');
  const [selectedState, setSelectedState] = useState<string>('AZ');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  // Other filters
  const [pestType, setPestType] = useState<string>('all');
  const [timeWindow, setTimeWindow] = useState<'7d' | '30d' | '90d'>('30d');

  // Data states
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [aggregationStats, setAggregationStats] = useState<AggregationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [isAggregating, setIsAggregating] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  const usStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  // Build geographic scope object
  const getGeographicScope = () => {
    const scope: any = { scope: scopeType };

    if (scopeType === 'state' && selectedState) {
      scope.state = selectedState;
    } else if (scopeType === 'city' && selectedState && selectedCity) {
      scope.state = selectedState;
      scope.city = selectedCity;
    } else if (scopeType === 'region' && selectedRegion) {
      const region = PEST_CONTROL_REGIONS[selectedRegion];
      if (region && region.states) {
        scope.region = region.states.join(',');
      }
    }

    return scope;
  };

  // Fetch predictions
  const fetchPredictions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const scope = getGeographicScope();
      const params = new URLSearchParams({
        scope: scope.scope,
        ...(scope.state && { state: scope.state }),
        ...(scope.city && { city: scope.city }),
        ...(scope.region && { region: scope.region }),
        ...(pestType !== 'all' && { pestType }),
      });

      const response = await fetch(
        `/api/admin/pest-pressure/predictions?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch predictions');
      }

      const data = await response.json();
      setPredictions(data.predictions || []);
    } catch (err: any) {
      console.error('[Admin Pest Pressure] Error fetching predictions:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Aggregate data
  const handleAggregate = async () => {
    setIsAggregating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const scope = getGeographicScope();

      const response = await fetch('/api/admin/pest-pressure/aggregate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          geographicScope: scope,
          pestType: pestType !== 'all' ? pestType : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Aggregation failed');
      }

      const data = await response.json();
      setAggregationStats(data.result);
      alert(`Aggregation completed! ${data.result.features_count} features from ${data.result.contributing_companies_count} companies.`);
    } catch (err: any) {
      console.error('[Admin Pest Pressure] Error aggregating:', err);
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setIsAggregating(false);
    }
  };

  // Train models
  const handleTrain = async () => {
    setIsTraining(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const scope = getGeographicScope();

      const response = await fetch('/api/admin/pest-pressure/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          geographicScope: scope,
          pestType: pestType !== 'all' ? pestType : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Training failed');
      }

      const data = await response.json();
      alert(`Training completed! ${data.training_summary.features_count} features from ${data.training_summary.contributing_companies_count} companies.`);

      // Auto-fetch predictions after training
      fetchPredictions();
    } catch (err: any) {
      console.error('[Admin Pest Pressure] Error training:', err);
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setIsTraining(false);
    }
  };

  // Get selected prediction based on time window
  const selectedPrediction = predictions.find(p => p.prediction_window === timeWindow);

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Cross-Company Pest Pressure Analytics</h1>
        <p>Aggregate pest activity data across all companies by geographic region</p>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Geographic Scope</label>
          <select value={scopeType} onChange={(e) => setScopeType(e.target.value as any)}>
            <option value="state">State</option>
            <option value="city">City</option>
            <option value="region">Region</option>
            <option value="national">National</option>
          </select>
        </div>

        {scopeType === 'state' && (
          <div className={styles.filterGroup}>
            <label>State</label>
            <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
              {usStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        )}

        {scopeType === 'city' && (
          <>
            <div className={styles.filterGroup}>
              <label>State</label>
              <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
                {usStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label>City</label>
              <input
                type="text"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                placeholder="Enter city name"
              />
            </div>
          </>
        )}

        {scopeType === 'region' && (
          <div className={styles.filterGroup}>
            <label>Region</label>
            <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
              <option value="">Select a region...</option>
              <optgroup label="Metro Areas">
                {getMetroRegions().map(region => (
                  <option key={region.id} value={region.id}>
                    {formatRegionDisplay(region)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="State Regions">
                {getStateRegions().map(region => (
                  <option key={region.id} value={region.id}>
                    {formatRegionDisplay(region)}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        )}

        <div className={styles.filterGroup}>
          <label>Pest Type</label>
          <select value={pestType} onChange={(e) => setPestType(e.target.value)}>
            <option value="all">All Pests</option>
            <option value="scorpions">Scorpions</option>
            <option value="bed bugs">Bed Bugs</option>
            <option value="termites">Termites</option>
            <option value="ants">Ants</option>
            <option value="roaches">Roaches</option>
            <option value="spiders">Spiders</option>
            <option value="rodents">Rodents</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Time Window</label>
          <select value={timeWindow} onChange={(e) => setTimeWindow(e.target.value as any)}>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          onClick={handleAggregate}
          disabled={isAggregating}
          className={styles.actionButton}
        >
          {isAggregating ? (
            <>
              <RefreshCw size={16} className={styles.spinning} />
              Aggregating...
            </>
          ) : (
            <>
              <Activity size={16} />
              Aggregate Data
            </>
          )}
        </button>

        <button
          onClick={handleTrain}
          disabled={isTraining}
          className={styles.actionButton}
        >
          {isTraining ? (
            <>
              <RefreshCw size={16} className={styles.spinning} />
              Training...
            </>
          ) : (
            <>
              <Play size={16} />
              Train Models
            </>
          )}
        </button>

        <button
          onClick={fetchPredictions}
          disabled={isLoading}
          className={styles.actionButton}
        >
          {isLoading ? (
            <>
              <RefreshCw size={16} className={styles.spinning} />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Fetch Predictions
            </>
          )}
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className={styles.error}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Aggregation Stats */}
      {aggregationStats && (
        <div className={styles.statsCard}>
          <h3>Latest Aggregation Results</h3>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.label}>Features</span>
              <span className={styles.value}>{aggregationStats.features_count}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>Data Points</span>
              <span className={styles.value}>{aggregationStats.data_points_count}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>Companies</span>
              <span className={styles.value}>{aggregationStats.contributing_companies_count}</span>
            </div>
          </div>
        </div>
      )}

      {/* Predictions Display */}
      {selectedPrediction && (
        <div className={styles.predictions}>
          <div className={styles.predictionCard}>
            <div className={styles.cardHeader}>
              <h3>Pest Pressure Forecast</h3>
              <span className={styles.window}>{timeWindow}</span>
            </div>

            <div className={styles.pressureMetrics}>
              <div className={styles.metric}>
                <label>Current Pressure</label>
                <div className={styles.value}>
                  {selectedPrediction.current_pressure}/10
                </div>
              </div>

              <TrendingUp className={styles.arrow} />

              <div className={styles.metric}>
                <label>Predicted Pressure</label>
                <div className={styles.value}>
                  {selectedPrediction.predicted_pressure}/10
                </div>
              </div>
            </div>

            <div className={styles.trend}>
              <span className={`${styles.trendBadge} ${styles[selectedPrediction.trend]}`}>
                {selectedPrediction.trend}
              </span>
              <span className={styles.trendPercent}>
                {selectedPrediction.trend_percentage > 0 ? '+' : ''}
                {selectedPrediction.trend_percentage}%
              </span>
            </div>

            {selectedPrediction.anomaly_detected && (
              <div className={styles.anomaly}>
                <AlertTriangle size={20} />
                <span>Anomaly Detected: {selectedPrediction.anomaly_severity}</span>
              </div>
            )}

            <div className={styles.companiesCount}>
              <Building2 size={16} />
              <span>Data from {selectedPrediction.contributing_companies_count} companies</span>
            </div>
          </div>

          {/* Contributing Factors */}
          {selectedPrediction.contributing_factors && selectedPrediction.contributing_factors.length > 0 && (
            <div className={styles.insightsCard}>
              <h4>Contributing Factors</h4>
              <ul>
                {selectedPrediction.contributing_factors.map((factor, idx) => (
                  <li key={idx}>{factor}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {selectedPrediction.recommendations && selectedPrediction.recommendations.length > 0 && (
            <div className={styles.insightsCard}>
              <h4>Recommendations</h4>
              <ul>
                {selectedPrediction.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && predictions.length === 0 && !error && (
        <div className={styles.emptyState}>
          <Bug size={48} />
          <h3>No Predictions Available</h3>
          <p>Aggregate data and train models to generate cross-company pest pressure predictions</p>
        </div>
      )}
    </div>
  );
}
