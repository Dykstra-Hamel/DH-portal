'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { adminAPI } from '@/lib/api-client';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';
import { BrandData } from '@/types/branding';
import { getCached, setCached, CACHE_KEYS } from '@/lib/cache-utils';

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
  isHydrating: boolean;
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
  const [isHydrating, setIsHydrating] = useState(true); // True during initial cache hydration
  const [user, setUser] = useState<any>(null);

  // Load branding data for a specific company (using public endpoint)
  const loadCompanyBranding = useCallback(async (companyId: string): Promise<BrandData | null> => {
    try {
      // Check cache first
      const cacheKey = CACHE_KEYS.COMPANY_BRANDING(companyId);
      const cached = getCached<BrandData>(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch from API if not cached
      const response = await fetch(`/api/companies/${companyId}/login-branding`);
      if (!response.ok) {
        throw new Error(`Failed to fetch branding: ${response.statusText}`);
      }
      const data = await response.json();
      const branding = data?.branding || null;

      // Cache the result
      if (branding) {
        setCached(cacheKey, branding);
      }

      return branding;
    } catch (error) {
      console.error(`Error loading branding for company ${companyId}:`, error);
      return null;
    }
  }, []);

  // Lazy load branding only for a specific company (not all at once)
  const loadBrandingForCompany = useCallback(async (company: Company): Promise<Company> => {
    // Only load branding if not already loaded
    if (company.branding !== undefined) {
      return company;
    }

    const branding = await loadCompanyBranding(company.id);
    return {
      ...company,
      branding,
    };
  }, [loadCompanyBranding]);

  const loadAllCompanies = useCallback(async (useCache: boolean = true) => {
    try {
      let companies: Company[] = [];

      // Check cache first if useCache is true
      if (useCache) {
        const cached = getCached<Company[]>(CACHE_KEYS.COMPANIES_LIST);
        if (cached) {
          companies = cached;
        }
      }

      // If no cached companies, fetch from API
      if (companies.length === 0) {
        companies = await adminAPI.getCompanies();

        // Cache the companies list
        if (companies && companies.length > 0) {
          setCached(CACHE_KEYS.COMPANIES_LIST, companies);
        }
      }

      if (companies && companies.length > 0) {
        // Don't load branding for all companies upfront - save network requests
        setAvailableCompanies(companies);

        // Set default selected company for admins (always ensure a company is selected)
        const storedCompanyId = localStorage.getItem(SELECTED_COMPANY_STORAGE_KEY);
        let defaultCompany: Company | null = null;

        if (storedCompanyId) {
          defaultCompany = companies.find((c: Company) => c.id === storedCompanyId) || null;
        }

        // Always ensure admin has a company selected - use first company if no stored selection
        if (!defaultCompany) {
          defaultCompany = companies[0];
        }

        // Lazy load branding only for the selected company
        if (defaultCompany) {
          const companyWithBranding = await loadBrandingForCompany(defaultCompany);
          setSelectedCompanyState(companyWithBranding);

          // Also update it in the availableCompanies list
          setAvailableCompanies(prev =>
            prev.map(c => c.id === companyWithBranding.id ? companyWithBranding : c)
          );

          localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, companyWithBranding.id);
        }
      } else {
        setAvailableCompanies([]);
      }
    } catch (error) {
      console.error('Error loading all companies:', error);
      setAvailableCompanies([]);
    }
  }, [loadBrandingForCompany]);

  const loadUserCompanies = useCallback(async (userId: string, useCache: boolean = true) => {
    try {
      let companies: Company[] = [];

      // Check cache first if useCache is true
      if (useCache) {
        const cached = getCached<Company[]>(CACHE_KEYS.COMPANIES_LIST);
        if (cached && cached.length > 0) {
          companies = cached;
        }
      }

      // If no cached companies, fetch from Supabase
      if (companies.length === 0) {
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

        companies = companiesData.map((uc: UserCompany) => uc.companies);

        // Cache the companies list
        if (companies.length > 0) {
          setCached(CACHE_KEYS.COMPANIES_LIST, companies);
        }
      }

      // Don't load branding for all companies upfront - save network requests
      setAvailableCompanies(companies);

      // Set default selected company
      const storedCompanyId = localStorage.getItem(SELECTED_COMPANY_STORAGE_KEY);
      let defaultCompany: Company | null = null;

      if (storedCompanyId) {
        defaultCompany = companies.find(c => c.id === storedCompanyId) || null;
      }

      // If no stored selection or company not found, use first company
      if (!defaultCompany) {
        defaultCompany = companies[0] || null;
      }

      // Lazy load branding only for the selected company
      if (defaultCompany) {
        const companyWithBranding = await loadBrandingForCompany(defaultCompany);
        setSelectedCompanyState(companyWithBranding);

        // Also update it in the availableCompanies list
        setAvailableCompanies(prev =>
          prev.map(c => c.id === companyWithBranding.id ? companyWithBranding : c)
        );

        localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, companyWithBranding.id);
      }
    } catch (error) {
      console.error('Error loading user companies:', error);
      setAvailableCompanies([]);
    }
  }, [loadBrandingForCompany]);

  // Initialize user and companies with cache-first approach
  useEffect(() => {
    const initializeCompanies = async () => {
      const supabase = createClient();

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          setIsLoading(false);
          setIsHydrating(false);
          return;
        }

        setUser(session.user);

        // Try to hydrate from cache first for instant load
        const cachedProfile = getCached<any>(CACHE_KEYS.USER_PROFILE);
        const cachedCompanies = getCached<Company[]>(CACHE_KEYS.COMPANIES_LIST);

        if (cachedProfile && cachedCompanies && cachedCompanies.length > 0) {
          // Hydrate immediately from cache
          const userIsAdmin = isAuthorizedAdminSync(cachedProfile);
          setIsAdmin(userIsAdmin);
          setAvailableCompanies(cachedCompanies);

          // Set selected company from cache if available
          const storedCompanyId = localStorage.getItem(SELECTED_COMPANY_STORAGE_KEY);
          if (storedCompanyId) {
            const company = cachedCompanies.find(c => c.id === storedCompanyId);
            if (company) {
              // Load branding from cache or fetch
              const companyWithBranding = await loadBrandingForCompany(company);
              setSelectedCompanyState(companyWithBranding);
            }
          }

          // Hydration complete - set loading to false so UI can render
          setIsLoading(false);
          setIsHydrating(false);

          // Revalidate in background (don't await)
          Promise.resolve().then(async () => {
            const { data: freshProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (freshProfile) {
              setCached(CACHE_KEYS.USER_PROFILE, freshProfile);
              const freshIsAdmin = isAuthorizedAdminSync(freshProfile);

              // Only update isAdmin if it actually changed to prevent unnecessary re-renders
              setIsAdmin(prevIsAdmin => {
                if (prevIsAdmin !== freshIsAdmin) {
                  return freshIsAdmin;
                }
                return prevIsAdmin;
              });

              // DON'T refresh companies in background - they're already loaded from cache
              // Calling loadAllCompanies(false) here causes selectedCompany object reference to change,
              // which triggers all consuming components to re-render and appears as a "page reload"
              // The cache TTL (5 minutes) ensures data stays reasonably fresh
            }
          }).catch(err => console.error('Background revalidation error:', err));

          return; // Early return - already hydrated from cache
        }

        // No cache available - fetch fresh data with parallelization
        const [profileResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
        ]);

        const { data: profile, error: profileError } = profileResult;

        if (profileError || !profile) {
          console.error('Error fetching profile:', profileError);
          setIsLoading(false);
          setIsHydrating(false);
          return;
        }

        // Cache the profile
        setCached(CACHE_KEYS.USER_PROFILE, profile);

        const userIsAdmin = isAuthorizedAdminSync(profile);
        setIsAdmin(userIsAdmin);

        if (userIsAdmin) {
          // Admin users get all companies
          await loadAllCompanies(true);
        } else {
          // Regular users get their assigned companies
          await loadUserCompanies(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing companies:', error);
      } finally {
        setIsLoading(false);
        setIsHydrating(false);
      }
    };

    initializeCompanies();
  }, [loadAllCompanies, loadUserCompanies, loadBrandingForCompany]);

  const setSelectedCompany = async (company: Company | null) => {
    // Prevent null selection - if null is passed, use first available company
    const companyToSet = company || (availableCompanies.length > 0 ? availableCompanies[0] : null);

    if (!companyToSet) {
      setSelectedCompanyState(null);
      localStorage.removeItem(SELECTED_COMPANY_STORAGE_KEY);
      return;
    }

    // Lazy load branding if not already loaded
    const companyWithBranding = await loadBrandingForCompany(companyToSet);
    setSelectedCompanyState(companyWithBranding);

    // Update the company in availableCompanies list with loaded branding
    setAvailableCompanies(prev =>
      prev.map(c => c.id === companyWithBranding.id ? companyWithBranding : c)
    );

    // Store selection in localStorage
    localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, companyWithBranding.id);
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
      async (event, session) => {
        // Handle login - only for email-based auth (password/magic link)
        // OAuth handles this during initial mount from cache
        const authProvider = session?.user?.app_metadata?.provider;
        if (event === 'SIGNED_IN' && session?.user && authProvider === 'email') {
          setUser(session.user);
          setIsLoading(true);

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const userIsAdmin = isAuthorizedAdminSync(profile);
            setIsAdmin(userIsAdmin);

            if (userIsAdmin) {
              await loadAllCompanies(false);
            } else {
              await loadUserCompanies(session.user.id, false);
            }
          }

          setIsLoading(false);
        }

        // Handle logout
        if (!session?.user) {
          setUser(null);
          setSelectedCompanyState(null);
          setAvailableCompanies([]);
          setIsAdmin(false);
          setIsLoading(false);
          // Don't remove selected company from localStorage on logout
          // This allows users to return to the same company when they log back in
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadAllCompanies, loadUserCompanies]);

  // Memoize context value to prevent unnecessary re-renders of consuming components
  const contextValue = useMemo(
    () => ({
      selectedCompany,
      availableCompanies,
      isAdmin,
      isLoading,
      isHydrating,
      setSelectedCompany,
      refreshCompanies,
      refreshBranding,
    }),
    [selectedCompany, availableCompanies, isAdmin, isLoading, isHydrating, setSelectedCompany, refreshCompanies, refreshBranding]
  );

  return (
    <CompanyContext.Provider value={contextValue}>
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