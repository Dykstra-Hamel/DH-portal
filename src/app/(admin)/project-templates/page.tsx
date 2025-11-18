import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TemplatesPage from './TemplatesPage';

export const metadata = {
  title: 'Project Templates - DH Portal',
  description: 'Manage project templates',
};

export default async function ProjectTemplatesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Fetch user profile to check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/');
  }

  return <TemplatesPage user={user} />;
}
