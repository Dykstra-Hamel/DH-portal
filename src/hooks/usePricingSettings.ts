import { useState, useEffect } from 'react';
import { CompanyPricingSettings } from '@/types/pricing';

interface UsePricingSettingsReturn {
  settings: CompanyPricingSettings | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch company pricing settings
 * Returns interval configuration for home and yard sizes
 */
export function usePricingSettings(
  companyId: string | undefined
): UsePricingSettingsReturn {
  const [settings, setSettings] = useState<CompanyPricingSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    if (!companyId) {
      setSettings(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/companies/${companyId}/pricing-settings`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch pricing settings');
      }

      const data = await response.json();
      setSettings(data.data);
    } catch (err) {
      console.error('Error fetching pricing settings:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSettings(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [companyId]);

  return {
    settings,
    isLoading,
    error,
    refetch: fetchSettings,
  };
}