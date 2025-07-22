'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import UsersManager from './UsersManager'
import CompaniesManager from './CompaniesManager'
import UserCompanyManager from './UserCompanyManager'
import BrandManager from './BrandManager'
import ProjectsManager from './ProjectsManager'
import WidgetManager from './WidgetManager'
import styles from './AdminDashboard.module.scss'

interface AdminDashboardProps {
  user: User
}

type AdminSection = 'users' | 'companies' | 'relationships' | 'brands' | 'projects' | 'widgets'

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>('users')

  const renderSection = () => {
    switch (activeSection) {
      case 'users':
        return <UsersManager />
      case 'companies':
        return <CompaniesManager />
      case 'relationships':
        return <UserCompanyManager />
      case 'brands':
        return <BrandManager />
      case 'projects':
        return <ProjectsManager user={user} />
      case 'widgets':
        return <WidgetManager />
      default:
        return <UsersManager />
    }
  }

  return (
    <div className={styles.adminDashboard}>
      <div className={styles.header}>
        <h1>Admin Dashboard</h1>
        <p>Welcome, {user.email}</p>
      </div>

      <nav className={styles.navigation}>
        <button
          className={`${styles.navButton} ${activeSection === 'users' ? styles.active : ''}`}
          onClick={() => setActiveSection('users')}
        >
          Users
        </button>
        <button
          className={`${styles.navButton} ${activeSection === 'companies' ? styles.active : ''}`}
          onClick={() => setActiveSection('companies')}
        >
          Companies
        </button>
        <button
          className={`${styles.navButton} ${activeSection === 'relationships' ? styles.active : ''}`}
          onClick={() => setActiveSection('relationships')}
        >
          User-Company Links
        </button>
        <button
          className={`${styles.navButton} ${activeSection === 'brands' ? styles.active : ''}`}
          onClick={() => setActiveSection('brands')}
        >
          Brand Management
        </button>
        <button
          className={`${styles.navButton} ${activeSection === 'projects' ? styles.active : ''}`}
          onClick={() => setActiveSection('projects')}
        >
          Projects
        </button>
        <button
          className={`${styles.navButton} ${activeSection === 'widgets' ? styles.active : ''}`}
          onClick={() => setActiveSection('widgets')}
        >
          Widget Config
        </button>
      </nav>

      <main className={styles.content}>
        {renderSection()}
      </main>
    </div>
  )
}