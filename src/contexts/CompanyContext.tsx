'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { adminAPI } from '@/lib/api-client';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';
import { BrandData } from '@/types/branding';

export interface Company {
  id: string;
  name: string;
  branding?: BrandData | null;
}

interface UserCompany {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
  is_primary: boolean;
  companies: Company;
}

interface CompanyContextType {
  selectedCompany: Company | null;
  availableCompanies: Company[];
  isAdmin: boolean;
  isLoading: boolean;
  setSelectedCompany: (company: Company | null) => void;
  refreshCompanies: () => Promise<void>;
  refreshBranding: (companyId?: string) => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

interface CompanyProviderProps {
  children: ReactNode;
}

const SELECTED_COMPANY_STORAGE_KEY = 'selectedCompanyId';

export function CompanyProvider({ children }: CompanyProviderProps) {
  const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Load branding data for a specific company (using public endpoint)
  const loadCompanyBranding = useCallback(async (companyId: string): Promise<BrandData | null> => {
    try {
      const response = await fetch(`/api/companies/${companyId}/login-branding`);
      if (!response.ok) {
        throw new Error(`Failed to fetch branding: ${response.statusText}`);
      }
      const data = await response.json();
      return data?.branding || null;
    } catch (error) {
      console.error(`Error loading branding for company ${companyId}:`, error);
      return null;
    }
  }, []);

  // Load branding for multiple companies
  const loadBrandingForCompanies = useCallback(async (companies: Company[]): Promise<Company[]> => {
    const companiesWithBranding = await Promise.all(
      companies.map(async (company) => {
        const branding = await loadCompanyBranding(company.id);
        return {
          ...company,
          branding,
        };
      })
    );
    return companiesWithBranding;
  }, [loadCompanyBranding]);

  const loadAllCompanies = useCallback(async () => {
    try {
      const companies = await adminAPI.getCompanies();
      
      if (companies && companies.length > 0) {
        // Load branding for all companies
        const companiesWithBranding = await loadBrandingForCompanies(companies);
        setAvailableCompanies(companiesWithBranding);
        
        // Set default selected company for admins (always ensure a company is selected)
        const storedCompanyId = localStorage.getItem(SELECTED_COMPANY_STORAGE_KEY);
        let defaultCompany: Company | null = null;

        if (storedCompanyId) {
          defaultCompany = companiesWithBranding.find((c: Company) => c.id === storedCompanyId) || null;
        }

        // Always ensure admin has a company selected - use first company if no stored selection
        if (!defaultCompany) {
          defaultCompany = companiesWithBranding[0];
        }

        setSelectedCompanyState(defaultCompany);

        // Store the selected company in localStorage
        if (defaultCompany) {
          localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, defaultCompany.id);
        }
      } else {
        setAvailableCompanies([]);
      }
    } catch (error) {
      console.error('Error loading all companies:', error);
      setAvailableCompanies([]);
    }
  }, [loadBrandingForCompanies]);

  const loadUserCompanies = useCallback(async (userId: string) => {
    try {
      const supabase = createClient();
      const { data: companiesData, error } = await supabase
        .from('user_companies')
        .select(`
          *,
          companies (
            id,
            name
          )
        `)
        .eq('user_id', userId);

      if (error || !companiesData) {
        console.error('Error loading user companies:', error);
        setAvailableCompanies([]);
        return;
      }

      const companies = companiesData.map((uc: UserCompany) => uc.companies);
      
      // Load branding for all companies
      const companiesWithBranding = await loadBrandingForCompanies(companies);
      setAvailableCompanies(companiesWithBranding);

      // Set default selected company
      const storedCompanyId = localStorage.getItem(SELECTED_COMPANY_STORAGE_KEY);
      let defaultCompany: Company | null = null;

      if (storedCompanyId) {
        defaultCompany = companiesWithBranding.find(c => c.id === storedCompanyId) || null;
      }

      // If no stored selection or company not found, use primary company
      if (!defaultCompany) {
        const primaryUserCompany = companiesData.find((uc: UserCompany) => uc.is_primary);
        if (primaryUserCompany) {
          defaultCompany = companiesWithBranding.find(c => c.id === primaryUserCompany.companies.id) || companiesWithBranding[0] || null;
        } else {
          defaultCompany = companiesWithBranding[0] || null;
        }
      }

      setSelectedCompanyState(defaultCompany);

      // Store the selected company in localStorage
      if (defaultCompany) {
        localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, defaultCompany.id);
      }
    } catch (error) {
      console.error('Error loading user companies:', error);
      setAvailableCompanies([]);
    }
  }, [loadBrandingForCompanies]);

  // Initialize user and companies
  useEffect(() => {
    const initializeCompanies = async () => {
      const supabase = createClient();
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setIsLoading(false);
          return;
        }

        setUser(session.user);

        // Get user profile to check admin status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profile) {
          console.error('Error fetching profile:', profileError);
          setIsLoading(false);
          return;
        }

        const userIsAdmin = isAuthorizedAdminSync(profile);
        setIsAdmin(userIsAdmin);

        if (userIsAdmin) {
          // Admin users get all companies
          await loadAllCompanies();
        } else {
          // Regular users get their assigned companies
          await loadUserCompanies(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing companies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeCompanies();
  }, [loadAllCompanies, loadUserCompanies]);

  const setSelectedCompany = (company: Company | null) => {
    // Prevent null selection - if null is passed, use first available company
    const companyToSet = company || (availableCompanies.length > 0 ? availableCompanies[0] : null);
    
    setSelectedCompanyState(companyToSet);
    
    // Store selection in localStorage
    if (companyToSet) {
      localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, companyToSet.id);
    } else {
      localStorage.removeItem(SELECTED_COMPANY_STORAGE_KEY);
    }
  };

  const refreshCompanies = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      if (isAdmin) {
        await loadAllCompanies();
      } else {
        await loadUserCompanies(user.id);
      }
    } catch (error) {
      console.error('Error refreshing companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBranding = async (companyId?: string) => {
    const targetCompanyId = companyId || selectedCompany?.id;
    if (!targetCompanyId) return;

    try {
      const branding = await loadCompanyBranding(targetCompanyId);
      
      // Update the selected company if it matches
      if (selectedCompany && selectedCompany.id === targetCompanyId) {
        setSelectedCompanyState({
          ...selectedCompany,
          branding,
        });
      }

      // Update in available companies list
      setAvailableCompanies(prev => 
        prev.map(company => 
          company.id === targetCompanyId 
            ? { ...company, branding }
            : company
        )
      );
    } catch (error) {
      console.error('Error refreshing branding:', error);
    }
  };

  // Listen for auth changes
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        if (!session?.user) {
          setUser(null);
          setSelectedCompanyState(null);
          setAvailableCompanies([]);
          setIsAdmin(false);
          setIsLoading(false);
          localStorage.removeItem(SELECTED_COMPANY_STORAGE_KEY);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <CompanyContext.Provider
      value={{
        selectedCompany,
        availableCompanies,
        isAdmin,
        isLoading,
        setSelectedCompany,
        refreshCompanies,
        refreshBranding,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}