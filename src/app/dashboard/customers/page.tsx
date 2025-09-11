'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import CustomersTable from '@/components/Customers/CustomersTable/CustomersTable';
import CustomersTabs from '@/components/Customers/CustomersTabs/CustomersTabs';
import SearchBar from '@/components/Common/SearchBar/SearchBar';
import { adminAPI } from '@/lib/api-client';
import { Customer, CustomerStatus } from '@/types/customer';
import { SortDirection } from '@/types/common';
import { useCompany } from '@/contexts/CompanyContext';
import { useDateFilter } from '@/contexts/DateFilterContext';
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CustomerStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const router = useRouter();

  // Use global company context and date filter
  const { selectedCompany, isAdmin, isLoading: contextLoading } = useCompany();
  const { getApiDateParams } = useDateFilter();

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

  const fetchCustomers = useCallback(async () => {
    if (!selectedCompany && !isAdmin) return;

    try {
      setCustomersLoading(true);
      const dateParams = getApiDateParams();
      const filters = {
        companyId: selectedCompany?.id,
        search: searchQuery,
        sortBy: sortKey,
        sortOrder: sortDirection,
        ...dateParams,
      };

      let customersData: Customer[] = [];
      if (isAdmin) {
        // Admin users use admin API
        customersData = await adminAPI.getCustomers(filters);
      } else if (selectedCompany) {
        // Regular users use user-specific API and must have a selected company
        customersData = await adminAPI.getUserCustomers({
          ...filters,
          companyId: selectedCompany.id,
        });
      }
      
      setCustomers(customersData || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setCustomersLoading(false);
    }
  }, [selectedCompany, isAdmin, searchQuery, sortKey, sortDirection, getApiDateParams]);

  // Fetch customers when filters change
  useEffect(() => {
    if (!contextLoading && (selectedCompany || isAdmin)) {
      fetchCustomers();
    }
  }, [contextLoading, selectedCompany, isAdmin, searchQuery, sortKey, sortDirection, fetchCustomers]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
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

  // Filter customers based on active tab
  const filteredCustomers =
    activeTab === 'all'
      ? customers
      : customers.filter(customer => customer.customer_status === activeTab);

  // Calculate customer counts for each status
  const customerCounts = {
    all: customers.length,
    active: customers.filter(customer => customer.customer_status === 'active')
      .length,
    inactive: customers.filter(
      customer => customer.customer_status === 'inactive'
    ).length,
    archived: customers.filter(
      customer => customer.customer_status === 'archived'
    ).length,
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Customers</h1>
        <div className={styles.headerControls}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search customers by name, phone, or email"
          />
        </div>
      </div>

      {(selectedCompany || isAdmin) && (
        <div className={styles.customersSection}>
          <div className={styles.sectionHeader}>
            <h2>
              {selectedCompany 
                ? `Customers for ${selectedCompany.name}`
                : isAdmin 
                  ? 'All Customers (All Companies)'
                  : 'Customers'
              }
            </h2>
            <p>
              {selectedCompany
                ? 'All customers for the selected company'
                : isAdmin
                  ? 'All customers across all companies'
                  : 'All customers for your company'
              }
            </p>
          </div>

          {customersLoading ? (
            <div className={styles.loading}>Loading customers...</div>
          ) : customers.length === 0 ? (
            <div className={styles.emptyState}>
              <p>
                No customers found. Create your first customer to get started!
              </p>
            </div>
          ) : (
            <>
              <CustomersTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                customerCounts={customerCounts}
              />
              <CustomersTable
                customers={filteredCustomers}
                onCustomerClick={handleCustomerClick}
                showActions={false}
                showCompanyColumn={isAdmin && !selectedCompany}
                currentSortKey={sortKey}
                currentSortDirection={sortDirection}
                onSort={handleSort}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
