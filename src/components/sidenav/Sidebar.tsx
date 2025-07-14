'use client'

import { useState } from 'react';
import Image from "next/image";
import { 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  Route, 
  DollarSign, 
  UserCheck, 
  BarChart3, 
  Palette, 
  Briefcase, 
  Mail, 
  FileText, 
  Package,
} from 'lucide-react';
import styles from './sidenav.module.scss'
import { SidebarSection } from './SidebarSection';
import { SidebarSectionNavItem } from './SidebarSectionNavItem';
import { SidebarSingleNavItem } from './SidebarSingleNavItem';

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const [companyOpen, setCompanyOpen] = useState(true);
  const [marketingOpen, setMarketingOpen] = useState(false);
  const [helpfulToolsOpen, setHelpfulToolsOpen] = useState(false);

  if (collapsed) {
    return null;
  }

  return (
    <div className={styles.sidebar}>
      {/* Logo Section */}
      <div className={styles.sidebarLogoSection}>
        <Image
          src="pcocentral-logo.svg"
          alt="pcocentral logo"
          width={131}
          height={23}
          priority
        />
      </div>

      {/* Navigation */}
      <nav className={styles.sidebarNavigation}>
        {/* Dashboard Item */}
        <SidebarSingleNavItem itemText='Dashboard' icon={LayoutDashboard} path='/dashboard' />

        {/* Company Section */}
        <SidebarSection sectionTitle='Company' sectionState={companyOpen} setSectionState={setCompanyOpen}>
          <SidebarSectionNavItem itemText='Leads' icon={UserPlus} />
          <SidebarSectionNavItem itemText='Customers' icon={Users} />
          <SidebarSectionNavItem itemText='Routing' icon={Route} />
          <SidebarSectionNavItem itemText='Tech Revenue' icon={DollarSign} />
          <SidebarSectionNavItem itemText='Employees' icon={UserCheck} />
        </SidebarSection>

        {/* Marketing Section */}
        <SidebarSection sectionTitle='Marketing' sectionState={marketingOpen} setSectionState={setMarketingOpen}>
          <SidebarSectionNavItem itemText='Overview' icon={BarChart3} />
          <SidebarSectionNavItem itemText='Your Brand' icon={Palette} />
          <SidebarSectionNavItem itemText='Projects' icon={Briefcase} />
          <SidebarSectionNavItem itemText='Email Campaigns' icon={Mail} />
        </SidebarSection>

        {/* Helpful Tools Section */}
        <SidebarSection sectionTitle='Helpful Tools' sectionState={helpfulToolsOpen} setSectionState={setHelpfulToolsOpen}>
          <SidebarSectionNavItem itemText='Document Manager' icon={FileText} />
          <SidebarSectionNavItem itemText='Inventory Control' icon={Package} />
        </SidebarSection>
      </nav>

      {/* Bottom Section */}
      <div className="sidebar-bottom-section">
        <div className="sidebar-bottom-nav">
          <SidebarSingleNavItem itemText='Settings' icon={Settings} path='/dasbhoard-1' />
          <SidebarSingleNavItem itemText='Log Out' icon={LogOut} path='#' />
        </div>
      </div>
    </div>
  )
}