export interface TimeOption {
  value: string;
  label: string;
  enabled: boolean;
}

export const DEFAULT_TIME_OPTIONS: TimeOption[] = [
  { value: 'morning',   label: 'Morning (8am–12pm)',   enabled: true },
  { value: 'afternoon', label: 'Afternoon (12pm–5pm)', enabled: true },
  { value: 'evening',   label: 'Evening (5pm–8pm)',     enabled: true },
  { value: 'anytime',   label: 'Anytime',               enabled: true },
];

export function parseTimeOptions(raw: string | null | undefined): TimeOption[] {
  if (!raw) return DEFAULT_TIME_OPTIONS;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return DEFAULT_TIME_OPTIONS;
}

export function getEnabledTimeOptions(options: TimeOption[]): TimeOption[] {
  return options.filter(o => o.enabled);
}
