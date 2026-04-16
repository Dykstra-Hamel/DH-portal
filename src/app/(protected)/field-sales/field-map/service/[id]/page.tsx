import { ServiceStopDetail } from '@/components/FieldMap/ServiceStopDetail/ServiceStopDetail';

export default async function ServiceStopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ServiceStopDetail stopId={id} />;
}
