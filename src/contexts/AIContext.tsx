'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useCompany } from './CompanyContext';
import {
  ChatMessage,
  ChatResponse,
  Insight,
  InsightsResponse,
  PredictionsResponse,
  AIUsageSummary,
} from '@/lib/ai/types';

interface AIContextType {
  // Chat state
  chatMessages: ChatMessage[];
  isLoadingChat: boolean;
  chatError: string | null;
  sendChatMessage: (message: string) => Promise<void>;
  clearChatHistory: () => void;

  // Insights state
  insights: Insight[];
  isLoadingInsights: boolean;
  insightsError: string | null;
  insightsSummary: string | null;
  fetchInsights: (dateRange?: { start: string; end: string }) => Promise<void>;

  // Predictions state
  predictions: any[];
  isLoadingPredictions: boolean;
  predictionsError: string | null;
  fetchPredictions: (
    predictionType: string,
    parameters?: Record<string, any>
  ) => Promise<void>;

  // Usage stats
  usageStats: AIUsageSummary | null;
  isLoadingUsage: boolean;
  fetchUsageStats: (startDate: string, endDate: string) => Promise<void>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

interface AIProviderProps {
  children: ReactNode;
}

export function AIProvider({ children }: AIProviderProps) {
  const { selectedCompany } = useCompany();

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Insights state
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [insightsSummary, setInsightsSummary] = useState<string | null>(null);

  // Predictions state
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [predictionsError, setPredictionsError] = useState<string | null>(null);

  // Usage stats
  const [usageStats, setUsageStats] = useState<AIUsageSummary | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);

  /**
   * Send a chat message and get AI response
   */
  const sendChatMessage = async (message: string) => {
    if (!selectedCompany) {
      setChatError('No company selected');
      return;
    }

    setIsLoadingChat(true);
    setChatError(null);

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          message,
          conversationHistory: chatMessages,
          includeMetrics: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      const data: ChatResponse = await response.json();

      // Add assistant message to chat
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      setChatError(error.message || 'An error occurred');

      // Remove the user message if request failed
      setChatMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoadingChat(false);
    }
  };

  /**
   * Clear chat history
   */
  const clearChatHistory = () => {
    setChatMessages([]);
    setChatError(null);
  };

  /**
   * Fetch AI-generated insights
   */
  const fetchInsights = async (dateRange?: { start: string; end: string }) => {
    if (!selectedCompany) {
      setInsightsError('No company selected');
      return;
    }

    setIsLoadingInsights(true);
    setInsightsError(null);

    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          dateRange,
          minConfidence: 70,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch insights');
      }

      const data: InsightsResponse = await response.json();

      setInsights(data.insights);
      setInsightsSummary(data.summary);
    } catch (error: any) {
      console.error('Insights error:', error);
      setInsightsError(error.message || 'An error occurred');
    } finally {
      setIsLoadingInsights(false);
    }
  };

  /**
   * Fetch predictions
   */
  const fetchPredictions = async (
    predictionType: string,
    parameters?: Record<string, any>
  ) => {
    if (!selectedCompany) {
      setPredictionsError('No company selected');
      return;
    }

    setIsLoadingPredictions(true);
    setPredictionsError(null);

    try {
      const response = await fetch('/api/ai/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          predictionType,
          parameters,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch predictions');
      }

      const data: PredictionsResponse = await response.json();

      setPredictions(data.predictions);
    } catch (error: any) {
      console.error('Predictions error:', error);
      setPredictionsError(error.message || 'An error occurred');
    } finally {
      setIsLoadingPredictions(false);
    }
  };

  /**
   * Fetch usage statistics
   */
  const fetchUsageStats = async (startDate: string, endDate: string) => {
    if (!selectedCompany) {
      return;
    }

    setIsLoadingUsage(true);

    try {
      const response = await fetch(
        `/api/ai/usage?companyId=${selectedCompany.id}&startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch usage stats');
      }

      const data = await response.json();
      setUsageStats(data);
    } catch (error: any) {
      console.error('Usage stats error:', error);
    } finally {
      setIsLoadingUsage(false);
    }
  };

  return (
    <AIContext.Provider
      value={{
        chatMessages,
        isLoadingChat,
        chatError,
        sendChatMessage,
        clearChatHistory,
        insights,
        isLoadingInsights,
        insightsError,
        insightsSummary,
        fetchInsights,
        predictions,
        isLoadingPredictions,
        predictionsError,
        fetchPredictions,
        usageStats,
        isLoadingUsage,
        fetchUsageStats,
      }}
    >
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}
