'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from '@/components/sidenav/Sidebar';

export function MobileMenuButton() {
  const [isActive, setIsActive] = useState(false);

  const toggleSidebar = () => {
    setIsActive(!isActive);
  };

  return (
    <>
      <Sidebar isActive={isActive} />
      <div className="mobileMenuButton" onClick={toggleSidebar}>
        <Menu size={32} />
      </div>
    </>
  );
}
