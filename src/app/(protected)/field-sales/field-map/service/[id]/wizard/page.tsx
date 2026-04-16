import { Suspense } from 'react';
import { ServiceWizard } from '@/components/FieldMap/ServiceWizard/ServiceWizard';

export default async function WizardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<div style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>Loading wizard&hellip;</div>}>
      <ServiceWizard stopId={id} />
    </Suspense>
  );
}
