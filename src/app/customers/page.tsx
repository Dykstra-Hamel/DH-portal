'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import CustomersList from '@/components/Customers/CustomersList/CustomersList';
import SearchByLetter from '@/components/Customers/SearchByLetter/SearchByLetter';
import { AddCustomerModal } from '@/components/Customers/AddCustomerModal/AddCustomerModal';
import { adminAPI } from '@/lib/api-client';
import { Customer } from '@/types/customer';
import { SortDirection } from '@/types/common';
import { useCompany } from '@/contexts/CompanyContext';
import { usePageActions } from '@/contexts/PageActionsContext';
import styles from './page.module.scss';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function CustomersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [letterCounts, setLetterCounts] = useState<Record<string, number>>({});
  const [tabCounts, setTabCounts] = useState<{ all: number; active: number; inactive: number; archived: number }>({ all: 0, active: 0, inactive: 0, archived: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const router = useRouter();

  // Use global company context
  const { selectedCompany, isAdmin, isLoading: contextLoading } = useCompany();

  // Use page actions for global header
  const { registerPageAction, unregisterPageAction } = usePageActions();

  useEffect(() => {
    const supabase = createClient();

    const getSessionAndData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profileError && profileData) {
        setProfile(profileData);
      }

      setLoading(false);
    };

    getSessionAndData();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session?.user) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Debounce search query to avoid firing on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchCustomers = useCallback(async (page: number = 1, isLoadMore: boolean = false) => {
    if (!selectedCompany && !isAdmin) return;

    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setCustomersLoading(true);
      }

      const PAGE_SIZE = 50;
      const currentOffset = (page - 1) * PAGE_SIZE;

      const filters = {
        companyId: selectedCompany?.id,
        search: debouncedSearch,
        sortBy: sortKey,
        sortOrder: sortDirection,
        startsWith: selectedLetter,
        status: activeTab !== 'all' ? activeTab : undefined,
        limit: PAGE_SIZE,
        offset: currentOffset,
      };

      let response: { customers: Customer[]; counts: { all: number; active: number; inactive: number; archived: number }; total: number };
      if (isAdmin) {
        // Admin users use admin API
        response = await adminAPI.getCustomers(filters);
      } else if (selectedCompany) {
        // Regular users use user-specific API and must have a selected company
        response = await adminAPI.getUserCustomers({
          ...filters,
          companyId: selectedCompany.id,
        });
      } else {
        response = { customers: [], counts: { all: 0, active: 0, inactive: 0, archived: 0 }, total: 0 };
      }

      const pageCustomers = response.customers || [];
      const counts = response.counts || { all: 0, active: 0, inactive: 0, archived: 0 };
      const total = response.total || 0;

      // Update tab counts
      setTabCounts(counts);

      if (isLoadMore) {
        setCustomers(prev => [...prev, ...pageCustomers]);
      } else {
        setCustomers(pageCustomers);
      }

      // Check if there are more customers to load using server total
      setHasMore(currentOffset + pageCustomers.length < total);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching customers:', error);
      if (!isLoadMore) {
        setCustomers([]);
      }
    } finally {
      setCustomersLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCompany, isAdmin, debouncedSearch, activeTab, sortKey, sortDirection, selectedLetter]);

  // Fetch letter counts for the alphabet filter using lightweight server-side mode
  const fetchLetterCounts = useCallback(async () => {
    if (!selectedCompany && !isAdmin) return;

    try {
      let response: { letterCounts?: Record<string, number> };
      if (isAdmin) {
        response = await adminAPI.getCustomers({
          companyId: selectedCompany?.id,
          mode: 'letterCounts',
        });
      } else if (selectedCompany) {
        response = await adminAPI.getUserCustomers({
          companyId: selectedCompany.id,
          mode: 'letterCounts',
        });
      } else {
        return;
      }

      setLetterCounts(response.letterCounts || {});
    } catch (error) {
      console.error('Error fetching letter counts:', error);
    }
  }, [selectedCompany, isAdmin]);

  // Fetch letter counts when company changes
  useEffect(() => {
    if (!contextLoading && (selectedCompany || isAdmin)) {
      fetchLetterCounts();
    }
  }, [contextLoading, selectedCompany, isAdmin, fetchLetterCounts]);

  // Register the Add Customer button action
  useEffect(() => {
    if (selectedCompany) {
      registerPageAction('add', () => setShowAddModal(true));
    }

    // Cleanup: remove the action when component unmounts or company changes
    return () => {
      unregisterPageAction('add');
    };
  }, [selectedCompany, registerPageAction, unregisterPageAction]);

  // Fetch customers when filters change
  useEffect(() => {
    if (!contextLoading && (selectedCompany || isAdmin)) {
      setCurrentPage(1);
      setCustomers([]);
      setHasMore(true);
      fetchCustomers(1);
    }
  }, [contextLoading, selectedCompany, isAdmin, debouncedSearch, activeTab, sortKey, sortDirection, selectedLetter, fetchCustomers]);

  // Infinite scroll handler
  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchCustomers(currentPage + 1, true);
    }
  };

  const handleCustomerClick = (customer: Customer) => {
    router.push(`/customers/${customer.id}`);
  };

  const handleCustomerCreated = () => {
    // Refresh the customer list
    setCurrentPage(1);
    setCustomers([]);
    setHasMore(true);
    fetchCustomers(1);
    fetchLetterCounts();
  };

  if (loading || contextLoading) {
    return <div>Loading...</div>;
  }

  if (!user || !profile) {
    return <div>Redirecting...</div>;
  }

  if (!selectedCompany && !isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Customers</h1>
        </div>
        <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}>
          Please select a company to view customers.
        </div>
      </div>
    );
  }


  return (
    <div style={{ width: '100%' }}>
      {/* Search By Letter Component */}
      {(selectedCompany || isAdmin) && (
        <SearchByLetter
          letterCounts={letterCounts}
          selectedLetter={selectedLetter}
          onLetterSelect={setSelectedLetter}
        />
      )}

      {selectedCompany && (
        <CustomersList
          customers={customers}
          loading={customersLoading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          loadingMore={loadingMore}
          onCustomerClick={handleCustomerClick}
          showCompanyColumn={isAdmin && !selectedCompany}
          tabCounts={tabCounts}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      {!selectedCompany && !isAdmin && (
        <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}>
          Please select a company to view customers.
        </div>
      )}

      {isAdmin && !selectedCompany && (
        <CustomersList
          customers={customers}
          loading={customersLoading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          loadingMore={loadingMore}
          onCustomerClick={handleCustomerClick}
          showCompanyColumn={true}
          tabCounts={tabCounts}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      {/* Add Customer Modal */}
      {selectedCompany && (
        <AddCustomerModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          companyId={selectedCompany.id}
          onSuccess={handleCustomerCreated}
        />
      )}
    </div>
  );
}
