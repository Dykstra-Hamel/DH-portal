# AI UI Components - Implementation Guide

**Last Updated:** October 24, 2025
**Version:** 1.0.0
**Related Doc:** GEMINI_AI_INTEGRATION.md

---

## Table of Contents

1. [Overview](#overview)
2. [AIProvider Context](#aiprovider-context)
3. [ChatInterface Component](#chatinterface-component)
4. [InsightsPanel Component](#insightspanel-component)
5. [PredictionsChart Component](#predictionschart-component)
6. [Example Integration](#example-integration)
7. [Styling & Customization](#styling--customization)
8. [Best Practices](#best-practices)

---

## Overview

The AI UI components provide a complete, production-ready interface for all Gemini AI features. Built with React, TypeScript, and SCSS modules, they follow the existing DH Portal design patterns.

### Components Included

- **AIProvider** - React Context for AI state management
- **ChatInterface** - Interactive chatbot with conversation history
- **InsightsPanel** - Display AI-generated business insights
- **PredictionsChart** - Visualize predictions with interactive charts

### Key Features

✅ **Fully Responsive** - Mobile-first design
✅ **Loading States** - Elegant loading indicators
✅ **Error Handling** - User-friendly error messages
✅ **Accessibility** - Keyboard navigation and ARIA labels
✅ **Animations** - Smooth transitions and interactions
✅ **Type-Safe** - Full TypeScript support

---

## AIProvider Context

The `AIProvider` manages all AI-related state and provides hooks for components to interact with the AI API.

### Setup

Wrap your app or specific routes with the AIProvider:

```tsx
import { AIProvider } from '@/contexts/AIContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AIProvider>
      {children}
    </AIProvider>
  );
}
```

### useAI Hook

Access AI functionality from any component:

```tsx
import { useAI } from '@/contexts/AIContext';

function MyComponent() {
  const {
    // Chat
    chatMessages,
    isLoadingChat,
    chatError,
    sendChatMessage,
    clearChatHistory,

    // Insights
    insights,
    isLoadingInsights,
    insightsError,
    insightsSummary,
    fetchInsights,

    // Predictions
    predictions,
    isLoadingPredictions,
    predictionsError,
    fetchPredictions,

    // Usage stats
    usageStats,
    isLoadingUsage,
    fetchUsageStats,
  } = useAI();

  // Use the AI functions
}
```

### State Management

The AIProvider automatically:
- Manages conversation history
- Handles loading and error states
- Caches responses where appropriate
- Integrates with CompanyContext for multi-tenancy

---

## ChatInterface Component

An interactive chatbot that allows users to query business data using natural language.

### Basic Usage

```tsx
import { ChatInterface } from '@/components/AI';

export default function MyPage() {
  return (
    <ChatInterface
      placeholder="Ask about your business data..."
      maxHeight="600px"
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | string | "Ask about your business data..." | Input placeholder text |
| `maxHeight` | string | "600px" | Maximum height of messages container |

### Features

#### 1. Conversation History
- Maintains full conversation context
- Automatically scrolls to new messages
- Shows user and AI messages with distinct styling

#### 2. Suggested Questions
- Displays suggested queries when chat is empty
- One-click to populate input field
- Customizable suggestions

#### 3. Input Handling
- Auto-resizing textarea (up to 120px)
- Enter to send, Shift+Enter for new line
- Keyboard shortcuts displayed
- Disabled during loading

#### 4. Loading Indicators
- Animated "typing" dots while AI is thinking
- Spinner on send button
- Smooth transitions

#### 5. Error Display
- Error banner at bottom of chat
- Retry capability
- User-friendly error messages

### Customization

#### Change Suggested Questions

Edit the `suggestedQuestions` array in `ChatInterface.tsx`:

```tsx
const suggestedQuestions = [
  'Your custom question 1',
  'Your custom question 2',
  'Your custom question 3',
];
```

#### Styling

Modify `ChatInterface.module.scss` to customize:
- Colors and gradients
- Border radius and shadows
- Typography
- Spacing and layout
- Animation timings

---

## InsightsPanel Component

Displays AI-generated business insights as actionable cards with priorities and recommendations.

### Basic Usage

```tsx
import { InsightsPanel } from '@/components/AI';

export default function MyPage() {
  return (
    <InsightsPanel
      autoLoad={true}
      dateRange={{
        start: '2025-01-01',
        end: '2025-01-31'
      }}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `autoLoad` | boolean | true | Automatically fetch insights on mount |
| `dateRange` | object | Last 30 days | Date range for analysis |

### Features

#### 1. Insight Cards
- **Type badges**: opportunity, warning, recommendation, trend, anomaly
- **Priority levels**: low, medium, high, critical
- **Color-coded** by type and priority
- **Confidence scores** (0-100%)

#### 2. Actionable Steps
- Numbered list of specific actions
- Checkmarks for visual clarity
- Clear, concise recommendations

#### 3. Estimated Impact
- Metric name (e.g., "Win Rate")
- Expected change (e.g., "+15%")
- Timeframe (e.g., "in 30 days")
- Highlighted for visibility

#### 4. Smart Sorting
- Automatically sorts by priority (critical → high → medium → low)
- Most important insights appear first

#### 5. Refresh Capability
- Manual refresh button in header
- Loading spinner during fetch
- Summary text from AI

### Insight Types & Colors

```scss
// Opportunity - Green
.typeOpportunity { background: linear-gradient(90deg, #10b981 0%, #059669 100%); }

// Warning - Orange
.typeWarning { background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%); }

// Recommendation - Blue
.typeRecommendation { background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%); }

// Trend - Purple
.typeTrend { background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%); }

// Anomaly - Red
.typeAnomaly { background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%); }
```

---

## PredictionsChart Component

Visualizes AI predictions using interactive charts (built with Recharts).

### Basic Usage

```tsx
import { PredictionsChart } from '@/components/AI';

export default function MyPage() {
  return (
    <PredictionsChart
      autoLoad={true}
      predictionType="pest_pressure"
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `autoLoad` | boolean | true | Automatically fetch predictions on mount |
| `predictionType` | string | "pest_pressure" | Type of prediction to display |
| `parameters` | object | undefined | Additional parameters for prediction |

### Prediction Types

#### 1. Pest Pressure (Implemented)
- Bar chart showing current vs predicted pressure
- Color-coded by severity (green → yellow → red → dark red)
- Confidence scores per pest type
- Contributing factors list
- Actionable recommendations

#### 2. Lead Quality (Ready to implement)
```tsx
<PredictionsChart
  predictionType="lead_quality"
  parameters={{ leadId: 'uuid' }}
/>
```

#### 3. Coming Soon
- Lead Volume Forecasting
- Customer Churn Risk
- Seasonal Demand Patterns

### Chart Features

#### Interactive Bar Chart
- Hover tooltips with detailed info
- Responsive sizing
- Custom colors based on pressure level
- Legend for current vs predicted

#### Prediction Cards
- Summary of each prediction
- Current → Predicted comparison
- Contributing factors
- Recommendations
- Confidence scores

#### Type Selector
- Switch between prediction types
- Coming soon badges for unreleased types
- Active state styling

---

## Example Integration

### Full-Page Implementation

```tsx
// /app/ai-assistant/page.tsx

'use client';

import { AIProvider } from '@/contexts/AIContext';
import { ChatInterface, InsightsPanel, PredictionsChart } from '@/components/AI';
import styles from './page.module.scss';

export default function AIAssistantPage() {
  return (
    <AIProvider>
      <div className={styles.pageContainer}>
        <h1>AI Assistant</h1>

        <div className={styles.layout}>
          {/* Left: Chat */}
          <div className={styles.chatColumn}>
            <ChatInterface maxHeight="calc(100vh - 200px)" />
          </div>

          {/* Right: Insights & Predictions */}
          <div className={styles.insightsColumn}>
            <InsightsPanel autoLoad={true} />
            <PredictionsChart autoLoad={true} />
          </div>
        </div>
      </div>
    </AIProvider>
  );
}
```

### Dashboard Widget Integration

```tsx
// /app/dashboard/page.tsx

import { AIProvider } from '@/contexts/AIContext';
import { InsightsPanel } from '@/components/AI';

export default function Dashboard() {
  return (
    <div className={styles.dashboard}>
      {/* Existing dashboard content */}
      <div className={styles.metrics}>
        {/* ... */}
      </div>

      {/* AI Insights Section */}
      <AIProvider>
        <section className={styles.aiInsights}>
          <InsightsPanel
            autoLoad={true}
            dateRange={{
              start: getLastWeek(),
              end: new Date().toISOString()
            }}
          />
        </section>
      </AIProvider>
    </div>
  );
}
```

### Modal/Dialog Integration

```tsx
import { useState } from 'react';
import { AIProvider } from '@/contexts/AIContext';
import { ChatInterface } from '@/components/AI';

function AIChatModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <button onClick={onClose}>Close</button>
        <AIProvider>
          <ChatInterface maxHeight="500px" />
        </AIProvider>
      </div>
    </div>
  );
}
```

---

## Styling & Customization

### Color Scheme

All components use CSS variables for easy theming:

```scss
// Define custom colors
:root {
  --ai-primary: #667eea;
  --ai-primary-dark: #764ba2;
  --ai-success: #10b981;
  --ai-warning: #f59e0b;
  --ai-error: #ef4444;
  --ai-neutral: #6b7280;
}
```

### Custom Gradient

Change the AI theme gradient:

```scss
// In component SCSS files
.header {
  background: linear-gradient(135deg, var(--ai-primary) 0%, var(--ai-primary-dark) 100%);
}
```

### Responsive Breakpoints

```scss
// Mobile
@media (max-width: 768px) {
  // Styles
}

// Tablet
@media (max-width: 1024px) {
  // Styles
}

// Desktop
@media (min-width: 1280px) {
  // Styles
}
```

### Dark Mode Support

Add dark mode styles to each SCSS module:

```scss
[data-theme='dark'] {
  .chatContainer {
    background: #1f2937;
    border-color: #374151;
  }

  .messageText {
    background: #374151;
    color: #f9fafb;
  }
}
```

---

## Best Practices

### 1. Provider Placement

✅ **Do:** Place AIProvider at page or layout level
```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <CompanyProvider>
      <AIProvider>
        {children}
      </AIProvider>
    </CompanyProvider>
  );
}
```

❌ **Don't:** Place AIProvider inside individual components (causes unnecessary re-renders)

### 2. Loading States

✅ **Do:** Show loading states immediately
```tsx
const { isLoadingInsights, insights } = useAI();

return (
  <>
    {isLoadingInsights && <Spinner />}
    {!isLoadingInsights && insights.map(...)}
  </>
);
```

❌ **Don't:** Hide content while loading (causes layout shift)

### 3. Error Handling

✅ **Do:** Provide retry mechanisms
```tsx
{error && (
  <div>
    <p>{error}</p>
    <button onClick={retry}>Try Again</button>
  </div>
)}
```

❌ **Don't:** Just show error text without action

### 4. Date Ranges

✅ **Do:** Use consistent date formats (ISO 8601)
```tsx
<InsightsPanel
  dateRange={{
    start: '2025-01-01T00:00:00Z',
    end: '2025-01-31T23:59:59Z'
  }}
/>
```

❌ **Don't:** Use ambiguous date formats

### 5. Performance

✅ **Do:** Use autoLoad wisely
```tsx
// Auto-load on main AI page
<ChatInterface autoLoad={true} />

// Manual load in dashboard widget
<InsightsPanel autoLoad={false} />
<button onClick={fetchInsights}>Load Insights</button>
```

❌ **Don't:** Auto-load on every page (increases API usage)

### 6. Accessibility

✅ **Do:** Use semantic HTML and ARIA labels
```tsx
<button
  type="button"
  onClick={handleSubmit}
  aria-label="Send message"
  disabled={isLoading}
>
  <Send size={20} />
</button>
```

❌ **Don't:** Rely only on icons without labels

### 7. Mobile Optimization

✅ **Do:** Test on mobile devices
- Sticky headers should not block content
- Touch targets should be at least 44x44px
- Forms should be easy to use on mobile

❌ **Don't:** Assume desktop layout works on mobile

---

## Component API Reference

### AIProvider

```tsx
interface AIContextType {
  // Chat
  chatMessages: ChatMessage[];
  isLoadingChat: boolean;
  chatError: string | null;
  sendChatMessage: (message: string) => Promise<void>;
  clearChatHistory: () => void;

  // Insights
  insights: Insight[];
  isLoadingInsights: boolean;
  insightsError: string | null;
  insightsSummary: string | null;
  fetchInsights: (dateRange?: { start: string; end: string }) => Promise<void>;

  // Predictions
  predictions: any[];
  isLoadingPredictions: boolean;
  predictionsError: string | null;
  fetchPredictions: (predictionType: string, parameters?: Record<string, any>) => Promise<void>;

  // Usage
  usageStats: AIUsageSummary | null;
  isLoadingUsage: boolean;
  fetchUsageStats: (startDate: string, endDate: string) => Promise<void>;
}
```

### ChatInterface

```tsx
interface ChatInterfaceProps {
  placeholder?: string;      // Input placeholder text
  maxHeight?: string;         // Max height of messages container
}
```

### InsightsPanel

```tsx
interface InsightsPanelProps {
  autoLoad?: boolean;         // Auto-fetch on mount
  dateRange?: {               // Date range for analysis
    start: string;
    end: string;
  };
}
```

### PredictionsChart

```tsx
interface PredictionsChartProps {
  autoLoad?: boolean;         // Auto-fetch on mount
  predictionType?: string;    // Type of prediction
  parameters?: Record<string, any>;  // Additional parameters
}
```

---

## Troubleshooting

### Chat not loading

**Problem:** Chat messages not appearing
**Solution:** Ensure AIProvider wraps the component and company is selected

### Insights showing old data

**Problem:** Insights not refreshing
**Solution:** Call `fetchInsights()` or click refresh button. Check cache TTL settings.

### Predictions chart empty

**Problem:** Chart shows no data
**Solution:** Verify company has historical data for predictions. Check date range.

### Styling conflicts

**Problem:** Components look broken
**Solution:** Check that SCSS modules are being loaded. Verify no global CSS conflicts.

### TypeScript errors

**Problem:** Type errors in components
**Solution:** Ensure `@/lib/ai/types` is properly imported. Run `npm run build` to check.

---

## Migration Guide

### From Custom Implementation

If you have existing AI UI, migrate to these components:

1. **Replace custom state management** with AIProvider
2. **Replace fetch calls** with useAI hooks
3. **Replace UI elements** with provided components
4. **Update styling** to use SCSS modules
5. **Test thoroughly** in development

### From v1.0 to v2.0 (Future)

Breaking changes will be documented here when released.

---

## Support & Resources

- **Main Documentation:** `/docs/GEMINI_AI_INTEGRATION.md`
- **Type Definitions:** `/src/lib/ai/types.ts`
- **Example Page:** `/src/app/ai-assistant/page.tsx`
- **Component Source:** `/src/components/AI/`

---

**End of UI Components Guide**
