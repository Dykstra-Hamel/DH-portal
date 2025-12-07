'use client';

import { AIProvider } from '@/contexts/AIContext';
import ChatInterface from '@/components/AI/ChatInterface';
import InsightsPanel from '@/components/AI/InsightsPanel';
import PredictionsChart from '@/components/AI/PredictionsChart';
import styles from './page.module.scss';
import { Bot, Sparkles } from 'lucide-react';

export default function AIAssistantPage() {
  return (
    <AIProvider>
      <div className={styles.pageContainer}>
        {/* Page header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <Bot size={32} />
            </div>
            <div>
              <h1 className={styles.pageTitle}>AI Assistant</h1>
              <p className={styles.pageSubtitle}>
                Get intelligent insights, predictions, and answers about your business data
              </p>
            </div>
          </div>
          <div className={styles.badge}>
            <Sparkles size={16} />
            <span>Powered by Gemini AI</span>
          </div>
        </div>

        {/* Main content grid */}
        <div className={styles.contentGrid}>
          {/* Left column - Chat */}
          <div className={styles.leftColumn}>
            <ChatInterface maxHeight="calc(100vh - 280px)" />
          </div>

          {/* Right column - Insights and Predictions */}
          <div className={styles.rightColumn}>
            <section className={styles.section}>
              <InsightsPanel autoLoad={true} />
            </section>

            <section className={styles.section}>
              <PredictionsChart autoLoad={true} />
            </section>
          </div>
        </div>
      </div>
    </AIProvider>
  );
}
