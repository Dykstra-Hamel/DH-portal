'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { adminAPI, authenticatedFetch } from '@/lib/api-client';
import { Customer } from '@/types/customer';
import { SupportCase } from '@/types/support-case';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';
import { TabCard, TabItem } from '@/components/Common/TabCard/TabCard';
import { ContactInformationCard } from '@/components/Common/ContactInformationCard/ContactInformationCard';
import { ServiceLocationCard } from '@/components/Common/ServiceLocationCard/ServiceLocationCard';
import { InfoCard } from '@/components/Common/InfoCard/InfoCard';
import { SquareActivity, NotebookPen, TicketCheck, FileText, Briefcase, Home } from 'lucide-react';
import { AddressComponents } from '@/components/Common/AddressAutocomplete/AddressAutocomplete';
import { ServiceAddressData } from '@/lib/service-addresses';
import { usePricingSettings } from '@/hooks/usePricingSettings';
import { Toast } from '@/components/Common/Toast';
import { CustomerTicketsList } from '@/components/Customers/CustomerTicketsList/CustomerTicketsList';
import { CustomerLeadsList } from '@/components/Customers/CustomerLeadsList/CustomerLeadsList';
import { CustomerSupportCasesList } from '@/components/Customers/CustomerSupportCasesList/CustomerSupportCasesList';
import styles from './page.module.scss';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface CustomerPageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerDetailPage({ params }: CustomerPageProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const router = useRouter();

  // Service Location form state
  const [serviceLocationData, setServiceLocationData] = useState<ServiceAddressData>({
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    latitude: undefined,
    longitude: undefined,
    address_type: 'residential',
  });
  const [originalServiceAddress, setOriginalServiceAddress] = useState<ServiceAddressData | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Support cases state
  const [supportCases, setSupportCases] = useState<SupportCase[]>([]);
  const [supportCasesLoading, setSupportCasesLoading] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Get pricing settings for home/yard size inputs
  const { settings: pricingSettings } = usePricingSettings(customer?.company_id);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setCustomerId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

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
        setIsAdmin(isAuthorizedAdminSync(profileData));
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

  const fetchCustomer = useCallback(async () => {
    if (!customerId) return;

    try {
      setCustomerLoading(true);
      let customerData;
      if (isAdmin) {
        customerData = await adminAPI.getCustomer(customerId);
      } else {
        customerData = await adminAPI.getUserCustomer(customerId);
      }
      setCustomer(customerData);
    } catch (error) {
      console.error('Error fetching customer:', error);
      setCustomer(null);
    } finally {
      setCustomerLoading(false);
    }
  }, [customerId, isAdmin]);

  const fetchSupportCases = useCallback(async () => {
    if (!customerId) return;

    try {
      setSupportCasesLoading(true);
      const data = await authenticatedFetch(
        `/api/customers/${customerId}/support-cases`
      );
      setSupportCases(data.supportCases || []);
    } catch (error) {
      console.error('Error fetching support cases:', error);
      setSupportCases([]);
    } finally {
      setSupportCasesLoading(false);
    }
  }, [customerId]);

  // Fetch customer when customerId is available
  useEffect(() => {
    if (customerId && !loading) {
      fetchCustomer();
      fetchSupportCases();
    }
  }, [customerId, loading, isAdmin, fetchCustomer, fetchSupportCases]);

  // Initialize service location data from customer
  useEffect(() => {
    if (originalServiceAddress === null && customer?.primary_service_address) {
      const addressData: ServiceAddressData = {
        street_address: customer.primary_service_address.street_address || '',
        city: customer.primary_service_address.city || '',
        state: customer.primary_service_address.state || '',
        zip_code: customer.primary_service_address.zip_code || '',
        apartment_unit: customer.primary_service_address.apartment_unit || undefined,
        latitude: customer.primary_service_address.latitude || undefined,
        longitude: customer.primary_service_address.longitude || undefined,
        address_type: 'residential',
      };

      setOriginalServiceAddress(addressData);
      setServiceLocationData(addressData);
    }
  }, [customer?.primary_service_address, originalServiceAddress]);

  // State name to abbreviation mapping for address handling
  const stateNameToAbbreviation: Record<string, string> = {
    Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
    Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
    Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
    Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
    Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO',
    Montana: 'MT', Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH',
    Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
    Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY',
  };

  // Handler for address autocomplete selection
  const handleAddressSelect = (addressComponents: AddressComponents) => {
    let streetAddress = '';
    if (addressComponents.street_number && addressComponents.route) {
      streetAddress = `${addressComponents.street_number} ${addressComponents.route}`;
    } else if (addressComponents.route) {
      streetAddress = addressComponents.route;
    } else {
      streetAddress = addressComponents.formatted_address || '';
    }

    let stateAbbreviation = addressComponents.administrative_area_level_1 || '';
    if (stateNameToAbbreviation[stateAbbreviation]) {
      stateAbbreviation = stateNameToAbbreviation[stateAbbreviation];
    }

    setServiceLocationData(prev => ({
      ...prev,
      street_address: streetAddress,
      city: addressComponents.locality || '',
      state: stateAbbreviation,
      zip_code: addressComponents.postal_code || '',
      latitude: addressComponents.latitude,
      longitude: addressComponents.longitude,
      hasStreetView: addressComponents.hasStreetView,
    }));
  };

  // Handler for service location field changes
  const handleServiceLocationChange = (field: keyof ServiceAddressData, value: string) => {
    setServiceLocationData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handler for saving address changes
  const handleSaveAddress = async () => {
    if (!customer || !hasAddressChanges) return;

    setIsSavingAddress(true);
    try {
      if (customer.primary_service_address?.id) {
        // Update existing service address
        await authenticatedFetch(`/api/customers/${customer.id}/service-address`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceLocationData),
        });

        setOriginalServiceAddress(serviceLocationData);
        handleShowToast('Service address updated successfully', 'success');
      } else {
        // Create new service address
        await authenticatedFetch(`/api/customers/${customer.id}/service-address`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceLocationData),
        });

        setOriginalServiceAddress(serviceLocationData);
        handleShowToast('Service address created successfully', 'success');
      }

      // Refresh customer data
      await fetchCustomer();
    } catch (error) {
      console.error('Error saving service address:', error);
      handleShowToast('Failed to save service address', 'error');
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Handler for canceling address changes
  const handleCancelAddressChanges = () => {
    if (!originalServiceAddress) return;
    setServiceLocationData({ ...originalServiceAddress });
  };

  // Toast handlers
  const handleShowToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleToastClose = () => {
    setShowToast(false);
  };

  // Computed values for address state
  const hasAddressChanges = useMemo(() => {
    if (!originalServiceAddress) return false;

    const hadExistingAddress = !!(
      originalServiceAddress.street_address ||
      originalServiceAddress.city ||
      originalServiceAddress.state ||
      originalServiceAddress.zip_code
    );

    if (!hadExistingAddress) return false;

    return (
      serviceLocationData.street_address !== originalServiceAddress.street_address ||
      serviceLocationData.city !== originalServiceAddress.city ||
      serviceLocationData.state !== originalServiceAddress.state ||
      serviceLocationData.zip_code !== originalServiceAddress.zip_code ||
      serviceLocationData.apartment_unit !== originalServiceAddress.apartment_unit ||
      serviceLocationData.address_line_2 !== originalServiceAddress.address_line_2
    );
  }, [serviceLocationData, originalServiceAddress]);

  const hasCompleteAddress = useMemo(() => {
    return !!(
      serviceLocationData.street_address &&
      serviceLocationData.city &&
      serviceLocationData.state &&
      serviceLocationData.zip_code
    );
  }, [serviceLocationData]);

  const hasCompleteUnchangedAddress = useMemo(() => {
    if (!hasCompleteAddress || !originalServiceAddress) return false;

    return (
      serviceLocationData.street_address === originalServiceAddress.street_address &&
      serviceLocationData.city === originalServiceAddress.city &&
      serviceLocationData.state === originalServiceAddress.state &&
      serviceLocationData.zip_code === originalServiceAddress.zip_code &&
      serviceLocationData.apartment_unit === originalServiceAddress.apartment_unit &&
      serviceLocationData.address_line_2 === originalServiceAddress.address_line_2
    );
  }, [serviceLocationData, originalServiceAddress, hasCompleteAddress]);

  const currentFormattedAddress = useMemo(() => {
    const parts = [];

    if (serviceLocationData.street_address?.trim()) {
      parts.push(serviceLocationData.street_address.trim());
    }

    if (serviceLocationData.city?.trim()) {
      parts.push(serviceLocationData.city.trim());
    }

    const state = serviceLocationData.state?.trim();
    const zip = serviceLocationData.zip_code?.trim();
    if (state && zip) {
      parts.push(`${state} ${zip}`);
    } else if (state) {
      parts.push(state);
    } else if (zip) {
      parts.push(zip);
    }

    return parts.length >= 1 &&
      (serviceLocationData.street_address?.trim() || serviceLocationData.city?.trim())
      ? parts.join(', ')
      : '';
  }, [serviceLocationData]);

  const calculateYearsSince = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const years = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25));

    if (years === 0) {
      return 'Less Than A Year';
    } else if (years === 1) {
      return '1 Year';
    } else {
      return `${years} Years`;
    }
  };

  const formatDateDDMMYYYY = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const renderOverviewTab = () => {
    if (!customer) return null;

    return (
      <div className={styles.overviewContent}>
        <div className={styles.contentLeft}>
          <ContactInformationCard customer={customer} startExpanded={true} />

          <InfoCard
            title="Source & Acquisition"
            icon={<Briefcase size={20} />}
            startExpanded={false}
          >
            <div className={styles.cardContent}>
              <p className={styles.placeholderText}>
                Lead conversion tracking coming soon
              </p>
            </div>
          </InfoCard>
        </div>

        <div className={styles.contentRight}>
          <ServiceLocationCard
            serviceAddress={customer.primary_service_address || null}
            startExpanded={true}
            editable={true}
            showSizeInputs={true}
            pricingSettings={pricingSettings || undefined}
            onShowToast={handleShowToast}
            onAddressSelect={handleAddressSelect}
            onSaveAddress={handleSaveAddress}
            onCancelAddress={handleCancelAddressChanges}
            hasAddressChanges={hasAddressChanges}
            isSavingAddress={isSavingAddress}
            serviceLocationData={serviceLocationData}
            onServiceLocationChange={handleServiceLocationChange}
            hasCompleteUnchangedAddress={hasCompleteUnchangedAddress}
            currentFormattedAddress={currentFormattedAddress}
          />

          <InfoCard
            title="Activity"
            icon={<SquareActivity size={20} />}
            startExpanded={false}
          >
            <div className={styles.cardContent}>
              <p className={styles.placeholderText}>
                Customer activity and interaction history will be displayed here.
              </p>
            </div>
          </InfoCard>

          <InfoCard
            title="Notes"
            icon={<NotebookPen size={20} />}
            startExpanded={false}
          >
            <div className={styles.cardContent}>
              <p className={styles.placeholderText}>
                Customer notes and comments will be displayed here.
              </p>
            </div>
          </InfoCard>
        </div>
      </div>
    );
  };

  const renderTicketsTab = () => {
    if (!customer) return null;

    return (
      <div className={styles.ticketsContent}>
        <InfoCard
          title={`Tickets (${customer.tickets?.length || 0})`}
          icon={<TicketCheck size={20} />}
          startExpanded={true}
        >
          <CustomerTicketsList
            tickets={customer.tickets || []}
            loading={customerLoading}
            onTicketUpdated={fetchCustomer}
          />
        </InfoCard>

        <InfoCard
          title={`Leads (${customer.leads?.length || 0})`}
          icon={<FileText size={20} />}
          startExpanded={true}
        >
          <CustomerLeadsList
            leads={customer.leads || []}
            loading={customerLoading}
            onLeadUpdated={fetchCustomer}
          />
        </InfoCard>

        <InfoCard
          title={`Support Cases (${supportCases.length})`}
          icon={<Briefcase size={20} />}
          startExpanded={true}
        >
          <CustomerSupportCasesList
            supportCases={supportCases}
            loading={supportCasesLoading}
            onSupportCaseUpdated={fetchSupportCases}
          />
        </InfoCard>
      </div>
    );
  };

  const renderPropertyTab = () => {
    if (!customer) return null;

    return (
      <div className={styles.propertyContent}>
        <ServiceLocationCard
          serviceAddress={customer.primary_service_address || null}
          startExpanded={true}
          editable={true}
          showSizeInputs={true}
          pricingSettings={pricingSettings || undefined}
          onShowToast={handleShowToast}
          onAddressSelect={handleAddressSelect}
          onSaveAddress={handleSaveAddress}
          onCancelAddress={handleCancelAddressChanges}
          hasAddressChanges={hasAddressChanges}
          isSavingAddress={isSavingAddress}
          serviceLocationData={serviceLocationData}
          onServiceLocationChange={handleServiceLocationChange}
          hasCompleteUnchangedAddress={hasCompleteUnchangedAddress}
          currentFormattedAddress={currentFormattedAddress}
        />
      </div>
    );
  };

  if (loading || customerLoading) {
    return <div className={styles.loading}>Loading customer...</div>;
  }

  if (!user || !profile) {
    return <div>Redirecting...</div>;
  }

  if (!customer) {
    return (
      <div className={styles.error}>
        <h2>Customer not found</h2>
      </div>
    );
  }

  const customerName = `${customer.first_name} ${customer.last_name}`;
  const customerSinceDate = formatDateDDMMYYYY(customer.created_at);
  const yearsSince = calculateYearsSince(customer.created_at);
  const headerDescription = `Customer Since ${customerSinceDate} (${yearsSince})`;

  const tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: renderOverviewTab(),
    },
    {
      id: 'tickets',
      label: 'Tickets',
      content: renderTicketsTab(),
    },
    {
      id: 'history',
      label: 'History',
      content: (
        <div className={styles.disabledContent}>
          <p>History coming soon</p>
        </div>
      ),
    },
    {
      id: 'property',
      label: 'Property',
      content: renderPropertyTab(),
    },
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageContent}>
        <TabCard tabs={tabs} defaultTabId="overview" />
      </div>

      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={handleToastClose}
        type={toastType}
      />
    </div>
  );
}
