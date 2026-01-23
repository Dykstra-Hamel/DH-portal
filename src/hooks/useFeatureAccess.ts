import { useCompany } from '@/contexts/CompanyContext';
import { useUser } from '@/hooks/useUser';
import { useCompanyFeatures } from '@/hooks/useCompanyFeatures';
import { CompanyFeature } from '@/types/company';

export function useFeatureAccess(feature: CompanyFeature) {
  const { profile } = useUser();
  const { selectedCompany } = useCompany();
  const { hasFeature, loading } = useCompanyFeatures(selectedCompany?.id);

  const isAdmin = profile?.role === 'admin';
  const hasAccess = isAdmin || hasFeature(feature);

  // Admins don't need to wait for feature loading - they always have access
  const effectiveLoading = isAdmin ? false : loading;

  return {
    hasAccess,
    loading: effectiveLoading,
    isAdmin,
  };
}
