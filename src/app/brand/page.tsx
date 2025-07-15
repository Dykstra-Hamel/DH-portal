'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Brand from '@/components/Brand/Brand';

interface BrandData {
  id: string;
  company_id: string;
  brand_guidelines?: string;
  brand_strategy?: string;
  personality?: string;
  logo_url?: string;
  logo_description?: string;
  primary_color_hex?: string;
  primary_color_cmyk?: string;
  primary_color_pantone?: string;
  secondary_color_hex?: string;
  secondary_color_cmyk?: string;
  secondary_color_pantone?: string;
  alternative_colors?: Array<{
    hex: string;
    cmyk: string;
    pantone: string;
    name?: string;
  }>;
  font_primary_name?: string;
  font_primary_example?: string;
  font_primary_url?: string;
  font_secondary_name?: string;
  font_secondary_example?: string;
  font_secondary_url?: string;
  font_tertiary_name?: string;
  font_tertiary_example?: string;
  font_tertiary_url?: string;
  photography_description?: string;
  photography_images?: string[];
}

interface Company {
  id: string;
  name: string;
}

interface UserCompany {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
  is_primary: boolean;
  companies: Company;
}

export default function BrandPage() {
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [userCompanies, setUserCompanies] = useState<UserCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserCompaniesAndBrand = async () => {
      try {
        // Check if user is authenticated
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/');
          return;
        }

        // Get user profile to check if they're an admin
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          setError('Error loading user profile');
          setLoading(false);
          return;
        }

        const isAdmin = profileData?.role === 'admin';

        let companiesData: UserCompany[] = [];

        if (isAdmin) {
          // Admin users can see all companies
          const { data: allCompaniesData, error: allCompaniesError } = await supabase
            .from('companies')
            .select('id, name')
            .order('name');

          if (allCompaniesError) {
            console.error('Error fetching all companies:', allCompaniesError);
            setError('Error loading companies');
            setLoading(false);
            return;
          }

          // Convert to UserCompany format for consistency
          companiesData = allCompaniesData?.map(company => ({
            id: `admin-${company.id}`,
            user_id: session.user.id,
            company_id: company.id,
            role: 'admin',
            is_primary: false,
            companies: company
          })) || [];

        } else {
          // Regular users see only their associated companies
          const { data: userCompaniesData, error: companiesError } = await supabase
            .from('user_companies')
            .select(`
              *,
              companies (
                id,
                name
              )
            `)
            .eq('user_id', session.user.id);

          if (companiesError) {
            console.error('Error fetching user companies:', companiesError);
            setError('Error loading companies');
            setLoading(false);
            return;
          }

          companiesData = userCompaniesData || [];
        }

        if (companiesData.length === 0) {
          setError('No companies found for this user');
          setLoading(false);
          return;
        }

        setUserCompanies(companiesData);

        // Set default company (primary first for regular users, first alphabetically for admins)
        const primaryCompany = companiesData.find(uc => uc.is_primary);
        const defaultCompany = primaryCompany ? primaryCompany.companies : companiesData[0].companies;
        setSelectedCompany(defaultCompany);

        // Fetch brand data for default company
        await fetchBrandData(defaultCompany.id);

      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserCompaniesAndBrand();
  }, [router]);

  const fetchBrandData = async (companyId: string) => {
    try {
      const supabase = createClient()
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

  const handleCompanyChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const companyId = event.target.value;
    const company = userCompanies.find(uc => uc.companies.id === companyId)?.companies;
    
    if (company) {
      setSelectedCompany(company);
      setError(null);
      await fetchBrandData(company.id);
    }
  };

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>;
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
      {/* Company Selector */}
      {userCompanies.length > 1 && (
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <label htmlFor="company-select" style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151'
            }}>
              Select Company:
            </label>
            <select
              id="company-select"
              value={selectedCompany.id}
              onChange={handleCompanyChange}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: 'white',
                color: '#374151',
                minWidth: '200px'
              }}
            >
              {userCompanies.map(uc => (
                <option key={uc.companies.id} value={uc.companies.id}>
                  {uc.companies.name} {uc.is_primary ? '(Primary)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Brand Content */}
      {!brandData ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <h1>Brand Guidelines</h1>
          <p>No brand guidelines have been created for {selectedCompany.name} yet.</p>
          <p>Contact an administrator to set up brand guidelines.</p>
        </div>
      ) : (
        <Brand brandData={brandData} companyName={selectedCompany.name} />
      )}
    </div>
  );
}