'use client';
import Link from 'next/link';
import { ComponentProps } from 'react';
import { useNavigationGuard } from '@/contexts/NavigationGuardContext';

type GuardedLinkProps = ComponentProps<typeof Link>;

export function GuardedLink({ href, onClick, children, ...props }: GuardedLinkProps) {
  const { hasActiveGuard, requestNavigation } = useNavigationGuard();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (hasActiveGuard()) {
      e.preventDefault();
      requestNavigation(typeof href === 'string' ? href : String(href));
      return;
    }
    onClick?.(e as React.MouseEvent<HTMLAnchorElement>);
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
