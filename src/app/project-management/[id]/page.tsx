'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProjectDetailRedirectProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailRedirect({
  params,
}: ProjectDetailRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    params.then(({ id }) => {
      router.replace(`/admin/project-management/${id}`);
    });
  }, [params, router]);

  return null;
}
