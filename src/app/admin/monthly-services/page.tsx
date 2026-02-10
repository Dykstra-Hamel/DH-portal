'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePageActions } from '@/contexts/PageActionsContext';
import { MonthlyServicesTable } from '@/components/MonthlyServices/MonthlyServicesTable/MonthlyServicesTable';
import { MonthlyServiceForm } from '@/components/MonthlyServices/MonthlyServiceForm/MonthlyServiceForm';
import { createClient } from '@/lib/supabase/client';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import styles from './page.module.scss';

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
}

interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
}

interface WeekProgress {
  week: number;
  completed: number;
  total: number;
  percentage: number;
}

interface MonthlyService {
  id: string;
  service_name: string;
  description: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  company_id: string;
  companies: Company;
  weekProgress: WeekProgress[];
}

export default function MonthlyServicesPage() {
  const router = useRouter();
  const { setPageHeader, registerPageAction } = usePageActions();
  const [services, setServices] = useState<MonthlyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Default to current month (YYYY-MM format)
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [selectedMonthDayjs, setSelectedMonthDayjs] = useState<Dayjs | null>(
    () => {
      // Default to current month
      return dayjs();
    }
  );

  // Modal state
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);

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

  // Handle month change
  const handleMonthChange = (newValue: Dayjs | null) => {
    if (newValue) {
      setSelectedMonthDayjs(newValue);
      // Format as YYYY-MM for API calls
      const monthStr = `${newValue.year()}-${String(newValue.month() + 1).padStart(2, '0')}`;
      setSelectedMonth(monthStr);
    }
  };

  // Register page action for new service button
  useEffect(() => {
    registerPageAction('add-monthly-service', () => {
      setShowServiceModal(true);
    });

    return () => {
      // Cleanup handled by PageActionsProvider
    };
  }, [registerPageAction]);

  // Set page header with custom actions
  useEffect(() => {
    setPageHeader({
      title: 'Monthly Services',
      description: 'Track recurring marketing tasks for client companies',
      customActions: (
        <div className={styles.monthSelector}>
          <label htmlFor="month-select" className={styles.monthLabel}>
            Month:
          </label>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              value={selectedMonthDayjs}
              onChange={handleMonthChange}
              views={['year', 'month']}
              openTo="month"
              slotProps={{
                textField: {
                  size: 'small',
                  className: styles.monthInput,
                },
              }}
            />
          </LocalizationProvider>
        </div>
      ),
    });

    return () => setPageHeader(null);
  }, [setPageHeader, selectedMonthDayjs]);

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch('/api/admin/companies', { headers });
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    fetchCompanies();
  }, []);

  // Fetch users (admin users)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch('/api/admin/users?include_system=true', {
          headers,
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  // Fetch services data
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setServices([]); // Clear previous services while loading
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(
          `/api/admin/monthly-services?month=${selectedMonth}`,
          { headers }
        );
        if (response.ok) {
          const data = await response.json();
          setServices(data.services || []);
        } else {
          console.error('Failed to fetch services');
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [selectedMonth]);

  // Handle service row click
  const handleServiceClick = (serviceId: string) => {
    router.push(`/admin/monthly-services/${serviceId}`);
  };

  // Handle form submission
  const handleServiceSubmit = async (data: any) => {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/admin/monthly-services', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create service');
    }

    // Refresh services list
    const servicesResponse = await fetch(
      `/api/admin/monthly-services?month=${selectedMonth}`,
      { headers }
    );
    if (servicesResponse.ok) {
      const servicesData = await servicesResponse.json();
      setServices(servicesData.services || []);
    }
  };

  return (
    <div className={styles.container}>
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading services...</p>
        </div>
      ) : (
        <MonthlyServicesTable
          services={services}
          month={selectedMonth}
          onServiceClick={handleServiceClick}
        />
      )}

      <MonthlyServiceForm
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        onSubmit={handleServiceSubmit}
        companies={companies}
        users={users}
      />
    </div>
  );
}
