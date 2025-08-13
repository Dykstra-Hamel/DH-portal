'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from '@/components/sidenav/Sidebar';

export function MobileMenuButton() {
  const [isActive, setIsActive] = useState(false);

  const toggleSidebar = () => {
    setIsActive(!isActive);
  };

  const closeSidebar = () => {
    setIsActive(false);
  };

  return (
    <>
      <Sidebar isActive={isActive} onLinkClick={closeSidebar} />
      <div className="mobileMenuButton" onClick={toggleSidebar}>
        <Menu size={32} />
      </div>
    </>
  );
}
