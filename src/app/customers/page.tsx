'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import CustomersList from '@/components/Customers/CustomersList/CustomersList';
import SearchByLetter from '@/components/Customers/SearchByLetter/SearchByLetter';
import { adminAPI } from '@/lib/api-client';
import { Customer, CustomerStatus } from '@/types/customer';
import { SortDirection } from '@/types/common';
import { useCompany } from '@/contexts/CompanyContext';
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
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [letterCounts, setLetterCounts] = useState<Record<string, number>>({});
  const router = useRouter();

  // Use global company context
  const { selectedCompany, isAdmin, isLoading: contextLoading } = useCompany();

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

  const fetchCustomers = useCallback(async (page: number = 1, isLoadMore: boolean = false) => {
    if (!selectedCompany && !isAdmin) return;

    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setCustomersLoading(true);
      }

      const filters = {
        companyId: selectedCompany?.id,
        search: searchQuery,
        sortBy: sortKey,
        sortOrder: sortDirection,
        startsWith: selectedLetter,
      };

      let allCustomers: Customer[] = [];
      if (isAdmin) {
        // Admin users use admin API
        allCustomers = await adminAPI.getCustomers(filters);
      } else if (selectedCompany) {
        // Regular users use user-specific API and must have a selected company
        allCustomers = await adminAPI.getUserCustomers({
          ...filters,
          companyId: selectedCompany.id,
        });
      }

      // Client-side pagination for infinite scroll
      const limit = 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCustomers = (allCustomers || []).slice(startIndex, endIndex);

      if (isLoadMore) {
        setCustomers(prev => [...prev, ...paginatedCustomers]);
      } else {
        setCustomers(paginatedCustomers);
      }

      // Check if there are more customers to load
      setHasMore(endIndex < (allCustomers || []).length);
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
  }, [selectedCompany, isAdmin, searchQuery, sortKey, sortDirection, selectedLetter]);

  // Fetch letter counts for the alphabet filter
  const fetchLetterCounts = useCallback(async () => {
    if (!selectedCompany && !isAdmin) return;

    try {
      const filters = {
        companyId: selectedCompany?.id,
      };

      let allCustomers: Customer[] = [];
      if (isAdmin) {
        allCustomers = await adminAPI.getCustomers(filters);
      } else if (selectedCompany) {
        allCustomers = await adminAPI.getUserCustomers({
          ...filters,
          companyId: selectedCompany.id,
        });
      }

      // Count customers by first letter of last name
      const counts: Record<string, number> = {};
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(letter => {
        counts[letter] = 0;
      });

      allCustomers.forEach(customer => {
        const firstLetter = customer.last_name?.charAt(0).toUpperCase();
        if (firstLetter && counts[firstLetter] !== undefined) {
          counts[firstLetter]++;
        }
      });

      setLetterCounts(counts);
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

  // Fetch customers when filters change
  useEffect(() => {
    if (!contextLoading && (selectedCompany || isAdmin)) {
      setCurrentPage(1);
      setCustomers([]);
      setHasMore(true);
      fetchCustomers(1);
    }
  }, [contextLoading, selectedCompany, isAdmin, searchQuery, sortKey, sortDirection, selectedLetter, fetchCustomers]);

  // Infinite scroll handler
  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchCustomers(currentPage + 1, true);
    }
  };

  const handleCustomerClick = (customer: Customer) => {
    router.push(`/customers/${customer.id}`);
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
        />
      )}
    </div>
  );
}
