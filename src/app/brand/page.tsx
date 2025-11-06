'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import Brand from '@/components/Brand/Brand';
import { BrandData } from '@/types/branding';

export default function BrandPage() {
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Use global company context
  const { selectedCompany, isAdmin, isLoading: contextLoading } = useCompany();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // Fetch brand data when company changes
  useEffect(() => {
    if (!contextLoading && selectedCompany?.id) {
      fetchBrandData(selectedCompany.id);
    }
  }, [selectedCompany?.id, contextLoading]);

  const fetchBrandData = async (companyId: string) => {
    try {
      const supabase = createClient();
      const { data: brandResult, error: brandError } = await supabase
        .from('brands')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (brandError && brandError.code !== 'PGRST116') {
        console.error('Error fetching brand data:', brandError);
        setError('Error loading brand data');
      } else {
        setBrandData(brandResult);
      }
    } catch (err) {
      console.error('Error fetching brand data:', err);
      setError('Error loading brand data');
    }
  };

  if (loading || contextLoading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!selectedCompany) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <h1>No Company Selected</h1>
        <p>Unable to load company information.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Brand Content */}
      {!brandData ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <h1>Brand Guidelines</h1>
          <p>
            No brand guidelines have been created for {selectedCompany?.name || 'this company'}{' '}
            yet.
          </p>
          <p>Contact an administrator to set up brand guidelines.</p>
        </div>
      ) : (
        <Brand brandData={brandData} companyName={selectedCompany?.name || 'Company'} />
      )}
    </div>
  );
}
