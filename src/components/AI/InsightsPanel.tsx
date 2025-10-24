'use client';

import { useEffect } from 'react';
import { useAI } from '@/contexts/AIContext';
import styles from './InsightsPanel.module.scss';
import {
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  TrendingDown,
  Zap,
  Loader,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Insight, InsightType, InsightPriority } from '@/lib/ai/types';

interface InsightsPanelProps {
  autoLoad?: boolean;
  dateRange?: { start: string; end: string };
}

export default function InsightsPanel({ autoLoad = true, dateRange }: InsightsPanelProps) {
  const {
    insights,
    isLoadingInsights,
    insightsError,
    insightsSummary,
    fetchInsights,
  } = useAI();

  useEffect(() => {
    if (autoLoad) {
      fetchInsights(dateRange);
    }
  }, [autoLoad, dateRange]);

  const handleRefresh = () => {
    fetchInsights(dateRange);
  };

  const getInsightIcon = (type: InsightType) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'recommendation':
        return <Lightbulb size={20} />;
      case 'trend':
        return <TrendingDown size={20} />;
      case 'anomaly':
        return <Zap size={20} />;
      default:
        return <Lightbulb size={20} />;
    }
  };

  const getPriorityClass = (priority: InsightPriority) => {
    switch (priority) {
      case 'critical':
        return styles.priorityCritical;
      case 'high':
        return styles.priorityHigh;
      case 'medium':
        return styles.priorityMedium;
      case 'low':
        return styles.priorityLow;
      default:
        return styles.priorityMedium;
    }
  };

  const getTypeClass = (type: InsightType) => {
    switch (type) {
      case 'opportunity':
        return styles.typeOpportunity;
      case 'warning':
        return styles.typeWarning;
      case 'recommendation':
        return styles.typeRecommendation;
      case 'trend':
        return styles.typeTrend;
      case 'anomaly':
        return styles.typeAnomaly;
      default:
        return styles.typeRecommendation;
    }
  };

  // Sort insights by priority
  const sortedInsights = [...insights].sort((a, b) => {
    const priorityOrder: Record<InsightPriority, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return (
    <div className={styles.insightsPanel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>AI Insights</h2>
          {insightsSummary && (
            <p className={styles.summary}>{insightsSummary}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className={styles.refreshButton}
          disabled={isLoadingInsights}
          title="Refresh insights"
        >
          <RefreshCw
            size={18}
            className={isLoadingInsights ? styles.spinning : ''}
          />
        </button>
      </div>

      {/* Loading state */}
      {isLoadingInsights && insights.length === 0 && (
        <div className={styles.loadingState}>
          <Loader className={styles.spinner} size={40} />
          <p>Analyzing your business data...</p>
        </div>
      )}

      {/* Error state */}
      {insightsError && (
        <div className={styles.errorState}>
          <AlertCircle size={40} />
          <p>{insightsError}</p>
          <button type="button" onClick={handleRefresh} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      )}

      {/* Insights grid */}
      {!isLoadingInsights && !insightsError && insights.length > 0 && (
        <div className={styles.insightsGrid}>
          {sortedInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              getIcon={getInsightIcon}
              getPriorityClass={getPriorityClass}
              getTypeClass={getTypeClass}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoadingInsights && !insightsError && insights.length === 0 && (
        <div className={styles.emptyState}>
          <Lightbulb size={48} />
          <h3>No insights yet</h3>
          <p>Click refresh to generate AI insights for your business.</p>
          <button type="button" onClick={handleRefresh} className={styles.generateButton}>
            Generate Insights
          </button>
        </div>
      )}
    </div>
  );
}

interface InsightCardProps {
  insight: Insight;
  getIcon: (type: InsightType) => JSX.Element;
  getPriorityClass: (priority: InsightPriority) => string;
  getTypeClass: (type: InsightType) => string;
}

function InsightCard({
  insight,
  getIcon,
  getPriorityClass,
  getTypeClass,
}: InsightCardProps) {
  return (
    <div className={`${styles.insightCard} ${getTypeClass(insight.type)}`}>
      {/* Card header */}
      <div className={styles.cardHeader}>
        <div className={styles.iconContainer}>{getIcon(insight.type)}</div>
        <div className={styles.badges}>
          <span className={`${styles.badge} ${getPriorityClass(insight.priority)}`}>
            {insight.priority}
          </span>
          <span className={`${styles.badge} ${styles.typeBadge}`}>
            {insight.type}
          </span>
        </div>
      </div>

      {/* Card content */}
      <h3 className={styles.cardTitle}>{insight.title}</h3>
      <p className={styles.cardDescription}>{insight.description}</p>

      {/* Actionable steps */}
      {insight.actionableSteps && insight.actionableSteps.length > 0 && (
        <div className={styles.actions}>
          <h4 className={styles.actionsTitle}>Recommended Actions:</h4>
          <ul className={styles.actionsList}>
            {insight.actionableSteps.map((step, index) => (
              <li key={index}>
                <CheckCircle2 size={16} />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Estimated impact */}
      {insight.estimatedImpact && (
        <div className={styles.impact}>
          <h4 className={styles.impactTitle}>Expected Impact:</h4>
          <div className={styles.impactDetails}>
            <span className={styles.impactMetric}>
              {insight.estimatedImpact.metric}
            </span>
            <span className={styles.impactChange}>
              {insight.estimatedImpact.expectedChange}
            </span>
            <span className={styles.impactTimeframe}>
              in {insight.estimatedImpact.timeframe}
            </span>
          </div>
        </div>
      )}

      {/* Card footer */}
      <div className={styles.cardFooter}>
        <span className={styles.confidence}>
          {insight.confidence}% confidence
        </span>
        <span className={styles.timestamp}>
          {new Date(insight.generatedAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
