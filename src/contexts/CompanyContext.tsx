'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { adminAPI } from '@/lib/api-client';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';

export interface Company {
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

interface CompanyContextType {
  selectedCompany: Company | null;
  availableCompanies: Company[];
  isAdmin: boolean;
  isLoading: boolean;
  setSelectedCompany: (company: Company | null) => void;
  refreshCompanies: () => Promise<void>;
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
  }, []);

  const loadAllCompanies = async () => {
    try {
      const companies = await adminAPI.getCompanies();
      setAvailableCompanies(companies || []);
      
      // For admins, default to "All Companies" (null)
      const storedCompanyId = localStorage.getItem(SELECTED_COMPANY_STORAGE_KEY);
      if (storedCompanyId && companies) {
        const storedCompany = companies.find((c: Company) => c.id === storedCompanyId);
        if (storedCompany) {
          setSelectedCompanyState(storedCompany);
        }
      }
      // If no stored selection or company not found, stay with null (All Companies)
    } catch (error) {
      console.error('Error loading all companies:', error);
      setAvailableCompanies([]);
    }
  };

  const loadUserCompanies = async (userId: string) => {
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
      setAvailableCompanies(companies);

      // Set default selected company
      const storedCompanyId = localStorage.getItem(SELECTED_COMPANY_STORAGE_KEY);
      let defaultCompany: Company | null = null;

      if (storedCompanyId) {
        defaultCompany = companies.find(c => c.id === storedCompanyId) || null;
      }

      // If no stored selection or company not found, use primary company
      if (!defaultCompany) {
        const primaryUserCompany = companiesData.find((uc: UserCompany) => uc.is_primary);
        defaultCompany = primaryUserCompany ? primaryUserCompany.companies : companies[0] || null;
      }

      setSelectedCompanyState(defaultCompany);
    } catch (error) {
      console.error('Error loading user companies:', error);
      setAvailableCompanies([]);
    }
  };

  const setSelectedCompany = (company: Company | null) => {
    setSelectedCompanyState(company);
    
    // Store selection in localStorage
    if (company) {
      localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, company.id);
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

  // Listen for auth changes
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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