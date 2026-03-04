export function deriveSource(params: {
  gclid?: string | null;
  fbclid?: string | null;
  utm_source?: string | null;
  isCampaign?: boolean;
  isWidget?: boolean;
}): string {
  if (params.isCampaign) return 'campaign';
  if (params.gclid) return 'google_ads';
  if (params.fbclid) return 'facebook_ads';
  if (params.utm_source === 'google') return 'google_organic';
  if (params.isWidget) return 'widget';
  return 'direct';
}
