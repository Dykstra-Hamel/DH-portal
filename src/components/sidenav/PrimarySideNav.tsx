'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useNavigation, PrimaryNavItem } from '@/contexts/NavigationContext';
import styles from './PrimarySideNav.module.scss';

interface PrimarySideNavProps {
  className?: string;
}

export function PrimarySideNav({ className }: PrimarySideNavProps) {
  const pathname = usePathname();
  const { setActivePrimaryNav } = useNavigation();

  const menuItems = [
    {
      id: 'dashboard' as PrimaryNavItem,
      href: '/dashboard',
      disabled: false,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M9 3H4C3.44772 3 3 3.44772 3 4V11C3 11.5523 3.44772 12 4 12H9C9.55228 12 10 11.5523 10 11V4C10 3.44772 9.55228 3 9 3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20 3H15C14.4477 3 14 3.44772 14 4V7C14 7.55229 14.4477 8 15 8H20C20.5523 8 21 7.55229 21 7V4C21 3.44772 20.5523 3 20 3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20 12H15C14.4477 12 14 12.4477 14 13V20C14 20.5523 14.4477 21 15 21H20C20.5523 21 21 20.5523 21 20V13C21 12.4477 20.5523 12 20 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 16H4C3.44772 16 3 16.4477 3 17V20C3 20.5523 3.44772 21 4 21H9C9.55228 21 10 20.5523 10 20V17C10 16.4477 9.55228 16 9 16Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      text: 'Home',
    },
    {
      id: 'connections' as PrimaryNavItem,
      href: '/connections',
      disabled: false,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M3 11H6C6.53043 11 7.03914 11.2107 7.41421 11.5858C7.78929 11.9609 8 12.4696 8 13V16C8 16.5304 7.78929 17.0391 7.41421 17.4142C7.03914 17.7893 6.53043 18 6 18H5C4.46957 18 3.96086 17.7893 3.58579 17.4142C3.21071 17.0391 3 16.5304 3 16V11ZM3 11C3 9.8181 3.23279 8.64778 3.68508 7.55585C4.13738 6.46392 4.80031 5.47177 5.63604 4.63604C6.47177 3.80031 7.46392 3.13738 8.55585 2.68508C9.64778 2.23279 10.8181 2 12 2C13.1819 2 14.3522 2.23279 15.4442 2.68508C16.5361 3.13738 17.5282 3.80031 18.364 4.63604C19.1997 5.47177 19.8626 6.46392 20.3149 7.55585C20.7672 8.64778 21 9.8181 21 11M21 11V16C21 16.5304 20.7893 17.0391 20.4142 17.4142C20.0391 17.7893 19.5304 18 19 18H18C17.4696 18 16.9609 17.7893 16.5858 17.4142C16.2107 17.0391 16 16.5304 16 16V13C16 12.4696 16.2107 11.9609 16.5858 11.5858C16.9609 11.2107 17.4696 11 18 11H21Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21 16V18C21 19.0609 20.5786 20.0783 19.8284 20.8284C19.0783 21.5786 18.0609 22 17 22H12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      text: 'Connections',
    },
    {
      id: 'customers' as PrimaryNavItem,
      href: '/customers',
      disabled: false,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="21" viewBox="0 0 24 21" fill="none">
          <path d="M18.6 20C18.6 17.7604 17.6729 15.6125 16.0225 14.0289C14.3722 12.4452 12.1339 11.5556 9.8 11.5556M9.8 11.5556C7.46609 11.5556 5.22778 12.4452 3.57746 14.0289C1.92714 15.6125 1 17.7604 1 20M9.8 11.5556C12.8376 11.5556 15.3 9.19261 15.3 6.27778C15.3 3.36294 12.8376 1 9.8 1C6.76243 1 4.3 3.36294 4.3 6.27778C4.3 9.19261 6.76243 11.5556 9.8 11.5556ZM23 18.9444C23 15.3872 20.8 12.0833 18.6 10.5C19.3232 9.97937 19.9014 9.2957 20.2836 8.50951C20.6658 7.72331 20.8402 6.85883 20.7912 5.99257C20.7423 5.12631 20.4716 4.28498 20.003 3.54304C19.5345 2.80111 18.8826 2.18144 18.105 1.73889" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      text: 'Customers',
    },
    {
      id: 'tasks' as PrimaryNavItem,
      href: '/tickets',
      disabled: true,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="20"
          viewBox="0 0 24 20"
          fill="none"
        >
          <path
            d="M6.83333 1H2.16667C1.52233 1 1 1.59695 1 2.33333V7.66667C1 8.40305 1.52233 9 2.16667 9H6.83333C7.47767 9 8 8.40305 8 7.66667V2.33333C8 1.59695 7.47767 1 6.83333 1Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M1 16.5L3.33333 19L8 14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13 2H23"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13 10H23"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13 18H23"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      text: 'Tracker',
    },
    {
      id: 'brand' as PrimaryNavItem,
      href: '/brand',
      disabled: false,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12.7377 19.7014C13.027 19.7013 13.3134 19.6442 13.5806 19.5332C13.8477 19.4223 14.0904 19.2597 14.2946 19.0548L21.0612 12.2685C22.2991 11.0306 22.9946 9.35159 22.9946 7.60092C22.9946 5.85024 22.2991 4.17128 21.0612 2.93336C19.8233 1.69545 18.1443 1 16.3937 1C14.643 1 12.964 1.69545 11.7261 2.93336L4.94853 9.71094C4.53609 10.1232 4.30432 10.6825 4.3042 11.2657V18.6018C4.3042 18.8934 4.42004 19.1731 4.62625 19.3793C4.83245 19.5855 5.11212 19.7014 5.40374 19.7014H12.7377Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16.3992 7.60645L1.00562 23"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18.0485 15.3032H8.70239"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      text: 'My Brand',
    },
  ];

  const appIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 43 42"
      fill="none"
    >
      <path
        d="M36.3176 21.3149C36.3176 12.4896 29.1633 5.33517 20.3379 5.33517C11.5125 5.33517 4.35812 12.4896 4.35812 21.3149C4.35812 30.1403 11.5125 37.2947 20.3379 37.2947V41.6528C9.10558 41.6528 0 32.5472 0 21.3149C0 10.0826 9.10558 0.977051 20.3379 0.977051C31.5702 0.977051 40.6758 10.0826 40.6758 21.3149C40.6758 32.5472 31.5702 41.6528 20.3379 41.6528V37.2947C29.1633 37.2947 36.3176 30.1403 36.3176 21.3149Z"
        fill="currentColor"
      />
      <path
        d="M27.9654 21.3149C27.9654 17.1028 24.5508 13.6882 20.3387 13.6882C16.1266 13.6882 12.712 17.1028 12.712 21.3149C12.712 25.527 16.1266 28.9416 20.3387 28.9416V33.5176C13.5993 33.5176 8.13599 28.0543 8.13599 21.3149C8.13599 14.5755 13.5993 9.11218 20.3387 9.11218C27.0781 9.11218 32.5414 14.5755 32.5414 21.3149C32.5414 28.0543 27.0781 33.5176 20.3387 33.5176V28.9416C24.5508 28.9416 27.9654 25.527 27.9654 21.3149Z"
        fill="currentColor"
      />
      <path
        d="M23.2442 21.3148C23.2442 22.9194 21.9434 24.2202 20.3388 24.2202C18.7341 24.2202 17.4333 22.9194 17.4333 21.3148C17.4333 19.7102 18.7341 18.4094 20.3388 18.4094C21.9434 18.4094 23.2442 19.7102 23.2442 21.3148Z"
        fill="currentColor"
      />
      <path d="M34.8649 14.923H43V25.3825H34.8649V14.923Z" fill="white" />
    </svg>
  );

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname.startsWith('/dashboard');
    }
    if (href === '/connections') {
      return (
        pathname.startsWith('/connections') || pathname.startsWith('/tickets')
      );
    }
    return pathname.startsWith(href);
  };

  return (
    <div className={`${styles.primarySideNav} ${className || ''}`}>
      <nav className={styles.navigation}>
        {menuItems.map(item =>
          item.disabled ? (
            <div
              key={item.id}
              className={`${styles.iconItem} ${styles.disabled}`}
              title={`${item.id.charAt(0).toUpperCase() + item.id.slice(1)} (Coming Soon)`}
            >
              {item.icon}
              {item.text && <p className={styles.iconText}>{item.text}</p>}
            </div>
          ) : (
            <Link
              key={item.id}
              href={item.href}
              className={`${styles.iconItem} ${isActiveRoute(item.href) ? styles.active : ''}`}
              title={item.id.charAt(0).toUpperCase() + item.id.slice(1)}
              onClick={() => setActivePrimaryNav(item.id)}
            >
              <div className={styles.iconWrapper}>{item.icon}</div>
              {item.text && <p className={styles.iconText}>{item.text}</p>}
            </Link>
          )
        )}
      </nav>

      <div className={styles.appIcon}>{appIcon}</div>
    </div>
  );
}
