'use client'

import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import AccountLinking from '@/components/AccountLinking/AccountLinking'
import styles from './Dashboard.module.scss'

interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string
  role?: string
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

interface DashboardProps {
  user: User
  profile: Profile
  userCompanies: UserCompany[]
  selectedCompany: Company | null
  onCompanyChange: (company: Company) => void
}

export default function Dashboard({
  user,
  profile,
  userCompanies,
  selectedCompany,
  onCompanyChange
}: DashboardProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    } else {
      router.push('/login')
    }
  }

  const handleCompanyChange = (companyId: string) => {
    const company = userCompanies.find(uc => uc.companies.id === companyId)?.companies
    if (company) {
      onCompanyChange(company)
    }
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Dashboard</h1>
          <div className={styles.headerActions}>
            {profile.role === 'admin' && (
              <button 
                onClick={() => router.push('/admin')} 
                className={styles.adminButton}
              >
                Admin Dashboard
              </button>
            )}
            <button onClick={handleSignOut} className={styles.signOutButton}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.welcomeSection}>
          <h2 className={styles.welcome}>
            Welcome, {profile.first_name || user.user_metadata?.first_name || 'User'}!
          </h2>
          
          {selectedCompany && (
            <div className={styles.companySection}>
              {userCompanies.length > 1 ? (
                <div className={styles.companySelector}>
                  <label htmlFor="company-select" className={styles.companyLabel}>
                    Company:
                  </label>
                  <select
                    id="company-select"
                    value={selectedCompany.id}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    className={styles.companySelect}
                  >
                    {userCompanies.map((userCompany) => (
                      <option key={userCompany.companies.id} value={userCompany.companies.id}>
                        {userCompany.companies.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className={styles.singleCompany}>
                  <span className={styles.companyName}>{selectedCompany.name}</span>
                </div>
              )}
            </div>
          )}

          {userCompanies.length === 0 && (
            <div className={styles.noCompany}>
              <p>No companies associated with your account.</p>
            </div>
          )}
        </div>

        <div className={styles.content}>
          <div className={styles.card}>
            <h3>Dashboard Content</h3>
            <p>This is where your dashboard content will go.</p>
            {selectedCompany && (
              <p>Currently viewing: <strong>{selectedCompany.name}</strong></p>
            )}
          </div>

          <div className={styles.card}>
            <AccountLinking user={user} />
          </div>
        </div>
      </main>
    </div>
  )
}