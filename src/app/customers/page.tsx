'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import CustomersTable from "@/components/Customers/CustomersTable/CustomersTable"
import CustomersTabs from "@/components/Customers/CustomersTabs/CustomersTabs"
import SearchBar from "@/components/Common/SearchBar/SearchBar"
import CompanyDropdown from "@/components/Common/CompanyDropdown/CompanyDropdown"
import { adminAPI } from '@/lib/api-client'
import { Customer, CustomerStatus } from '@/types/customer'
import { SortDirection } from '@/types/common'
import { isAuthorizedAdminSync } from '@/lib/auth-helpers'
import styles from './page.module.scss'

interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface Company {
  id: string
  name: string
}

interface UserCompany {
  id: string
  user_id: string
  company_id: string
  role: string
  is_primary: boolean
  companies: Company
}

export default function CustomersPage() {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [userCompanies, setUserCompanies] = useState<UserCompany[]>([])
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
    const [customers, setCustomers] = useState<Customer[]>([])
    const [customersLoading, setCustomersLoading] = useState(false)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<CustomerStatus | 'all'>('all')
    const [isAdmin, setIsAdmin] = useState(false)
    const [adminSelectedCompany, setAdminSelectedCompany] = useState<string | undefined>(undefined)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortKey, setSortKey] = useState('created_at')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
    const router = useRouter()

    useEffect(() => {
        const supabase = createClient()
        
        const getSessionAndData = async () => {
          const { data: { session } } = await supabase.auth.getSession()
          
          if (!session?.user) {
            router.push('/login')
            return
          }
    
          setUser(session.user)
    
          // Get user profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
    
          if (!profileError && profileData) {
            setProfile(profileData)
            setIsAdmin(isAuthorizedAdminSync(profileData))
          }

          // Get user companies (skip for admin users)
          if (!isAuthorizedAdminSync(profileData)) {
            const { data: companiesData, error: companiesError } = await supabase
              .from('user_companies')
              .select(`
                *,
                companies (
                  id,
                  name
                )
              `)
              .eq('user_id', session.user.id)

            if (!companiesError && companiesData) {
              setUserCompanies(companiesData)
              
              // Set primary company as selected, or first company if no primary
              const primaryCompany = companiesData.find(uc => uc.is_primary)
              if (primaryCompany) {
                setSelectedCompany(primaryCompany.companies)
              } else if (companiesData.length > 0) {
                setSelectedCompany(companiesData[0].companies)
              }
            }
          }
          // Admin users don't need a selected company - they use the dropdown to filter
    
          setLoading(false)
        }
    
        getSessionAndData()
    
        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_, session) => {
            if (!session?.user) {
              router.push('/login')
            }
          }
        )
    
        return () => subscription.unsubscribe()
      }, [router])

      // Fetch customers when filters change
      useEffect(() => {
        if (isAdmin) {
          fetchCustomersAdmin()
        } else if (selectedCompany) {
          fetchCustomers()
        }
      }, [selectedCompany, adminSelectedCompany, isAdmin, searchQuery, sortKey, sortDirection])

      const fetchCustomers = async () => {
        if (!selectedCompany) return
        
        try {
          setCustomersLoading(true)
          const customersData = await adminAPI.getUserCustomers({
            companyId: selectedCompany.id,
            search: searchQuery,
            sortBy: sortKey,
            sortOrder: sortDirection
          })
          setCustomers(customersData || [])
        } catch (error) {
          console.error('Error fetching customers:', error)
          setCustomers([])
        } finally {
          setCustomersLoading(false)
        }
      }

      const fetchCustomersAdmin = async () => {
        try {
          setCustomersLoading(true)
          const filters = {
            companyId: adminSelectedCompany,
            search: searchQuery,
            sortBy: sortKey,
            sortOrder: sortDirection
          }
          const customersData = await adminAPI.getCustomers(filters)
          setCustomers(customersData || [])
        } catch (error) {
          console.error('Error fetching admin customers:', error)
          setCustomers([])
        } finally {
          setCustomersLoading(false)
        }
      }

      const handleSort = (key: string) => {
        if (sortKey === key) {
          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
          setSortKey(key)
          setSortDirection('asc')
        }
      }

      const handleCustomerClick = (customer: Customer) => {
        router.push(`/customers/${customer.id}`)
      }
    
      if (loading) {
        return <div>Loading...</div>
      }
    
      if (!user || !profile) {
        return <div>Redirecting...</div>
      }

      // Filter customers based on active tab
      const filteredCustomers = activeTab === 'all' 
        ? customers 
        : customers.filter(customer => customer.customer_status === activeTab)

      // Calculate customer counts for each status
      const customerCounts = {
        all: customers.length,
        active: customers.filter(customer => customer.customer_status === 'active').length,
        inactive: customers.filter(customer => customer.customer_status === 'inactive').length,
        archived: customers.filter(customer => customer.customer_status === 'archived').length,
      }

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
                {isAdmin && (
                  <CompanyDropdown
                    selectedCompanyId={adminSelectedCompany}
                    onCompanyChange={setAdminSelectedCompany}
                    includeAllOption={true}
                    placeholder="Select company to view customers"
                  />
                )}
              </div>
            </div>
            
            {(selectedCompany || isAdmin) && (
              <div className={styles.customersSection}>
                <div className={styles.sectionHeader}>
                  <h2>
                    {isAdmin 
                      ? (adminSelectedCompany 
                          ? `Customers for ${customers.length > 0 ? customers[0].company?.name || 'Selected Company' : 'Selected Company'}`
                          : 'All Customers (All Companies)')
                      : `Customers for ${selectedCompany?.name}`
                    }
                  </h2>
                  <p>
                    {isAdmin 
                      ? (adminSelectedCompany ? 'Customers for the selected company' : 'All customers across all companies')
                      : 'All customers for your company'
                    }
                  </p>
                </div>

                {customersLoading ? (
                  <div className={styles.loading}>
                    Loading customers...
                  </div>
                ) : customers.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No customers found. Create your first customer to get started!</p>
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
                      showCompanyColumn={isAdmin && !adminSelectedCompany}
                      currentSortKey={sortKey}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </>
                )}
              </div>
            )}
        </div>
    )
}