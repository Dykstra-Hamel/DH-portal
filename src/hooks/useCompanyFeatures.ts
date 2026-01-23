import { useState, useEffect, useCallback } from 'react';
import { CompanyFeature, CompanyFeatureRecord } from '@/types/company';
import { createClient } from '@/lib/supabase/client';

export function useCompanyFeatures(companyId: string | null | undefined) {
  const [features, setFeatures] = useState<CompanyFeatureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get authentication headers
  const getAuthHeaders = async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`,
      }),
    };
  };

  const fetchFeatures = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/companies/${companyId}/features`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setFeatures(data.features || []);
      } else {
        setError('Failed to fetch company features');
      }
    } catch (err) {
      setError('Error fetching company features');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const hasFeature = useCallback(
    (feature: CompanyFeature): boolean => {
      return features.some(f => f.feature === feature && f.enabled);
    },
    [features]
  );

  const enableFeature = useCallback(
    async (feature: CompanyFeature) => {
      if (!companyId) return false;

      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/companies/${companyId}/features`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ feature }),
        });

        if (response.ok) {
          await fetchFeatures();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [companyId, fetchFeatures]
  );

  const disableFeature = useCallback(
    async (feature: CompanyFeature) => {
      if (!companyId) return false;

      try {
        const headers = await getAuthHeaders();
        const response = await fetch(
          `/api/companies/${companyId}/features/${feature}`,
          {
            method: 'DELETE',
            headers,
          }
        );

        if (response.ok) {
          await fetchFeatures();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [companyId, fetchFeatures]
  );

  return {
    features,
    loading,
    error,
    hasFeature,
    enableFeature,
    disableFeature,
    refetch: fetchFeatures,
  };
}
