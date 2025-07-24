'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useIsCompanyAdminAny } from '@/hooks/useCompanyRole';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';
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
import styles from './sidenav.module.scss';
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
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);

  const pathname = usePathname();
  const isPublicPage = pathname === '/login' || pathname === '/sign-up';
  const { isAdminForAnyCompany } = useIsCompanyAdminAny();

  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      router.push('/login');
    }
  };

  // Check if user is global admin
  useEffect(() => {
    const checkGlobalAdmin = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        setIsGlobalAdmin(isAuthorizedAdminSync(profile));
      }
    };

    if (!isPublicPage) {
      checkGlobalAdmin();
    }
  }, [isPublicPage]);

  if (collapsed) {
    return null;
  }

  if (!isPublicPage && pathname !== '/') {
    return (
      <div className={styles.sidebar}>
        {/* Logo Section */}
        <div className={styles.sidebarLogoSection}>
          <Image
            src="/pcocentral-logo.svg"
            alt="pcocentral logo"
            width={131}
            height={23}
            priority
          />
        </div>

        {/* Navigation */}
        <nav className={styles.sidebarNavigation}>
          {/* Dashboard Item */}
          <SidebarSingleNavItem
            itemText="Dashboard"
            icon={LayoutDashboard}
            path="/dashboard"
          />

          {/* Company Section */}
          <SidebarSection
            sectionTitle="Company"
            sectionState={companyOpen}
            setSectionState={setCompanyOpen}
          >
            <SidebarSectionNavItem
              itemText="Leads"
              icon={UserPlus}
              path="/leads"
            />
            <SidebarSectionNavItem
              itemText="Customers"
              icon={Users}
              path="/customers"
            />
            {/* <SidebarSectionNavItem itemText="Routing" icon={Route} path="#" />
            <SidebarSectionNavItem
              itemText="Tech Revenue"
              icon={DollarSign}
              path="#"
            />
            <SidebarSectionNavItem
              itemText="Employees"
              icon={UserCheck}
              path="#"
            /> */}
          </SidebarSection>

          {/* Marketing Section */}
          <SidebarSection
            sectionTitle="Marketing"
            sectionState={marketingOpen}
            setSectionState={setMarketingOpen}
          >
            <SidebarSectionNavItem
              itemText="Overview"
              icon={BarChart3}
              path="#"
            />
            <SidebarSectionNavItem
              itemText="Your Brand"
              icon={Palette}
              path="/brand"
            />
            <SidebarSectionNavItem
              itemText="Projects"
              icon={Briefcase}
              path="/projects"
            />
            {/* <SidebarSectionNavItem
              itemText="Email Campaigns"
              icon={Mail}
              path="#"
            /> */}
          </SidebarSection>

          {/* Helpful Tools Section */}
          {/* <SidebarSection
            sectionTitle="Helpful Tools"
            sectionState={helpfulToolsOpen}
            setSectionState={setHelpfulToolsOpen}
          >
            <SidebarSectionNavItem
              itemText="Document Manager"
              icon={FileText}
              path="#"
            />
            <SidebarSectionNavItem
              itemText="Inventory Control"
              icon={Package}
              path="#"
            />
          </SidebarSection> */}
        </nav>

        {/* Bottom Section */}
        <div className="sidebar-bottom-section">
          <div className="sidebar-bottom-nav">
            {(isAdminForAnyCompany || isGlobalAdmin) && (
              <SidebarSingleNavItem
                itemText="Settings"
                icon={Settings}
                path="/settings"
              />
            )}
            <SidebarSingleNavItem itemText="Log Out" icon={LogOut} path="#" />
          </div>
        </div>
      </div>
    );
  }
}
