'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { UserPlus, TrendingUp, ChevronDown, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';
import { useCompany } from '@/contexts/CompanyContext';
import { useWizard } from '@/contexts/WizardContext';
import {
  useRecentTechLeadCustomers,
  type RecentCustomer,
} from '@/hooks/useRecentTechLeadCustomers';
import {
  AddressAutocomplete,
  type AddressComponents,
} from '@/components/Common/AddressAutocomplete/AddressAutocomplete';
import { createClient } from '@/lib/supabase/client';
import {
  DEFAULT_TIME_OPTIONS,
  parseTimeOptions,
  getEnabledTimeOptions,
  type TimeOption,
} from '@/lib/time-options';
import styles from './NewOpportunityWizard.module.scss';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadType = 'new-lead' | 'upsell';

type StepId =
  | 'type-select'
  | 'map-address'
  | 'photos'
  | 'ai-review'
  | 'new-customer'
  | 'select-site'
  | 'service-plan-select'
  | 'service-details'
  | 'upsell-catalog'
  | 'service-today-confirm';

const STEP_ID_LABELS: Record<StepId, string> = {
  'type-select': 'Type',
  'map-address': 'Address',
  photos: 'Photos',
  'ai-review': 'Review',
  'new-customer': 'Customer',
  'select-site': 'Site',
  'service-plan-select': 'Plan',
  'service-details': 'Services',
  'upsell-catalog': 'Service',
  'service-today-confirm': 'Confirm',
};

interface NewCustomerForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  addressInput: string;
  addressComponents: AddressComponents | null;
}

interface PestPacClientResult {
  clientId: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  primaryAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  } | null;
}

interface PhotoPreview {
  file: File;
  dataUrl: string;
  base64: string;
  mimeType: string;
}

interface AIResult {
  issue_detected: string;
  service_category: string;
  ai_summary: string;
  suggested_pest_type: string | null;
  matched_pest_option: string | null;
  severity: 'low' | 'medium' | 'high' | null;
}

interface PestOption {
  id: string;
  name: string;
  slug: string;
}

interface ServiceAddress {
  id: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
}

interface CustomerResult {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  pestpac_client_id?: string | null;
  // Direct customer address fields
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  // Nested primary service address from the search API
  primary_service_address?: Array<{ service_address: ServiceAddress }>;
}

interface TodayRouteStop {
  routeStopId: string;
  clientName: string;
  address: string;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZip: string | null;
  serviceType: string | null;
  scheduledTime: string | null;
  clientId: string | null;
}

interface ServicePlan {
  id: string;
  plan_name: string;
  plan_description: string | null;
  initial_price: number | null;
  recurring_price: number | null;
  billing_frequency: string | null;
  plan_features: string[] | null;
  plan_terms: string | null;
  plan_disclaimer: string | null;
  highlight_badge: string | null;
  requires_quote: boolean | null;
  display_order: number | null;
}

interface AddonService {
  id: string;
  addon_name: string;
  addon_description: string | null;
  addon_category: string | null;
  initial_price: number | null;
  recurring_price: number | null;
  billing_frequency: string | null;
  addon_features: string[] | null;
  addon_terms: string | null;
  addon_disclaimer: string | null;
  highlight_badge: string | null;
  display_order: number | null;
}

type UpsellSelection =
  | { kind: 'plan'; plan: ServicePlan }
  | { kind: 'addon'; addon: AddonService };

const OTHER_PEST_OPTION_VALUE = '__other__';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToBase64(
  file: File
): Promise<{ base64: string; dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, dataUrl, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const DAY_NAME_TO_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function formatScheduledTime(
  value: string | null | undefined,
  timezone: string
): string {
  if (!value) return '';
  // Accept ISO timestamps and plain HH:mm strings.
  const iso = /T/.test(value) ? value : null;
  try {
    if (iso) {
      return new Date(iso).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone,
      });
    }
    const [hStr, mStr = '00'] = value.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (Number.isNaN(h)) return value;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = ((h + 11) % 12) + 1;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  } catch {
    return value;
  }
}

function nextOccurrenceOfDay(dayName: string): string | null {
  const target = DAY_NAME_TO_INDEX[dayName];
  if (target === undefined) return null;
  const now = new Date();
  const today = now.getDay();
  // Pick the upcoming occurrence — same-day picks roll to next week.
  const diff = ((target - today + 7) % 7) || 7;
  const d = new Date(now);
  d.setDate(now.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function getCustomerDisplayName(c: CustomerResult): string {
  const parts = [c.first_name, c.last_name].filter(Boolean);
  return parts.length > 0
    ? parts.join(' ')
    : (c.email ?? `Customer #${c.id.slice(0, 8)}`);
}

function getPrimaryAddress(c: CustomerResult): ServiceAddress | null {
  // Prefer the nested primary service address from the search API
  if (c.primary_service_address?.length) {
    return c.primary_service_address[0].service_address ?? null;
  }
  // Fall back to direct customer address fields
  if (c.address) {
    return {
      id: c.id,
      street_address: c.address,
      city: c.city ?? '',
      state: c.state ?? '',
      zip_code: c.zip_code ?? '',
    };
  }
  return null;
}

function normalizeForMatching(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getOptionKeywords(option: PestOption): Set<string> {
  const combined = `${option.name} ${option.slug}`.toLowerCase();
  const tokens = new Set(
    combined
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/-/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
  );

  if (
    tokens.has('rodent') ||
    tokens.has('rodents') ||
    tokens.has('rat') ||
    tokens.has('rats') ||
    tokens.has('mouse') ||
    tokens.has('mice')
  ) {
    ['rodent', 'rodents', 'rat', 'rats', 'mouse', 'mice'].forEach(token =>
      tokens.add(token)
    );
  }

  if (
    tokens.has('cockroach') ||
    tokens.has('cockroaches') ||
    tokens.has('roaches')
  ) {
    ['roach', 'roaches', 'cockroach', 'cockroaches'].forEach(token =>
      tokens.add(token)
    );
  }

  if (tokens.has('termite') || tokens.has('termites')) {
    ['termite', 'termites'].forEach(token => tokens.add(token));
  }

  if (tokens.has('mosquito') || tokens.has('mosquitoes')) {
    ['mosquito', 'mosquitoes'].forEach(token => tokens.add(token));
  }

  if (tokens.has('bed') || tokens.has('bug') || tokens.has('bugs')) {
    ['bedbug', 'bedbugs', 'bed', 'bug', 'bugs'].forEach(token =>
      tokens.add(token)
    );
  }

  if (tokens.has('ant') || tokens.has('ants')) {
    ['ant', 'ants'].forEach(token => tokens.add(token));
  }

  if (tokens.has('spider') || tokens.has('spiders')) {
    ['spider', 'spiders'].forEach(token => tokens.add(token));
  }

  if (tokens.has('flea') || tokens.has('fleas')) {
    ['flea', 'fleas'].forEach(token => tokens.add(token));
  }

  if (tokens.has('tick') || tokens.has('ticks')) {
    ['tick', 'ticks'].forEach(token => tokens.add(token));
  }

  if (
    tokens.has('wasp') ||
    tokens.has('wasps') ||
    tokens.has('hornet') ||
    tokens.has('hornets')
  ) {
    ['wasp', 'wasps', 'hornet', 'hornets'].forEach(token => tokens.add(token));
  }

  return tokens;
}

function findBestPestMatch(
  aiResult: AIResult,
  pestOptions: PestOption[]
): PestOption | null {
  if (pestOptions.length === 0) return null;

  const candidateText = normalizeForMatching(
    [
      aiResult.suggested_pest_type,
      aiResult.service_category,
      aiResult.issue_detected,
      aiResult.ai_summary,
    ]
      .filter(Boolean)
      .join(' ')
  );

  if (!candidateText) return null;

  const rawTokens = new Set(candidateText.split(' ').filter(Boolean));

  // Expand rodent-family synonyms in both directions so "rodents" matches "Mice & Rats" options
  if (
    rawTokens.has('rodent') ||
    rawTokens.has('rodents') ||
    rawTokens.has('rat') ||
    rawTokens.has('rats') ||
    rawTokens.has('mouse') ||
    rawTokens.has('mice')
  ) {
    ['rodent', 'rodents', 'rat', 'rats', 'mouse', 'mice'].forEach(t =>
      rawTokens.add(t)
    );
  }
  // Expand cockroach synonyms
  if (
    rawTokens.has('roach') ||
    rawTokens.has('roaches') ||
    rawTokens.has('cockroach') ||
    rawTokens.has('cockroaches')
  ) {
    ['roach', 'roaches', 'cockroach', 'cockroaches'].forEach(t =>
      rawTokens.add(t)
    );
  }

  const candidateTokens = rawTokens;
  let bestMatch: { option: PestOption; score: number } | null = null;

  pestOptions.forEach(option => {
    const normalizedName = normalizeForMatching(option.name);
    const normalizedSlug = normalizeForMatching(option.slug);
    const optionKeywords = getOptionKeywords(option);

    let score = 0;

    if (normalizedName && candidateText.includes(normalizedName)) {
      score += 6;
    }

    if (normalizedSlug && candidateText.includes(normalizedSlug)) {
      score += 5;
    }

    optionKeywords.forEach(keyword => {
      if (candidateTokens.has(keyword) || candidateText.includes(keyword)) {
        score += 1;
      }
    });

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { option, score };
    }
  });

  const result = bestMatch as { option: PestOption; score: number } | null;
  return result && result.score >= 3 ? result.option : null;
}

// ─── Step components ──────────────────────────────────────────────────────────

function StepTypeSelect({ onSelect }: { onSelect: (type: LeadType) => void }) {
  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Select Opportunity Type</h2>
      <p className={styles.stepDesc}>What kind of opportunity did you find?</p>
      <div className={styles.typeCards}>
        <button
          className={styles.typeCard}
          onClick={() => onSelect('new-lead')}
        >
          <span className={styles.typeCardIcon}>
            <UserPlus size={32} strokeWidth={1.5} />
          </span>
          <span className={styles.typeCardLabel}>New Lead</span>
          <span className={styles.typeCardSub}>New customer opportunity</span>
        </button>
        <button className={styles.typeCard} onClick={() => onSelect('upsell')}>
          <span className={styles.typeCardIcon}>
            <TrendingUp size={32} strokeWidth={1.5} />
          </span>
          <span className={styles.typeCardLabel}>Upsell Opportunity</span>
          <span className={styles.typeCardSub}>
            Additional service for existing customer
          </span>
        </button>
        <div className={styles.typeCardDisabled}>
          <span className={styles.typeCardIcon}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="33"
              viewBox="0 0 83 85"
              fill="none"
            >
              <path
                d="M61.908 1.14612C61.7742 1.39088 61.5582 1.67482 61.2714 1.9855C61.0086 2.29524 60.6999 2.65469 60.308 3.0294C60.1358 3.20462 59.9563 3.3826 59.7719 3.56548L59.7708 3.56657L59.7697 3.56768C59.5484 3.7871 59.3198 4.01382 59.0882 4.25106C58.6504 4.67548 58.1802 5.185 57.7357 5.7414C57.2923 6.3217 56.9388 7.05409 56.7278 7.7569C56.5054 8.47214 56.3546 9.18454 56.2154 9.88451C56.05 10.6919 55.8892 11.4945 55.7321 12.2778C55.4525 13.6727 55.1851 15.0066 54.9267 16.1976C55.4373 16.0936 55.9375 16.0259 56.4406 16.03C56.6609 14.8547 56.8866 13.5548 57.1179 12.2223L57.1183 12.2199C57.2383 11.5289 57.3597 10.8293 57.4827 10.1337L57.4865 10.1124C57.7387 8.69759 57.9736 7.37979 58.6983 6.44567C59.0729 5.93993 59.4734 5.48106 59.8987 5.04516C60.3117 4.59778 60.7256 4.1743 61.0936 3.80053C61.4616 3.42677 61.8047 3.03004 62.0895 2.67154C62.3992 2.336 62.6257 2.01573 62.7805 1.6983C63.1159 1.1103 63.306 0.77949 63.306 0.77949C63.4398 0.534728 63.3555 0.226755 63.122 0.0803368C62.8761 -0.0775624 62.5682 0.00646156 62.4105 0.25217L62.3303 0.339161C62.3303 0.339161 62.1745 0.632688 61.8716 1.13559L61.908 1.14612Z"
                fill="currentColor"
              />
              <path
                d="M44.1292 8.87799L38.7822 21.7096L38.6513 22.0261L40.6944 31.3684L41.05 30.9831C41.6809 30.2996 42.4151 29.8036 43.203 29.4491L41.1725 22.1897L45.7362 9.23348L45.8326 8.95427L45.7512 8.71802L44.5853 5.06435C44.4751 4.70951 44.1077 4.50852 43.752 4.59444C43.3848 4.69278 43.1602 5.06087 43.2475 5.44057L44.1407 8.86556L44.1292 8.87799Z"
                fill="currentColor"
              />
              <path
                d="M54.7671 40.1642L54.7722 40.1506L54.7607 40.163L54.7671 40.1642Z"
                fill="currentColor"
              />
              <path
                d="M54.7671 40.1642C54.4647 40.9617 54.0426 41.7397 53.4154 42.4194L53.0598 42.8046L62.5355 44.094L62.8405 43.9382L75.2034 37.5821L78.6889 38.1985C79.0504 38.256 79.4003 38.0266 79.4814 37.6642C79.574 37.2894 79.3433 36.9154 78.9569 36.8349L75.2217 35.9649L74.9796 35.9026L74.7091 36.0211L62.1468 41.5949L54.7671 40.1642Z"
                fill="currentColor"
              />
              <path
                d="M70.7192 26.3161C71.5397 26.0801 72.3829 25.8376 73.2331 25.5912C73.9197 25.3964 74.6177 25.1892 75.3129 24.9103C76.009 24.6552 76.7108 24.2443 77.2413 23.7444C77.7489 23.2693 78.2307 22.7473 78.6187 22.277C78.9823 21.8363 79.3366 21.4276 79.6715 21.0413L79.6722 21.0404L79.7389 20.9635C80.0811 20.5428 80.4147 20.2064 80.7024 19.9196C80.9892 19.6089 81.2549 19.3709 81.4882 19.218C81.9652 18.8758 82.2205 18.6741 82.2205 18.6741L82.3008 18.5871C82.5341 18.4342 82.5932 18.1206 82.44 17.8872C82.2869 17.6538 81.9493 17.5953 81.716 17.7482C81.716 17.7482 81.4014 17.9642 80.8421 18.3455C80.5381 18.5252 80.2494 18.7881 79.9273 19.1121C79.5927 19.4247 79.2237 19.7745 78.8816 20.1952C78.535 20.5707 78.1791 20.9785 77.8033 21.4091L77.7365 21.4857C77.3121 21.9455 76.9106 22.3805 76.4365 22.7944C75.5633 23.5914 74.2685 23.931 72.8784 24.2955L72.8575 24.301C72.5019 24.3937 72.1456 24.4865 71.7902 24.579C70.1442 25.0075 68.5173 25.4311 67.0759 25.8229C67.1202 26.324 67.1051 26.8395 67.0184 27.3578L67.0433 27.3807C68.1687 27.0496 69.4157 26.691 70.7192 26.3161Z"
                fill="currentColor"
              />
              <path
                d="M47.9936 62.2703L37.0735 78.5194L37.0487 78.4964L37.0485 78.4975C36.6872 80.5108 36.3258 82.5248 35.9884 84.5371C35.9407 84.8383 35.6616 85.0409 35.3603 84.993C35.0829 84.9441 34.88 84.6648 34.9162 84.376C35.0751 83.1806 35.2178 81.978 35.3606 80.7743L35.3607 80.7731L35.3609 80.7718C35.4653 79.8914 35.5698 79.0105 35.6808 78.1315L35.6999 78.011L35.7897 77.8637L45.7073 61.4029L44.2456 53.702C44.8771 52.4437 45.6272 51.1568 46.5447 49.8633L48.1634 61.4374L48.2306 61.9137L47.9936 62.2703Z"
                fill="currentColor"
              />
              <path
                d="M56.9817 73.3739L54.7724 69.6777L56.3982 51.8926L56.4582 51.3035L55.973 50.8558L50.2787 45.6691C49.5073 46.43 48.8296 47.1393 48.2217 47.7979L53.8564 52.4003L53.2336 69.8224L53.2203 70.0863L53.3476 70.2729L55.908 74.0629C56.0995 74.3547 56.4859 74.4352 56.7785 74.2679C57.0825 74.0883 57.1856 73.6771 56.9942 73.3854L56.9817 73.3739Z"
                fill="currentColor"
              />
              <path
                d="M34.1805 38.4515C32.952 39.4579 31.7417 40.32 30.5256 41.0387L30.5131 41.0272L22.7199 40.1861L7.10504 51.3885L6.96546 51.4898L6.83444 51.507C6.05471 51.6696 5.27305 51.8272 4.49098 51.9848L4.48951 51.9851C3.21177 52.2427 1.93295 52.5005 0.659647 52.781C0.363201 52.8526 0.0800017 52.6603 0.00811189 52.3638C-0.0398677 52.0664 0.128307 51.7843 0.424753 51.7127C1.71029 51.3991 2.98506 51.066 4.26269 50.7321C4.96474 50.5487 5.66766 50.365 6.3737 50.1842L21.6849 37.988L22.0214 37.7233L34.1805 38.4515Z"
                fill="currentColor"
              />
              <path
                d="M37.9257 34.5532L38.0632 34.3945L32.4262 29.1456L31.941 28.6979L31.3587 28.8047L13.7606 31.8479L9.89955 29.9412C9.59438 29.7976 9.21571 29.9084 9.05997 30.2019C8.88129 30.5203 8.99244 30.8991 9.31102 31.078L13.2937 33.3271L13.4898 33.4391L13.7643 33.4163L31.0808 31.402L36.1191 36.6506L36.1056 36.6152C36.6735 36 37.2797 35.2996 37.9257 34.5532Z"
                fill="currentColor"
              />
              <path
                d="M39.8167 56.993C38.5514 60.1231 37.3348 63.1328 34.9048 66.0464L34.856 66.0244C26.5665 75.9791 13.9735 79.3151 10.6522 76.2496C7.34232 73.1717 9.63653 60.3531 18.9088 51.3055C21.6207 48.6604 24.5184 47.2072 27.5304 45.6967C30.416 44.2496 33.4065 42.7499 36.4393 40.0991C37.6253 39.0594 38.8454 37.6344 40.2189 36.0302C41.0816 35.0225 42.0049 33.9442 43.0183 32.8462C44.0965 31.6781 45.7451 31.2896 47.4485 31.3658C47.7068 30.4342 47.895 29.5304 48.0755 28.6638C48.5447 26.4111 48.9614 24.4105 50.4193 22.8309C52.1283 20.9793 54.6537 18.2931 58.0149 19.094C58.1495 18.5738 58.3443 18.0632 58.6587 17.5479C58.8393 17.2773 59.1002 16.9198 59.2981 16.7802C59.6232 16.5279 59.9367 16.288 60.3766 16.2107C60.8165 16.1335 61.3245 16.257 61.6211 16.4848C61.9301 16.724 62.0957 16.9689 62.201 17.2042C62.4003 17.6494 62.4156 18.0484 62.4257 18.3128C62.4262 18.3279 62.4268 18.3425 62.4274 18.3567C62.4505 18.6311 62.397 18.7889 62.397 18.7889C62.397 18.7889 62.2965 18.6731 62.1089 18.477C61.9338 18.2924 61.6716 18.0274 61.3875 17.8111L61.3788 17.8046C61.2453 17.7039 61.1008 17.595 60.9837 17.5996C60.8857 17.584 60.8447 17.6057 60.7885 17.6355C60.7756 17.6423 60.7619 17.6495 60.7466 17.6569C60.6758 17.6836 60.5248 17.7973 60.4091 17.8977L59.9388 18.4072C59.891 18.4833 59.8413 18.5602 59.791 18.6383C59.5811 18.9638 59.3589 19.3085 59.2002 19.6817C59.5851 20.0984 59.8808 20.6896 60.1728 21.2734C60.318 21.5636 60.4622 21.8519 60.616 22.1162C60.8918 22.2484 61.1895 22.3705 61.4892 22.4934C62.0919 22.7405 62.7022 22.9908 63.1559 23.3327C63.5025 23.1565 63.8307 22.9047 64.1382 22.6688C64.2159 22.6092 64.2922 22.5507 64.3672 22.4946L64.8375 21.985C64.9283 21.8617 65.0181 21.7145 65.0506 21.6294C65.0567 21.6135 65.0628 21.5993 65.0686 21.5859C65.0937 21.5275 65.1121 21.4848 65.0887 21.3884C65.0724 21.2813 64.9585 21.1301 64.8456 21.0029C64.6073 20.7369 64.3222 20.4968 64.1241 20.337C63.9282 20.1968 63.818 20.0998 63.7948 20.079C63.8043 20.0808 63.828 20.0748 63.8643 20.0656C63.937 20.0473 64.0599 20.0162 64.2186 20.01C64.4931 19.9871 64.8871 19.9596 65.3855 20.1434C65.6409 20.241 65.8983 20.3865 66.1614 20.6754C66.4361 20.9519 66.576 21.4493 66.5341 21.894C66.4923 22.3386 66.2782 22.6704 66.0642 23.0021C65.9473 23.1998 65.6395 23.4696 65.4009 23.6787L65.3626 23.7124C64.874 24.067 64.3807 24.302 63.8729 24.4778C64.9401 27.7642 62.4645 30.4963 60.7554 32.348C59.3039 33.9206 57.3539 34.4978 55.1624 35.1465C54.306 35.4 53.4127 35.6643 52.4979 36.0033C52.6987 37.7076 52.4548 39.3696 51.3766 40.5377C50.3693 41.6291 49.3725 42.6313 48.4394 43.5694C46.95 45.0669 45.6227 46.4015 44.6732 47.6758C42.2774 50.9054 41.0249 54.0041 39.8167 56.993Z"
                fill="currentColor"
              />
              <path
                d="M63.7902 20.0748C63.7902 20.0748 63.7917 20.0762 63.7948 20.079C63.7918 20.0784 63.7903 20.0771 63.7902 20.0748Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span className={styles.typeCardLabel}>Termite Renewal</span>
          <span className={styles.typeCardSub}>
            Renew termite protection plan
          </span>
          <span className={styles.typeCardComingSoon}>Coming Soon</span>
        </div>
      </div>
    </div>
  );
}

function StepPhotos({
  photos,
  onPhotosChange,
}: {
  photos: PhotoPreview[];
  onPhotosChange: (photos: PhotoPreview[]) => void;
}) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - photos.length;
    const toAdd = files.slice(0, remaining);

    const newPreviews: PhotoPreview[] = await Promise.all(
      toAdd.map(async file => {
        const { base64, dataUrl, mimeType } = await fileToBase64(file);
        return { file, dataUrl, base64, mimeType };
      })
    );

    onPhotosChange([...photos, ...newPreviews]);
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  const remaining = 5 - photos.length;

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Add Photos</h2>
      <p className={styles.stepDesc}>Capture up to 5 photos of the issue</p>

      <div className={styles.photoGrid}>
        {photos.map((photo, i) => (
          <div key={i} className={styles.photoThumb}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.dataUrl} alt={`Photo ${i + 1}`} />
            <button
              className={styles.removePhotoBtn}
              onClick={() => removePhoto(i)}
              aria-label="Remove photo"
            >
              ×
            </button>
          </div>
        ))}
        {remaining > 0 && (
          <button
            className={styles.photoPlaceholder}
            onClick={() => cameraInputRef.current?.click()}
            aria-label="Add photo"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="13"
                r="4"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            Photo
          </button>
        )}
      </div>

      {remaining > 0 && (
        <div className={styles.photoActions}>
          <button
            className={styles.photoActionBtn}
            onClick={() => cameraInputRef.current?.click()}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="13"
                r="4"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            Camera
          </button>
          <button
            className={styles.photoActionBtn}
            onClick={() => libraryInputRef.current?.click()}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle
                cx="8.5"
                cy="8.5"
                r="1.5"
                stroke="currentColor"
                strokeWidth="2"
              />
              <polyline
                points="21 15 16 10 5 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Gallery
          </button>
        </div>
      )}

      {/* Camera — no multiple, capture forces camera */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {/* Library — multiple allowed, no capture */}
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}

function SegmentedToggle({
  label,
  value,
  onChange,
  fieldId,
  showError = false,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  fieldId?: string;
  showError?: boolean;
}) {
  const wrapperClass = `${styles.propertyTypeField} ${showError ? styles.propertyTypeFieldError : ''}`;
  const groupClass = `${styles.pillGroup} ${showError ? styles.pillGroupError : ''}`;
  return (
    <div className={wrapperClass} id={fieldId} data-unset={value === null}>
      <span className={styles.toggleLabel}>
        {label} <span className={styles.requiredMark}>*</span>
      </span>
      <div className={groupClass} role="radiogroup">
        <button
          type="button"
          role="radio"
          aria-checked={value === true}
          className={`${styles.pill} ${value === true ? styles.pillActive : ''}`}
          onClick={() => onChange(true)}
        >
          Yes
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === false}
          className={`${styles.pill} ${value === false ? styles.pillActive : ''}`}
          onClick={() => onChange(false)}
        >
          No
        </button>
      </div>
      {showError && (
        <span className={styles.fieldErrorMsg}>Please select an answer.</span>
      )}
    </div>
  );
}

function StepAIReview({
  aiResult,
  notes,
  customerMentioned,
  isHighPriority,
  techMentioned,
  propertyType,
  showPropertyType,
  pestOptions,
  selectedPestValue,
  otherPestValue,
  isPestOptionsLoading,
  attempted,
  onAIResultChange,
  onPestValueChange,
  onOtherPestChange,
  onNotesChange,
  onCustomerMentionedChange,
  onHighPriorityChange,
  onTechMentionedChange,
  onPropertyTypeChange,
}: {
  aiResult: AIResult;
  notes: string;
  customerMentioned: boolean | null;
  isHighPriority: boolean | null;
  techMentioned: boolean | null;
  propertyType: 'residential' | 'commercial' | null;
  showPropertyType: boolean;
  pestOptions: PestOption[];
  selectedPestValue: string;
  otherPestValue: string;
  isPestOptionsLoading: boolean;
  attempted: boolean;
  onAIResultChange: (result: AIResult) => void;
  onPestValueChange: (value: string) => void;
  onOtherPestChange: (value: string) => void;
  onNotesChange: (notes: string) => void;
  onCustomerMentionedChange: (v: boolean) => void;
  onHighPriorityChange: (v: boolean) => void;
  onTechMentionedChange: (v: boolean) => void;
  onPropertyTypeChange: (v: 'residential' | 'commercial') => void;
}) {
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startDictation = () => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any[])
        .map((r: any) => r[0].transcript)
        .join(' ');
      onNotesChange(notes + (notes ? ' ' : '') + transcript);
    };

    recognition.onend = () => setIsDictating(false);
    recognition.onerror = () => setIsDictating(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsDictating(true);
  };

  const stopDictation = () => {
    recognitionRef.current?.stop();
    setIsDictating(false);
  };

  const hasSpeechSupport =
    typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition);

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Review</h2>
      <p className={styles.stepDesc}>Review and edit findings</p>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Issue Detected</label>
        <input
          className={styles.fieldInput}
          value={aiResult.issue_detected}
          onChange={e =>
            onAIResultChange({ ...aiResult, issue_detected: e.target.value })
          }
          placeholder="What issue was found?"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Primary Pest Concern</label>
        <div className={styles.selectWrapper}>
          <select
            className={styles.fieldSelect}
            value={selectedPestValue}
            onChange={e => onPestValueChange(e.target.value)}
            disabled={isPestOptionsLoading}
          >
            <option value="">Select pest concern</option>
            {pestOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
            <option value={OTHER_PEST_OPTION_VALUE}>Other</option>
          </select>
          <ChevronDown size={16} className={styles.selectChevron} />
        </div>
        {selectedPestValue === OTHER_PEST_OPTION_VALUE && (
          <input
            className={styles.fieldInput}
            value={otherPestValue}
            onChange={e => onOtherPestChange(e.target.value)}
            placeholder="Type the pest concern"
          />
        )}
        {isPestOptionsLoading && (
          <p className={styles.fieldHint}>Loading company pest options...</p>
        )}
        {!isPestOptionsLoading && pestOptions.length === 0 && (
          <p className={styles.fieldHint}>
            No company pest options are configured yet.
          </p>
        )}
        {aiResult.service_category && (
          <p className={styles.fieldHint}>
            Service type: {aiResult.service_category}
          </p>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Summary</label>
        <textarea
          className={`${styles.fieldTextarea} ${styles.fieldTextareaAuto}`}
          value={aiResult.ai_summary}
          onChange={e => {
            onAIResultChange({ ...aiResult, ai_summary: e.target.value });
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          ref={el => {
            if (el) {
              el.style.height = 'auto';
              el.style.height = `${el.scrollHeight}px`;
            }
          }}
          placeholder="Summary of findings and recommended action"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Note To Sales</label>
        <textarea
          className={styles.fieldTextarea}
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          placeholder="Add any additional notes about this opportunity…"
          rows={4}
        />
        {hasSpeechSupport && (
          <button
            className={`${styles.dictateBtn} ${isDictating ? styles.dictateBtnActive : ''}`}
            onClick={isDictating ? stopDictation : startDictation}
            type="button"
          >
            🎙️ {isDictating ? 'Stop Dictation' : 'Dictate Notes'}
          </button>
        )}
      </div>

      <div className={styles.toggleGroup}>
        <p className={styles.toggleGroupHint}>
          <span className={styles.requiredMark}>*</span> All questions below
          are required.
        </p>
        {attempted &&
          (techMentioned === null ||
            customerMentioned === null ||
            isHighPriority === null ||
            (showPropertyType && propertyType === null)) && (
            <p className={styles.toggleGroupError} role="alert">
              Please answer each question before submitting.
            </p>
          )}
        <SegmentedToggle
          label="Discussed with customer"
          value={techMentioned}
          onChange={onTechMentionedChange}
          fieldId="review-tech-mentioned"
          showError={attempted && techMentioned === null}
        />
        <SegmentedToggle
          label="Customer mentioned this issue"
          value={customerMentioned}
          onChange={onCustomerMentionedChange}
          fieldId="review-customer-mentioned"
          showError={attempted && customerMentioned === null}
        />
        <SegmentedToggle
          label="High priority"
          value={isHighPriority}
          onChange={onHighPriorityChange}
          fieldId="review-high-priority"
          showError={attempted && isHighPriority === null}
        />
        {showPropertyType && (
          <div
            id="review-property-type"
            data-unset={propertyType === null}
            className={`${styles.propertyTypeField} ${
              attempted && propertyType === null
                ? styles.propertyTypeFieldError
                : ''
            }`}
          >
            <span className={styles.toggleLabel}>
              Property type <span className={styles.requiredMark}>*</span>
            </span>
            <div
              className={`${styles.pillGroup} ${
                attempted && propertyType === null ? styles.pillGroupError : ''
              }`}
              role="radiogroup"
            >
              {(['residential', 'commercial'] as const).map(option => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={propertyType === option}
                  className={`${styles.pill} ${propertyType === option ? styles.pillActive : ''}`}
                  onClick={() => onPropertyTypeChange(option)}
                >
                  {option === 'residential' ? 'Residential' : 'Commercial'}
                </button>
              ))}
            </div>
            {attempted && propertyType === null && (
              <span className={styles.fieldErrorMsg}>
                Please select an answer.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StepNewCustomer({
  form,
  onChange,
  error,
  companyId,
  isPestPacEnabled,
  onPestPacPick,
}: {
  form: NewCustomerForm;
  onChange: (form: NewCustomerForm) => void;
  error: string | null;
  companyId: string;
  isPestPacEnabled: boolean;
  onPestPacPick: (client: PestPacClientResult) => void;
}) {
  const [pestPacQuery, setPestPacQuery] = useState('');
  const [pestPacResults, setPestPacResults] = useState<PestPacClientResult[]>(
    []
  );
  const [isPestPacSearching, setIsPestPacSearching] = useState(false);
  const [pestPacSearchError, setPestPacSearchError] = useState<string | null>(
    null
  );
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isPestPacEnabled) return;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    const q = pestPacQuery.trim();
    if (q.length < 2) {
      setPestPacResults([]);
      setPestPacSearchError(null);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setIsPestPacSearching(true);
      setPestPacSearchError(null);
      try {
        const res = await fetch(
          `/api/pestpac/clients/search?q=${encodeURIComponent(q)}&companyId=${companyId}`
        );
        if (res.ok) {
          const data = await res.json();
          setPestPacResults(data.clients ?? []);
        } else {
          const data = await res.json().catch(() => ({}));
          setPestPacSearchError(
            data.error ??
              'PestPac search failed. Check your integration settings.'
          );
          setPestPacResults([]);
        }
      } catch {
        setPestPacSearchError('PestPac search failed.');
      } finally {
        setIsPestPacSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [pestPacQuery, companyId, isPestPacEnabled]);

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>New Lead</h2>
      <p className={styles.stepDesc}>Enter the customer&apos;s details</p>

      {isPestPacEnabled && (
        <div className={styles.pestPacSearchBlock}>
          <label className={styles.fieldLabel}>
            Search PestPac
            <span className={styles.fieldHint}>
              {' '}
              — pick an existing client to autofill
            </span>
          </label>
          <div className={styles.searchInputWrapper}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by name, address, or phone…"
              value={pestPacQuery}
              onChange={e => setPestPacQuery(e.target.value)}
            />
            {isPestPacSearching && <span className={styles.searchSpinner} />}
          </div>
          {pestPacSearchError && (
            <p className={styles.errorState}>{pestPacSearchError}</p>
          )}
          {pestPacQuery.trim().length >= 2 &&
            !isPestPacSearching &&
            !pestPacSearchError && (
              <div className={styles.customerList}>
                {pestPacResults.length === 0 ? (
                  <p className={styles.emptyState}>
                    No PestPac customers found for &quot;{pestPacQuery}&quot;
                  </p>
                ) : (
                  pestPacResults.map(client => {
                    const nameParts = [
                      client.firstName,
                      client.lastName,
                    ].filter(Boolean);
                    const displayName =
                      nameParts.length > 0
                        ? nameParts.join(' ')
                        : `Client #${client.clientId}`;
                    return (
                      <button
                        type="button"
                        key={client.clientId}
                        className={styles.customerCard}
                        onClick={() => {
                          onPestPacPick(client);
                          setPestPacQuery('');
                          setPestPacResults([]);
                        }}
                      >
                        <div className={styles.customerCardName}>
                          {displayName}
                        </div>
                        {client.primaryAddress && (
                          <div className={styles.customerCardAddr}>
                            {client.primaryAddress.street},{' '}
                            {client.primaryAddress.city},{' '}
                            {client.primaryAddress.state}{' '}
                            {client.primaryAddress.zip}
                          </div>
                        )}
                        <div className={styles.customerCardContact}>
                          {client.phone && <span>{client.phone}</span>}
                          {client.email && <span>{client.email}</span>}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
        </div>
      )}

      <div className={styles.newCustomerRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>First Name</label>
          <input
            className={styles.fieldInput}
            value={form.firstName}
            onChange={e => onChange({ ...form, firstName: e.target.value })}
            placeholder="First name"
            autoCapitalize="words"
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Last Name</label>
          <input
            className={styles.fieldInput}
            value={form.lastName}
            onChange={e => onChange({ ...form, lastName: e.target.value })}
            placeholder="Last name"
            autoCapitalize="words"
          />
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          Phone <span className={styles.fieldRequired}>*</span>
        </label>
        <input
          className={styles.fieldInput}
          type="tel"
          value={form.phone}
          onChange={e => onChange({ ...form, phone: e.target.value })}
          placeholder="Phone number"
          required
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Email</label>
        <input
          className={styles.fieldInput}
          type="email"
          value={form.email}
          onChange={e => onChange({ ...form, email: e.target.value })}
          placeholder="Email address"
          autoCapitalize="none"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Service Address</label>
        <AddressAutocomplete
          value={form.addressInput}
          onChange={val =>
            onChange({ ...form, addressInput: val, addressComponents: null })
          }
          onAddressSelect={components =>
            onChange({
              ...form,
              addressComponents: components,
              addressInput:
                `${components.street_number ? components.street_number + ' ' : ''}${components.route ?? ''}`.trim() ||
                form.addressInput,
            })
          }
          placeholder="Start typing address…"
        />
        {form.addressComponents && (
          <p className={styles.fieldHint}>
            {[
              form.addressComponents.locality,
              form.addressComponents.administrative_area_level_1,
              form.addressComponents.postal_code,
            ]
              .filter(Boolean)
              .join(', ')}
          </p>
        )}
      </div>

      {error && <p className={styles.errorState}>{error}</p>}
    </div>
  );
}

function StepServiceDetails({
  companyId,
  locationId,
  suggestedPestType,
  matchedPestOption,
  selectedPestValue,
  selectedPlan,
  onPlanSelect,
}: {
  companyId: string;
  locationId: string | null;
  suggestedPestType: string | null;
  matchedPestOption: string | null;
  selectedPestValue: string;
  selectedPlan: ServicePlan | null;
  onPlanSelect: (plan: ServicePlan) => void;
}) {
  const [orders, setOrders] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Plan selection state
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [recommendedId, setRecommendedId] = useState<string | null>(null);

  useEffect(() => {
    if (!locationId) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(
          `/api/pestpac/locations/${encodeURIComponent(locationId)}/services?companyId=${companyId}`
        );
        const data = await res.json();
        setOrders(data.orders ?? []);
        setServiceTypes(data.serviceTypes ?? []);
        if (data.error) setFetchError(data.error);
      } catch {
        setFetchError('Failed to load service details');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [locationId, companyId]);

  // Fetch company service plans
  useEffect(() => {
    if (!companyId) return;
    const fetchPlans = async () => {
      setPlansLoading(true);
      try {
        let data: any;
        if (
          selectedPestValue &&
          selectedPestValue !== OTHER_PEST_OPTION_VALUE
        ) {
          const res = await fetch(
            `/api/service-plans/${companyId}/by-pest/${selectedPestValue}`
          );
          data = await res.json();
          if (
            data.success &&
            Array.isArray(data.data) &&
            data.data.length > 0
          ) {
            const recId = data.cheapest_plan?.id ?? null;
            setRecommendedId(recId);
            // Recommended plan first, rest follow
            const sorted = recId
              ? [
                  data.data.find((p: ServicePlan) => p.id === recId)!,
                  ...data.data.filter((p: ServicePlan) => p.id !== recId),
                ]
              : data.data;
            setPlans(sorted);
            return;
          }
        }
        const res = await fetch(`/api/service-plans/${companyId}`);
        data = await res.json();
        if (data.success && Array.isArray(data.plans)) {
          const byPrice = [...data.plans].sort(
            (a: ServicePlan, b: ServicePlan) =>
              (a.recurring_price ?? 9999) - (b.recurring_price ?? 9999)
          );
          const recId = byPrice[0]?.id ?? null;
          setRecommendedId(recId);
          // Recommended first, then rest in display_order
          const remaining = byPrice.slice(1);
          setPlans(recId ? [byPrice[0], ...remaining] : byPrice);
        }
      } catch {
        // Plans unavailable — non-fatal
      } finally {
        setPlansLoading(false);
      }
    };
    fetchPlans();
  }, [companyId, selectedPestValue]);

  const activeOrders = orders.filter(o => {
    const status = (o?.Status ?? o?.status ?? '').toLowerCase();
    return status === 'active' || status === 'scheduled' || status === 'open';
  });

  const historyOrders = orders.filter(o => {
    const status = (o?.Status ?? o?.status ?? '').toLowerCase();
    return (
      status === 'completed' || status === 'closed' || status === 'cancelled'
    );
  });

  const pestKeywords = [suggestedPestType, matchedPestOption]
    .filter(Boolean)
    .map(s => s!.toLowerCase());

  const isRelevantServiceType = (name: string) => {
    if (!pestKeywords.length) return false;
    const lower = name.toLowerCase();
    return pestKeywords.some(kw => lower.includes(kw) || kw.includes(lower));
  };

  const formatDate = (val: string | null | undefined) => {
    if (!val) return '—';
    try {
      return new Date(val).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return val;
    }
  };

  const formatCurrency = (val: number | null | undefined) => {
    if (val == null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Service Details</h2>
      <p className={styles.stepDesc}>
        {locationId
          ? 'Current services and upsell opportunities from PestPac'
          : 'Select a service plan to add for this customer'}
      </p>

      {!locationId && (
        <p className={styles.serviceUnavailable}>
          No PestPac account linked — showing available plans.
        </p>
      )}

      {locationId && isLoading && (
        <div className={styles.loadingState}>
          <span className={styles.spinnerDark} />
          Loading service details…
        </div>
      )}

      {locationId &&
        !isLoading &&
        fetchError &&
        orders.length === 0 &&
        serviceTypes.length === 0 && (
          <p className={styles.serviceUnavailable}>
            Service history is not available for this customer&apos;s PestPac
            account. You can still proceed to submit the lead.
          </p>
        )}

      {locationId && !isLoading && (
        <>
          {/* Current Services */}
          <div className={styles.serviceSection}>
            <p className={styles.serviceSectionTitle}>Current Services</p>
            {activeOrders.length === 0 ? (
              <p className={styles.serviceEmpty}>No active services found</p>
            ) : (
              <div className={styles.serviceList}>
                {activeOrders.map((o, i) => (
                  <div key={o?.OrderID ?? i} className={styles.serviceRow}>
                    <div className={styles.serviceRowMain}>
                      <span className={styles.serviceRowName}>
                        {o?.ServiceTypeName ?? o?.serviceTypeName ?? 'Service'}
                      </span>
                      {(o?.BillingFrequency ?? o?.billingFrequency) && (
                        <span className={styles.serviceRowBadge}>
                          {o?.BillingFrequency ?? o?.billingFrequency}
                        </span>
                      )}
                    </div>
                    <div className={styles.serviceRowMeta}>
                      {(o?.Price ?? o?.price) != null && (
                        <span>{formatCurrency(o?.Price ?? o?.price)}</span>
                      )}
                      {(o?.NextServiceDate ?? o?.nextServiceDate) && (
                        <span>
                          Next:{' '}
                          {formatDate(o?.NextServiceDate ?? o?.nextServiceDate)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Service History */}
          {historyOrders.length > 0 && (
            <div className={styles.serviceSection}>
              <p className={styles.serviceSectionTitle}>Service History</p>
              <div className={styles.serviceList}>
                {historyOrders.slice(0, 5).map((o, i) => (
                  <div key={o?.OrderID ?? i} className={styles.serviceRow}>
                    <div className={styles.serviceRowMain}>
                      <span className={styles.serviceRowName}>
                        {o?.ServiceTypeName ?? o?.serviceTypeName ?? 'Service'}
                      </span>
                      <span className={styles.serviceRowStatus}>
                        {o?.Status ?? o?.status ?? ''}
                      </span>
                    </div>
                    <div className={styles.serviceRowMeta}>
                      <span>{formatDate(o?.OrderDate ?? o?.orderDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Service Types */}
          {serviceTypes.length > 0 && (
            <div className={styles.serviceSection}>
              <p className={styles.serviceSectionTitle}>Available Services</p>
              {pestKeywords.length > 0 && (
                <p className={styles.serviceHint}>
                  Highlighted services may match the detected pest issue
                </p>
              )}
              <div className={styles.serviceList}>
                {serviceTypes
                  .filter(st => st?.Active !== false)
                  .map((st, i) => {
                    const name =
                      st?.ServiceTypeName ??
                      st?.serviceTypeName ??
                      st?.Name ??
                      st?.name ??
                      '';
                    const relevant = isRelevantServiceType(name);
                    return (
                      <div
                        key={st?.ServiceTypeID ?? i}
                        className={`${styles.serviceRow} ${relevant ? styles.serviceRowHighlighted : ''}`}
                      >
                        <span className={styles.serviceRowName}>{name}</span>
                        {(st?.Description ?? st?.description) ? (
                          <span className={styles.serviceRowDesc}>
                            {st?.Description ?? st?.description}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Service Plan Selection */}
      <div className={styles.serviceSection}>
        <p className={styles.serviceSectionTitle}>Select a Service Plan</p>
        {suggestedPestType && (
          <p className={styles.serviceHint}>
            Detected: <strong>{suggestedPestType}</strong>
          </p>
        )}
        {plansLoading ? (
          <div className={styles.loadingState}>
            <span className={styles.spinnerDark} />
            Loading plans…
          </div>
        ) : plans.length === 0 ? (
          <p className={styles.serviceEmpty}>No active service plans found.</p>
        ) : (
          <div className={styles.planCardList}>
            {plans.map(plan => {
              const isSelected = selectedPlan?.id === plan.id;
              const isRecommended = plan.id === recommendedId;
              const features: string[] = Array.isArray(plan.plan_features)
                ? plan.plan_features
                : [];
              return (
                <button
                  key={plan.id}
                  className={`${styles.planCard} ${isSelected ? styles.planCardSelected : ''}`}
                  onClick={() => onPlanSelect(plan)}
                  type="button"
                >
                  <div className={styles.planCardHeader}>
                    <div className={styles.planCardNameRow}>
                      <span className={styles.planCardName}>
                        {plan.plan_name}
                      </span>

                      {isRecommended && (
                        <span className={styles.planCardBadge}>
                          {plan.highlight_badge || 'Recommended'}
                        </span>
                      )}
                    </div>
                    <div className={styles.planCardPrice}>
                      {plan.recurring_price != null ? (
                        <div className={styles.planCardPriceRow}>
                          <span className={styles.planCardPriceAmount}>
                            {formatPrice(plan.recurring_price)}
                          </span>
                          <span className={styles.planCardPriceFreq}>
                            {formatFrequency(plan.billing_frequency)}
                          </span>
                        </div>
                      ) : (
                        <span className={styles.planCardPriceAmount}>
                          Contact for pricing
                        </span>
                      )}
                      {plan.initial_price != null && plan.initial_price > 0 && (
                        <span className={styles.planCardInitial}>
                          + {formatPrice(plan.initial_price)} initial
                        </span>
                      )}
                    </div>
                  </div>
                  {plan.plan_description && (
                    <p className={styles.planCardDesc}>
                      {plan.plan_description}
                    </p>
                  )}
                  {features.length > 0 && (
                    <ul className={styles.planCardFeatures}>
                      {features.map((f, i) => (
                        <li key={i} className={styles.planCardFeatureItem}>
                          <span className={styles.planCardFeatureCheck}>✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StepSelectSite({
  companyId,
  selectedCustomer,
  onSelectCustomer,
  recentCustomers,
  todayRouteStops,
  isTodayRouteLoading,
  onPickRouteStop,
  onAddNewCustomer,
  isSyncingCustomer,
  routeStopPickError,
  companyTimezone,
}: {
  companyId: string;
  selectedCustomer: CustomerResult | null;
  onSelectCustomer: (customer: CustomerResult) => void;
  recentCustomers: RecentCustomer[];
  todayRouteStops: TodayRouteStop[];
  isTodayRouteLoading: boolean;
  onPickRouteStop: (stop: TodayRouteStop) => void;
  onAddNewCustomer: () => void;
  isSyncingCustomer: boolean;
  routeStopPickError: string | null;
  companyTimezone: string;
}) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim() || q.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/customers/search?q=${encodeURIComponent(q)}&companyId=${companyId}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.customers ?? []);
        }
      } finally {
        setIsSearching(false);
      }
    },
    [companyId]
  );

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => doSearch(query), 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [query, doSearch]);

  const isSearchActive = query.length >= 2;

  const renderCustomerCard = (customer: CustomerResult) => {
    const addr = getPrimaryAddress(customer);
    const isSelected = selectedCustomer?.id === customer.id;
    return (
      <button
        key={customer.id}
        className={`${styles.customerCard} ${isSelected ? styles.customerCardSelected : ''}`}
        onClick={() => onSelectCustomer(customer)}
      >
        <div className={styles.customerCardName}>
          {getCustomerDisplayName(customer)}
        </div>
        {addr && (
          <div className={styles.customerCardAddr}>
            {addr.street_address}, {addr.city}, {addr.state} {addr.zip_code}
          </div>
        )}
        <div className={styles.customerCardContact}>
          {customer.phone && <span>{customer.phone}</span>}
          {customer.email && <span>{customer.email}</span>}
        </div>
      </button>
    );
  };

  const renderRecentCard = (recent: RecentCustomer) => {
    const isSelected = selectedCustomer?.id === recent.id;
    const nameParts = [recent.first_name, recent.last_name].filter(Boolean);
    const displayName =
      nameParts.length > 0
        ? nameParts.join(' ')
        : (recent.email ?? `Customer #${recent.id.slice(0, 8)}`);
    const asCustomer: CustomerResult = {
      id: recent.id,
      first_name: recent.first_name,
      last_name: recent.last_name,
      email: recent.email,
      phone: recent.phone,
      pestpac_client_id: recent.pestpac_client_id ?? null,
      primary_service_address: recent.primaryAddress
        ? [{ service_address: { id: recent.id, ...recent.primaryAddress } }]
        : undefined,
    };
    return (
      <button
        key={recent.id}
        className={`${styles.customerCard} ${isSelected ? styles.customerCardSelected : ''}`}
        onClick={() => onSelectCustomer(asCustomer)}
      >
        <div className={styles.customerCardName}>{displayName}</div>
        {recent.primaryAddress && (
          <div className={styles.customerCardAddr}>
            {recent.primaryAddress.street_address}, {recent.primaryAddress.city}
            , {recent.primaryAddress.state} {recent.primaryAddress.zip_code}
          </div>
        )}
        <div className={styles.customerCardContact}>
          {recent.phone && <span>{recent.phone}</span>}
          {recent.email && <span>{recent.email}</span>}
        </div>
      </button>
    );
  };

  const showRecents = recentCustomers.length > 0;

  const renderRouteStopCard = (stop: TodayRouteStop) => {
    return (
      <button
        key={stop.routeStopId}
        className={styles.customerCard}
        onClick={() => onPickRouteStop(stop)}
        disabled={isSyncingCustomer}
      >
        <div className={styles.customerCardName}>{stop.clientName}</div>
        {stop.address && (
          <div className={styles.customerCardAddr}>{stop.address}</div>
        )}
        {stop.scheduledTime && (
          <div className={styles.customerCardContact}>
            <span>{formatScheduledTime(stop.scheduledTime, companyTimezone)}</span>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Select Customer</h2>
      <p className={styles.stepDesc}>
        Pick a customer from today&apos;s route or add a new one.
      </p>

      <button
        type="button"
        className={styles.addNewCustomerBtn}
        onClick={onAddNewCustomer}
      >
        + Add New Customer
      </button>

      {routeStopPickError && (
        <p className={styles.errorState}>{routeStopPickError}</p>
      )}

      {/* Today's route — only when not actively searching */}
      {query.length < 2 && (
        <div className={styles.customerList}>
          {isTodayRouteLoading && (
            <div className={styles.loadingState}>
              <span className={styles.spinner} />
              Loading today&apos;s route…
            </div>
          )}
          {!isTodayRouteLoading && todayRouteStops.length > 0 && (
            <>
              <p className={styles.listLabel}>Today&apos;s Route</p>
              {todayRouteStops.map(renderRouteStopCard)}
            </>
          )}
        </div>
      )}

      <div className={styles.searchInputWrapper}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search by name or address…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {isSearching && <span className={styles.searchSpinner} />}
      </div>

      <div className={styles.customerList}>
        {/* Manual search results */}
        {isSearchActive && (
          <>
            <p className={styles.listLabel}>Search Results</p>
            {isSearching && (
              <div className={styles.loadingState}>
                <span className={styles.spinner} />
                Searching…
              </div>
            )}
            {!isSearching && searchResults.map(renderCustomerCard)}
            {!isSearching && searchResults.length === 0 && (
              <p className={styles.emptyState}>
                No customers found for &quot;{query}&quot;
              </p>
            )}
          </>
        )}

        {/* Idle state: recents */}
        {!isSearchActive && (
          <>
            {showRecents && (
              <p className={styles.listLabel}>Recent Customers</p>
            )}
            {showRecents && recentCustomers.map(renderRecentCard)}
            {!showRecents && (
              <p className={styles.emptyState}>
                Search above to find a customer
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function formatPrice(price: number | null): string {
  if (price == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);
}

function formatFrequency(freq: string | null): string {
  if (!freq) return '';
  const map: Record<string, string> = {
    monthly: '/mo',
    quarterly: '/qtr',
    'semi-annually': '/semi',
    'semi-annual': '/semi',
    annually: '/yr',
    annual: '/yr',
    'one-time': '',
    weekly: '/wk',
  };
  return map[freq.toLowerCase()] ?? `/${freq}`;
}

function StepServicePlanSelect({
  companyId,
  selectedPlan,
  onPlanSelect,
  suggestedPestType,
  selectedPestValue,
}: {
  companyId: string;
  selectedPlan: ServicePlan | null;
  onPlanSelect: (plan: ServicePlan) => void;
  suggestedPestType: string | null;
  selectedPestValue: string;
}) {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendedId, setRecommendedId] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const fetchPlans = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use by-pest endpoint if we have a selected pest id (not 'other')
        let data: any;
        if (
          selectedPestValue &&
          selectedPestValue !== OTHER_PEST_OPTION_VALUE
        ) {
          const res = await fetch(
            `/api/service-plans/${companyId}/by-pest/${selectedPestValue}`
          );
          data = await res.json();
          if (
            data.success &&
            Array.isArray(data.data) &&
            data.data.length > 0
          ) {
            const recId = data.cheapest_plan?.id ?? null;
            setRecommendedId(recId);
            const sorted = recId
              ? [
                  data.data.find((p: ServicePlan) => p.id === recId)!,
                  ...data.data.filter((p: ServicePlan) => p.id !== recId),
                ]
              : data.data;
            setPlans(sorted);
            return;
          }
        }
        // Fallback: all plans for the company
        const res = await fetch(`/api/service-plans/${companyId}`);
        data = await res.json();
        if (data.success && Array.isArray(data.plans)) {
          const byPrice = [...data.plans].sort(
            (a: ServicePlan, b: ServicePlan) =>
              (a.recurring_price ?? 9999) - (b.recurring_price ?? 9999)
          );
          const recId = byPrice[0]?.id ?? null;
          setRecommendedId(recId);
          setPlans(recId ? [byPrice[0], ...byPrice.slice(1)] : byPrice);
        }
      } catch {
        setError('Unable to load service plans. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [companyId, selectedPestValue]);

  if (isLoading) {
    return (
      <div className={styles.stepContent}>
        <h2 className={styles.stepTitle}>Select a Service Plan</h2>
        <div className={styles.loadingState}>
          <span className={styles.spinner} />
          Loading plans…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.stepContent}>
        <h2 className={styles.stepTitle}>Select a Service Plan</h2>
        <p className={styles.submitError}>{error}</p>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className={styles.stepContent}>
        <h2 className={styles.stepTitle}>Select a Service Plan</h2>
        <p className={styles.emptyState}>
          No active service plans found for your company.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Select a Service Plan</h2>
      {suggestedPestType && (
        <p className={styles.stepDesc}>
          Detected: <strong>{suggestedPestType}</strong>
        </p>
      )}
      <div className={styles.planCardList}>
        {plans.map(plan => {
          const isSelected = selectedPlan?.id === plan.id;
          const isRecommended = plan.id === recommendedId;
          const features: string[] = Array.isArray(plan.plan_features)
            ? plan.plan_features
            : [];
          return (
            <button
              key={plan.id}
              className={`${styles.planCard} ${isSelected ? styles.planCardSelected : ''}`}
              onClick={() => onPlanSelect(plan)}
              type="button"
            >
              <div className={styles.planCardHeader}>
                <div className={styles.planCardNameRow}>
                  <span className={styles.planCardName}>{plan.plan_name}</span>

                  {isRecommended && (
                    <span className={styles.planCardBadge}>
                      {plan.highlight_badge || 'Recommended'}
                    </span>
                  )}
                </div>
                <div className={styles.planCardPrice}>
                  {plan.recurring_price != null ? (
                    <div className={styles.planCardPriceRow}>
                      <span className={styles.planCardPriceAmount}>
                        {formatPrice(plan.recurring_price)}
                      </span>
                      <span className={styles.planCardPriceFreq}>
                        {formatFrequency(plan.billing_frequency)}
                      </span>
                    </div>
                  ) : (
                    <span className={styles.planCardPriceAmount}>
                      Contact for pricing
                    </span>
                  )}
                  {plan.initial_price != null && plan.initial_price > 0 && (
                    <span className={styles.planCardInitial}>
                      + {formatPrice(plan.initial_price)} initial
                    </span>
                  )}
                </div>
              </div>
              {plan.plan_description && (
                <p className={styles.planCardDesc}>{plan.plan_description}</p>
              )}
              {features.length > 0 && (
                <ul className={styles.planCardFeatures}>
                  {features.map((f, i) => (
                    <li key={i} className={styles.planCardFeatureItem}>
                      <span className={styles.planCardFeatureCheck}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepUpsellCatalog({
  companyId,
  selected,
  onSelect,
}: {
  companyId: string;
  selected: UpsellSelection | null;
  onSelect: (sel: UpsellSelection) => void;
}) {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [addons, setAddons] = useState<AddonService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetch(`/api/tech-leads/upsell-catalog/${companyId}`)
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (cancelled) return;
        if (data.success) {
          setPlans(Array.isArray(data.plans) ? data.plans : []);
          setAddons(Array.isArray(data.addons) ? data.addons : []);
        } else {
          setError(data.error ?? 'Failed to load catalog.');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load catalog.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  if (isLoading) {
    return (
      <div className={styles.stepContent}>
        <h2 className={styles.stepTitle}>Choose What To Upsell</h2>
        <div className={styles.loadingState}>
          <span className={styles.spinner} />
          Loading catalog…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.stepContent}>
        <h2 className={styles.stepTitle}>Choose What To Upsell</h2>
        <p className={styles.submitError}>{error}</p>
      </div>
    );
  }

  if (plans.length === 0 && addons.length === 0) {
    return (
      <div className={styles.stepContent}>
        <h2 className={styles.stepTitle}>Choose What To Upsell</h2>
        <p className={styles.emptyState}>
          No upsell items are currently enabled for technicians. Ask an admin
          to mark plans or add-ons as tech-upsell-eligible.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Choose What To Upsell</h2>
      <p className={styles.stepDesc}>
        Pick a plan or add-on, then Send Quote or Sell It Now.
      </p>

      {plans.length > 0 && (
        <>
          <p className={styles.listLabel}>Service Plans</p>
          <div className={styles.planCardList}>
            {plans.map(plan => {
              const isSelected =
                selected?.kind === 'plan' && selected.plan.id === plan.id;
              const features: string[] = Array.isArray(plan.plan_features)
                ? plan.plan_features
                : [];
              return (
                <button
                  key={plan.id}
                  type="button"
                  className={`${styles.planCard} ${isSelected ? styles.planCardSelected : ''}`}
                  onClick={() => onSelect({ kind: 'plan', plan })}
                >
                  <div className={styles.planCardHeader}>
                    <div className={styles.planCardNameRow}>
                      <span className={styles.planCardName}>
                        {plan.plan_name}
                      </span>
                      {plan.highlight_badge && (
                        <span className={styles.planCardBadge}>
                          {plan.highlight_badge}
                        </span>
                      )}
                    </div>
                    <div className={styles.planCardPrice}>
                      {plan.recurring_price != null ? (
                        <div className={styles.planCardPriceRow}>
                          <span className={styles.planCardPriceAmount}>
                            {formatPrice(plan.recurring_price)}
                          </span>
                          <span className={styles.planCardPriceFreq}>
                            {formatFrequency(plan.billing_frequency)}
                          </span>
                        </div>
                      ) : (
                        <span className={styles.planCardPriceAmount}>
                          Contact for pricing
                        </span>
                      )}
                      {plan.initial_price != null && plan.initial_price > 0 && (
                        <span className={styles.planCardInitial}>
                          + {formatPrice(plan.initial_price)} initial
                        </span>
                      )}
                    </div>
                  </div>
                  {plan.plan_description && (
                    <p className={styles.planCardDesc}>{plan.plan_description}</p>
                  )}
                  {features.length > 0 && (
                    <ul className={styles.planCardFeatures}>
                      {features.map((f, i) => (
                        <li key={i} className={styles.planCardFeatureItem}>
                          <span className={styles.planCardFeatureCheck}>✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {addons.length > 0 && (
        <>
          <p className={styles.listLabel}>Add-On Services</p>
          <div className={styles.planCardList}>
            {addons.map(addon => {
              const isSelected =
                selected?.kind === 'addon' && selected.addon.id === addon.id;
              const features: string[] = Array.isArray(addon.addon_features)
                ? addon.addon_features
                : [];
              return (
                <button
                  key={addon.id}
                  type="button"
                  className={`${styles.planCard} ${isSelected ? styles.planCardSelected : ''}`}
                  onClick={() => onSelect({ kind: 'addon', addon })}
                >
                  <div className={styles.planCardHeader}>
                    <div className={styles.planCardNameRow}>
                      <span className={styles.planCardName}>
                        {addon.addon_name}
                      </span>
                      {addon.highlight_badge && (
                        <span className={styles.planCardBadge}>
                          {addon.highlight_badge}
                        </span>
                      )}
                    </div>
                    <div className={styles.planCardPrice}>
                      {addon.recurring_price != null &&
                      addon.recurring_price > 0 ? (
                        <div className={styles.planCardPriceRow}>
                          <span className={styles.planCardPriceAmount}>
                            {formatPrice(addon.recurring_price)}
                          </span>
                          <span className={styles.planCardPriceFreq}>
                            {formatFrequency(addon.billing_frequency)}
                          </span>
                        </div>
                      ) : addon.initial_price != null ? (
                        <span className={styles.planCardPriceAmount}>
                          {formatPrice(addon.initial_price)}
                        </span>
                      ) : (
                        <span className={styles.planCardPriceAmount}>
                          Contact for pricing
                        </span>
                      )}
                      {addon.recurring_price != null &&
                        addon.recurring_price > 0 &&
                        addon.initial_price != null &&
                        addon.initial_price > 0 && (
                          <span className={styles.planCardInitial}>
                            + {formatPrice(addon.initial_price)} initial
                          </span>
                        )}
                    </div>
                  </div>
                  {addon.addon_description && (
                    <p className={styles.planCardDesc}>
                      {addon.addon_description}
                    </p>
                  )}
                  {features.length > 0 && (
                    <ul className={styles.planCardFeatures}>
                      {features.map((f, i) => (
                        <li key={i} className={styles.planCardFeatureItem}>
                          <span className={styles.planCardFeatureCheck}>✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function StepServiceTodayConfirm({
  selectedPlan,
  upsellSelection,
  selectedCustomer,
  techName: _techName,
  onSignatureChange,
  completedToday,
  onCompletedTodayChange,
  requestedDay,
  onRequestedDayChange,
  requestedTime,
  onRequestedTimeChange,
  companyQuoteTerms,
  timeOptions,
}: {
  selectedPlan: ServicePlan | null;
  upsellSelection: UpsellSelection | null;
  selectedCustomer: CustomerResult | null;
  techName: string;
  onSignatureChange: (data: string | null) => void;
  completedToday: boolean | null;
  onCompletedTodayChange: (value: boolean) => void;
  requestedDay: string;
  onRequestedDayChange: (value: string) => void;
  requestedTime: string;
  onRequestedTimeChange: (value: string) => void;
  companyQuoteTerms: string | null;
  timeOptions: TimeOption[];
}) {
  const signatureRef = useRef<SignatureCanvas>(null);
  const addr = selectedCustomer ? getPrimaryAddress(selectedCustomer) : null;

  // Prefer an upsell pick (plan or addon) over the legacy selectedPlan.
  const upsellPlan =
    upsellSelection?.kind === 'plan' ? upsellSelection.plan : null;
  const upsellAddon =
    upsellSelection?.kind === 'addon' ? upsellSelection.addon : null;
  const planForDisplay = upsellPlan ?? selectedPlan;
  const planFeatures: string[] = Array.isArray(planForDisplay?.plan_features)
    ? planForDisplay!.plan_features!
    : [];
  const addonFeatures: string[] = Array.isArray(upsellAddon?.addon_features)
    ? upsellAddon!.addon_features!
    : [];
  const planTermsHtml =
    upsellAddon?.addon_terms ?? planForDisplay?.plan_terms ?? null;
  const disclaimerHtml =
    upsellAddon?.addon_disclaimer ?? planForDisplay?.plan_disclaimer ?? null;
  const enabledTimeOptions = getEnabledTimeOptions(timeOptions);
  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const handleSignEnd = () => {
    if (signatureRef.current) {
      const isEmpty = signatureRef.current.isEmpty();
      onSignatureChange(isEmpty ? null : signatureRef.current.toDataURL());
    }
  };

  const handleClearSignature = () => {
    signatureRef.current?.clear();
    onSignatureChange(null);
  };

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Service Today — Confirm</h2>
      <p className={styles.stepDesc}>
        Review details and sign below to complete
      </p>

      {/* Customer Info */}
      <div className={styles.confirmSection}>
        <h3 className={styles.confirmSectionTitle}>Customer</h3>
        {selectedCustomer ? (
          <>
            <p className={styles.confirmValue}>
              {getCustomerDisplayName(selectedCustomer)}
            </p>
            {addr && (
              <p className={styles.confirmValueMuted}>
                {addr.street_address}, {addr.city}, {addr.state} {addr.zip_code}
              </p>
            )}
            {selectedCustomer.phone && (
              <p className={styles.confirmValueMuted}>
                {selectedCustomer.phone}
              </p>
            )}
            {selectedCustomer.email && (
              <p className={styles.confirmValueMuted}>
                {selectedCustomer.email}
              </p>
            )}
          </>
        ) : (
          <p className={styles.confirmValueMuted}>No customer selected</p>
        )}
      </div>

      {/* Selected Plan / Addon */}
      {upsellAddon ? (
        <div className={styles.confirmSection}>
          <h3 className={styles.confirmSectionTitle}>Add-On Service</h3>
          <p className={styles.confirmValue}>{upsellAddon.addon_name}</p>
          {upsellAddon.recurring_price != null &&
          upsellAddon.recurring_price > 0 ? (
            <p className={styles.reviewPlanPrice}>
              {formatPrice(upsellAddon.recurring_price)}
              {formatFrequency(upsellAddon.billing_frequency)}
              {upsellAddon.initial_price != null &&
              upsellAddon.initial_price > 0
                ? ` + ${formatPrice(upsellAddon.initial_price)} initial`
                : ''}
            </p>
          ) : upsellAddon.initial_price != null ? (
            <p className={styles.reviewPlanPrice}>
              {formatPrice(upsellAddon.initial_price)}
            </p>
          ) : null}
          {upsellAddon.addon_description && (
            <p className={styles.confirmValueMuted}>
              {upsellAddon.addon_description}
            </p>
          )}
          {addonFeatures.length > 0 && (
            <ul className={styles.confirmFeatureList}>
              {addonFeatures.map((f, i) => (
                <li key={i} className={styles.confirmFeatureItem}>
                  <span className={styles.confirmFeatureCheck}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : planForDisplay ? (
        <div className={styles.confirmSection}>
          <h3 className={styles.confirmSectionTitle}>Service Plan</h3>
          <p className={styles.confirmValue}>{planForDisplay.plan_name}</p>
          {planForDisplay.recurring_price != null && (
            <p className={styles.reviewPlanPrice}>
              {formatPrice(planForDisplay.recurring_price)}
              {formatFrequency(planForDisplay.billing_frequency)}
              {planForDisplay.initial_price != null &&
              planForDisplay.initial_price > 0
                ? ` + ${formatPrice(planForDisplay.initial_price)} initial`
                : ''}
            </p>
          )}
          {planForDisplay.plan_description && (
            <p className={styles.confirmValueMuted}>
              {planForDisplay.plan_description}
            </p>
          )}
          {planFeatures.length > 0 && (
            <ul className={styles.confirmFeatureList}>
              {planFeatures.map((f, i) => (
                <li key={i} className={styles.confirmFeatureItem}>
                  <span className={styles.confirmFeatureCheck}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className={styles.confirmSection}>
          <h3 className={styles.confirmSectionTitle}>Service Plan</h3>
          <p className={styles.confirmValueMuted}>No plan selected</p>
        </div>
      )}

      {/* Terms & Disclaimer */}
      {(companyQuoteTerms || planTermsHtml || disclaimerHtml) && (
        <div className={styles.confirmSection}>
          <h3 className={styles.confirmSectionTitle}>Terms & Agreement</h3>
          {companyQuoteTerms && (
            <div
              className={styles.confirmTerms}
              dangerouslySetInnerHTML={{ __html: companyQuoteTerms }}
            />
          )}
          {planTermsHtml && (
            <div
              className={styles.confirmTerms}
              dangerouslySetInnerHTML={{ __html: planTermsHtml }}
            />
          )}
          {disclaimerHtml && (
            <div
              className={styles.confirmDisclaimer}
              dangerouslySetInnerHTML={{ __html: disclaimerHtml }}
            />
          )}
        </div>
      )}

      {/* Completed today toggle */}
      <div className={styles.confirmSection}>
        <h3 className={styles.confirmSectionTitle}>Completed Today?</h3>
        <p className={styles.confirmValueMuted}>
          Did you perform this service today?
        </p>
        <div className={styles.pillGroup} role="radiogroup">
          <button
            type="button"
            role="radio"
            aria-checked={completedToday === true}
            className={`${styles.pill} ${completedToday === true ? styles.pillActive : ''}`}
            onClick={() => onCompletedTodayChange(true)}
          >
            Yes
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={completedToday === false}
            className={`${styles.pill} ${completedToday === false ? styles.pillActive : ''}`}
            onClick={() => onCompletedTodayChange(false)}
          >
            No
          </button>
        </div>
      </div>

      {/* When No: show preferred schedule picker */}
      {completedToday === false && (
        <div className={styles.confirmSection}>
          <h3 className={styles.confirmSectionTitle}>Preferred Schedule</h3>
          <div className={styles.newCustomerRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Day</label>
              <select
                className={styles.fieldInput}
                value={requestedDay}
                onChange={e => onRequestedDayChange(e.target.value)}
              >
                <option value="">Select a day…</option>
                {daysOfWeek.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Time</label>
              <select
                className={styles.fieldInput}
                value={requestedTime}
                onChange={e => onRequestedTimeChange(e.target.value)}
              >
                <option value="">Select a time…</option>
                {enabledTimeOptions.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Signature — only required when completed today */}
      {completedToday === true && (
        <div className={styles.confirmSection}>
          <h3 className={styles.confirmSectionTitle}>Customer Signature</h3>
          <p className={styles.confirmValueMuted}>
            Please sign below to acknowledge service completed today
          </p>
          <div className={styles.signatureWrapper}>
            <SignatureCanvas
              ref={signatureRef}
              penColor="#000"
              canvasProps={{
                className: styles.signatureCanvas,
                width: 500,
                height: 150,
              }}
              onEnd={handleSignEnd}
            />
          </div>
          <button
            type="button"
            className={styles.signatureClearBtn}
            onClick={handleClearSignature}
          >
            Clear Signature
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export function NewOpportunityWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeStopIdParam = searchParams.get('routeStopId');
  const isFromRouteStop =
    searchParams.get('type') === 'upsell' && !!routeStopIdParam;
  const { selectedCompany } = useCompany();
  const { setWizardTitle, setBackInterceptor } = useWizard();

  const wizardContainerRef = useRef<HTMLDivElement>(null);
  const isSyncFired = useRef(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Scroll to top of wizard on every step change
  useEffect(() => {
    wizardContainerRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [stepIndex]);

  // Sync lead type label into global header; clear on unmount
  useEffect(() => {
    return () => {
      setWizardTitle(null);
    };
  }, [setWizardTitle]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showExitPrompt, setShowExitPrompt] = useState(false);

  // Register a back interceptor when the wizard has progress; clear it when at step 0
  useEffect(() => {
    if (stepIndex > 0) {
      setBackInterceptor(() => setShowExitPrompt(true));
    } else {
      setBackInterceptor(null);
    }
    return () => {
      setBackInterceptor(null);
    };
  }, [stepIndex, setBackInterceptor]);
  const [isSyncingCustomer, setIsSyncingCustomer] = useState(isFromRouteStop);
  const [syncError, setSyncError] = useState<string | null>(null);

  // PestPac integration state
  const [isPestPacEnabled, setIsPestPacEnabled] = useState(false);
  const [selectedPestPacClient, setSelectedPestPacClient] =
    useState<PestPacClientResult | null>(null);

  // Company settings — timezone, quote terms, schedule time slots — loaded
  // alongside the PestPac flag so the Sell It Now flow can render accurate
  // terms + preferred-schedule inputs without extra roundtrips.
  const [companyTimezone, setCompanyTimezone] = useState<string>(
    'America/New_York'
  );
  const [companyQuoteTerms, setCompanyQuoteTerms] = useState<string | null>(
    null
  );
  const [companyTimeOptions, setCompanyTimeOptions] =
    useState<TimeOption[]>(DEFAULT_TIME_OPTIONS);

  // Current user's id and display name — used to own the lead on Send Lead
  // and for the "Service Today" attribution note.
  const [techUserId, setTechUserId] = useState<string | null>(null);
  const [techName, setTechName] = useState('');

  // Wizard state
  const [leadType, setLeadType] = useState<LeadType>('new-lead');
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [aiResult, setAIResult] = useState<AIResult>({
    issue_detected: '',
    service_category: '',
    ai_summary: '',
    suggested_pest_type: null,
    matched_pest_option: null,
    severity: null,
  });
  const [notes, setNotes] = useState('');
  // Tri-state toggles — null means "not answered yet" so the wizard can
  // require an explicit yes/no before advancing from the review step.
  const [customerMentioned, setCustomerMentioned] = useState<boolean | null>(
    null
  );
  const [techMentioned, setTechMentioned] = useState<boolean | null>(null);
  const [isHighPriority, setIsHighPriority] = useState<boolean | null>(null);
  const [propertyType, setPropertyType] = useState<
    'residential' | 'commercial' | null
  >(null);
  // Tracks whether the tech has hit Refer-To-Sales with required review
  // toggles still unanswered — lets us reveal inline errors + scroll the
  // first unanswered field into view.
  const [reviewAttempted, setReviewAttempted] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerResult | null>(null);
  const [pestOptions, setPestOptions] = useState<PestOption[]>([]);
  const [isPestOptionsLoading, setIsPestOptionsLoading] = useState(false);
  const [selectedPestValue, setSelectedPestValue] = useState('');
  const [otherPest, setOtherPest] = useState('');
  const [hasManualPestSelection, setHasManualPestSelection] = useState(false);

  // Service plan selection
  const [selectedServicePlan, setSelectedServicePlan] =
    useState<ServicePlan | null>(null);

  // Upsell catalog selection: tech picks one plan OR one addon to upsell.
  const [upsellSelection, setUpsellSelection] =
    useState<UpsellSelection | null>(null);

  // Signature data for service-today confirmation
  const [signatureData, setSignatureData] = useState<string | null>(null);

  // Sell It Now branch state (Phase 4).
  // completedToday: tri-state Yes/No/unset on the service-today-confirm step.
  // requestedDay: day-of-week name picked from the dropdown (e.g. "Tuesday").
  // requestedTime: canonical time-slot value (morning/afternoon/evening/anytime).
  const [completedToday, setCompletedToday] = useState<boolean | null>(null);
  const [requestedDay, setRequestedDay] = useState('');
  const [requestedTime, setRequestedTime] = useState('');

  // True once the tech clicks "Sell It Now" on the upsell-catalog step —
  // inserts service-today-confirm as the next step. Send Quote submits
  // directly and never sets this flag.
  const [sellItNowFlow, setSellItNowFlow] = useState(false);

  // New customer form state
  const [newCustomerForm, setNewCustomerForm] = useState<NewCustomerForm>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    addressInput: '',
    addressComponents: null,
  });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [createCustomerError, setCreateCustomerError] = useState<string | null>(
    null
  );

  // Tracks whether the tech chose an existing customer or "Add New Customer"
  // on the select-site step. Controls whether `new-customer` appears in the
  // step list. Null = not yet decided (still on select-site).
  const [customerSource, setCustomerSource] = useState<
    'existing' | 'new' | null
  >(null);

  // Today's route stops surfaced inside StepSelectSite as quick-pick cards.
  const [todayRouteStops, setTodayRouteStops] = useState<TodayRouteStop[]>([]);
  const [isTodayRouteLoading, setIsTodayRouteLoading] = useState(false);
  const [routeStopPickError, setRouteStopPickError] = useState<string | null>(
    null
  );

  const companyId = selectedCompany?.id ?? '';
  const selectedPestOption =
    pestOptions.find(option => option.id === selectedPestValue) ?? null;

  const { recentCustomers, addRecent } = useRecentTechLeadCustomers(companyId);

  // Computed wizard steps. Route-stop deep links pre-load the customer and
  // skip select-site entirely. Every other entry point (dashboard "Send Lead"
  // and "Create Upsell" buttons) starts with select-site so the tech can pick
  // an existing customer from today's route / recents, or choose
  // "Add New Customer" — which dynamically inserts the `new-customer` step.
  // Upsell flows also append the `upsell-catalog` step after ai-review so the
  // tech can pick what to upsell, then Send Quote or Sell It Now.
  const wizardSteps = useMemo((): StepId[] => {
    const isUpsell = leadType === 'upsell';
    if (isFromRouteStop) {
      // Route-stop deep link pre-loads the customer; upsell skips photos/review
      // and goes straight to the upsell catalog.
      if (isUpsell) {
        const steps: StepId[] = ['type-select', 'upsell-catalog'];
        if (sellItNowFlow) steps.push('service-today-confirm');
        return steps;
      }
      return ['type-select', 'photos', 'ai-review'];
    }
    const base: StepId[] = ['type-select', 'select-site'];
    if (customerSource === 'new') base.push('new-customer');
    if (isUpsell) {
      // Upsell flow skips photos + AI review — tech picks what to upsell
      // directly after choosing the customer.
      base.push('upsell-catalog');
      if (sellItNowFlow) base.push('service-today-confirm');
    } else {
      base.push('photos', 'ai-review');
    }
    return base;
  }, [isFromRouteStop, customerSource, leadType, sellItNowFlow]);

  const currentStepId = wizardSteps[stepIndex];
  const wizardStepsRef = useRef(wizardSteps);
  useEffect(() => {
    wizardStepsRef.current = wizardSteps;
  }, [wizardSteps]);
  const draftKey = companyId ? `techleads_draft_${companyId}` : null;

  useEffect(() => {
    if (stepIndex <= wizardSteps.length - 1) return;
    setStepIndex(Math.max(0, wizardSteps.length - 1));
  }, [stepIndex, wizardSteps]);

  // Restore draft from localStorage only when the user explicitly opted in by
  // landing here via the My Opportunities "Restore Draft" flow (?restore=1).
  // Otherwise we start fresh every time.
  useEffect(() => {
    if (!draftKey || stepIndex > 0) return;
    if (searchParams.get('restore') !== '1') return;
    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved) return;
      const d = JSON.parse(saved);
      if (d.leadType) {
        setLeadType(d.leadType);
        setWizardTitle(
          d.leadType === 'new-lead' ? 'New Lead' : 'Upsell Opportunity'
        );
      }
      if (d.aiResult) setAIResult(d.aiResult);
      if (d.notes) setNotes(d.notes);
      if (typeof d.customerMentioned === 'boolean')
        setCustomerMentioned(d.customerMentioned);
      if (typeof d.techMentioned === 'boolean')
        setTechMentioned(d.techMentioned);
      if (typeof d.isHighPriority === 'boolean')
        setIsHighPriority(d.isHighPriority);
      if (d.propertyType === 'residential' || d.propertyType === 'commercial')
        setPropertyType(d.propertyType);
      if (d.selectedPestValue) setSelectedPestValue(d.selectedPestValue);
      if (d.otherPest) setOtherPest(d.otherPest);
      if (d.hasManualPestSelection)
        setHasManualPestSelection(d.hasManualPestSelection);
      if (d.selectedCustomer) setSelectedCustomer(d.selectedCustomer);
      if (d.selectedPestPacClient)
        setSelectedPestPacClient(d.selectedPestPacClient);
      if (d.selectedServicePlan) setSelectedServicePlan(d.selectedServicePlan);
      if (d.newCustomerForm) {
        setNewCustomerForm(prev => ({
          ...prev,
          ...d.newCustomerForm,
          addressComponents: null,
        }));
      }
      if (typeof d.stepIndex === 'number' && d.stepIndex > 0) {
        setStepIndex(d.stepIndex);
      }
    } catch {
      // Corrupt draft — ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // On mount: if URL has ?type= or ?flow=, skip type-select.
  // `flow=send-lead` / `flow=upsell` come from the Tech dashboard buttons;
  // `type=new-lead` / `type=upsell` are legacy deep links.
  useEffect(() => {
    const typeParam = searchParams.get('type');
    const flowParam = searchParams.get('flow');
    const resolved =
      flowParam === 'send-lead'
        ? 'new-lead'
        : flowParam === 'upsell'
          ? 'upsell'
          : typeParam === 'upsell' || typeParam === 'new-lead'
            ? typeParam
            : null;
    if (resolved === 'upsell') {
      setLeadType('upsell');
      setWizardTitle('Upsell Opportunity');
      setStepIndex(1);
    } else if (resolved === 'new-lead') {
      setLeadType('new-lead');
      setWizardTitle('New Lead');
      setStepIndex(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCustomerFromRouteStop = useCallback(async () => {
    if (!routeStopIdParam || !selectedCompany?.id) return;
    setIsSyncingCustomer(true);
    setSyncError(null);
    try {
      const res = await fetch(
        `/api/field-map/route-stops/${routeStopIdParam}?companyId=${selectedCompany.id}`
      );
      if (!res.ok) throw new Error(`Failed to load stop (${res.status})`);
      const data = await res.json();
      if (data.customer) {
        setSelectedCustomer(data.customer);
        setCustomerSource('existing');
        addRecent(data.customer);
        const c = data.customer;
        const addr = c.primary_service_address?.[0]?.service_address ?? null;
        const street = addr?.street_address ?? c.address ?? '';
        const city = addr?.city ?? c.city ?? '';
        const state = addr?.state ?? c.state ?? '';
        const zip = addr?.zip_code ?? c.zip_code ?? '';
        const addressInput = [
          street,
          [city, state].filter(Boolean).join(', '),
          zip,
        ]
          .filter(Boolean)
          .join(', ')
          .trim();
        setNewCustomerForm(prev => ({
          ...prev,
          firstName: c.first_name ?? prev.firstName,
          lastName: c.last_name ?? prev.lastName,
          phone: c.phone ?? prev.phone,
          email: c.email ?? prev.email,
          addressInput: addressInput || prev.addressInput,
        }));
        if (c.phone) {
          // Upsell route-stop flow jumps to the upsell catalog; new-lead
          // flow still lands on photos for AI analysis.
          const steps = wizardStepsRef.current;
          const target =
            steps.indexOf('upsell-catalog') !== -1
              ? steps.indexOf('upsell-catalog')
              : steps.indexOf('photos');
          if (target !== -1) setStepIndex(target);
        }
      } else {
        throw new Error('No customer linked to this stop');
      }
    } catch {
      setSyncError('Failed to load customer data. Please retry.');
    } finally {
      setIsSyncingCustomer(false);
    }
  }, [routeStopIdParam, selectedCompany?.id, addRecent]);

  const handleSyncRetry = () => {
    isSyncFired.current = false;
    isSyncFired.current = true;
    loadCustomerFromRouteStop();
  };

  // Fetch today's route stops when the tech lands on the select-site step.
  // Only runs once we have a company and the tech isn't coming in via a
  // route-stop deep link (which pre-loads a customer already).
  useEffect(() => {
    if (isFromRouteStop) return;
    if (!selectedCompany?.id) return;
    if (currentStepId !== 'select-site') return;
    let cancelled = false;
    const today = new Date().toISOString().split('T')[0];
    setIsTodayRouteLoading(true);
    fetch(
      `/api/field-map/route?date=${today}&companyId=${selectedCompany.id}`
    )
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled) return;
        const stops: TodayRouteStop[] = (data?.stops ?? [])
          .filter((s: any) => s.routeStopId)
          .map((s: any) => ({
            routeStopId: s.routeStopId,
            clientName: s.clientName ?? 'Unknown',
            address: s.address ?? '',
            addressStreet: s.addressStreet ?? null,
            addressCity: s.addressCity ?? null,
            addressState: s.addressState ?? null,
            addressZip: s.addressZip ?? null,
            serviceType: s.serviceType ?? null,
            scheduledTime: s.scheduledTime ?? null,
            clientId: s.clientId ?? null,
          }));
        setTodayRouteStops(stops);
      })
      .catch(() => {
        if (!cancelled) setTodayRouteStops([]);
      })
      .finally(() => {
        if (!cancelled) setIsTodayRouteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isFromRouteStop, selectedCompany?.id, currentStepId]);

  const handlePickRouteStop = useCallback(
    async (stop: TodayRouteStop) => {
      if (!selectedCompany?.id) return;
      setRouteStopPickError(null);
      setIsSyncingCustomer(true);
      try {
        const res = await fetch(
          `/api/field-map/route-stops/${stop.routeStopId}?companyId=${selectedCompany.id}`
        );
        if (!res.ok) throw new Error(`Failed to load customer (${res.status})`);
        const data = await res.json();
        if (!data.customer) throw new Error('No customer on this stop');
        setSelectedCustomer(data.customer);
        setSelectedPestPacClient(null);
        setCustomerSource('existing');
        addRecent(data.customer);
        // Tapping a route stop is a one-tap flow — advance immediately.
        setStepIndex(i => i + 1);
      } catch {
        setRouteStopPickError(
          'Could not load that customer. Try again or pick another.'
        );
      } finally {
        setIsSyncingCustomer(false);
      }
    },
    [selectedCompany?.id, addRecent]
  );

  const handleAddNewCustomer = useCallback(() => {
    setSelectedCustomer(null);
    setSelectedPestPacClient(null);
    setCustomerSource('new');
    setRouteStopPickError(null);
    // Advance to the freshly-inserted new-customer step. We look it up by id
    // after the step list recomputes, so fall back to the next index.
    requestAnimationFrame(() => {
      const idx = wizardStepsRef.current.indexOf('new-customer');
      if (idx !== -1) {
        setStepIndex(idx);
      } else {
        setStepIndex(i => i + 1);
      }
    });
  }, []);

  // Load customer from route stop once selectedCompany is available
  useEffect(() => {
    if (!routeStopIdParam || !selectedCompany?.id || isSyncFired.current)
      return;
    isSyncFired.current = true;
    loadCustomerFromRouteStop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeStopIdParam, selectedCompany?.id]);

  // Auto-save draft whenever key state changes (skip at step 0 — nothing to save yet)
  useEffect(() => {
    if (!draftKey || stepIndex === 0) return;
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          leadType,
          stepIndex,
          aiResult,
          notes,
          customerMentioned,
          techMentioned,
          isHighPriority,
          propertyType,
          selectedPestValue,
          otherPest,
          hasManualPestSelection,
          selectedCustomer,
          selectedPestPacClient,
          selectedServicePlan,
          savedAt: new Date().toISOString(),
          newCustomerForm: {
            firstName: newCustomerForm.firstName,
            lastName: newCustomerForm.lastName,
            phone: newCustomerForm.phone,
            email: newCustomerForm.email,
            addressInput: newCustomerForm.addressInput,
          },
        })
      );
    } catch {
      // localStorage full or unavailable — silently skip
    }
  }, [
    draftKey,
    leadType,
    stepIndex,
    aiResult,
    notes,
    customerMentioned,
    techMentioned,
    isHighPriority,
    propertyType,
    selectedPestValue,
    otherPest,
    hasManualPestSelection,
    selectedCustomer,
    selectedPestPacClient,
    selectedServicePlan,
    newCustomerForm,
  ]);

  const clearDraft = () => {
    if (draftKey) {
      try {
        localStorage.removeItem(draftKey);
      } catch {}
    }
  };

  // Fetch current user's display name for "Service Today" attribution note
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setTechUserId(user.id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
      if (profile) {
        const name = [profile.first_name, profile.last_name]
          .filter(Boolean)
          .join(' ');
        if (name) setTechName(name);
      }
    });
  }, []);

  // Detect PestPac mode and load Quote Page + timezone settings on mount
  useEffect(() => {
    if (!companyId) return;
    fetch(`/api/companies/${companyId}/settings`)
      .then(r => r.json())
      .then(data => {
        const settings = data.settings ?? {};
        const enabled = settings.pestpac_enabled?.value;
        setIsPestPacEnabled(enabled === true || enabled === 'true');

        const tz = settings.company_timezone?.value;
        if (typeof tz === 'string' && tz) setCompanyTimezone(tz);

        const qt = settings.quote_terms?.value;
        if (typeof qt === 'string' && qt.trim()) setCompanyQuoteTerms(qt);

        // requested_time_options is stored as JSON — API returns it already
        // parsed for type='json', but fall back to string parsing just in case.
        const raw = settings.requested_time_options?.value;
        if (Array.isArray(raw) && raw.length > 0) {
          setCompanyTimeOptions(raw as TimeOption[]);
        } else if (typeof raw === 'string' && raw) {
          setCompanyTimeOptions(parseTimeOptions(raw));
        }
      })
      .catch(() => {
        // Failed to load settings — default to disabled
      });
  }, [companyId]);

  useEffect(() => {
    if (!companyId) {
      setPestOptions([]);
      setSelectedPestValue('');
      setOtherPest('');
      setHasManualPestSelection(false);
      return;
    }

    const loadPestOptions = async () => {
      setIsPestOptionsLoading(true);
      try {
        const res = await fetch(`/api/pest-types?companyId=${companyId}`);
        if (!res.ok) {
          setPestOptions([]);
          return;
        }

        const data = await res.json();
        const options: Array<{ id: string; name: string; slug: string }> =
          Array.isArray(data.pestTypes) ? data.pestTypes : [];
        setPestOptions(
          options.map(option => ({
            id: option.id,
            name: option.name,
            slug: option.slug,
          }))
        );
      } catch {
        setPestOptions([]);
      } finally {
        setIsPestOptionsLoading(false);
      }
    };

    loadPestOptions();
  }, [companyId]);

  useEffect(() => {
    if (hasManualPestSelection || selectedPestValue || pestOptions.length === 0)
      return;

    const match = findBestPestMatch(aiResult, pestOptions);
    if (match) {
      setSelectedPestValue(match.id);
    }
  }, [aiResult, pestOptions, hasManualPestSelection, selectedPestValue]);

  const resetWizard = () => {
    clearDraft();
    setStepIndex(0);
    setLeadType('new-lead');
    setWizardTitle(null);
    setPhotos([]);
    setAIResult({
      issue_detected: '',
      service_category: '',
      ai_summary: '',
      suggested_pest_type: null,
      matched_pest_option: null,
      severity: null,
    });
    setSelectedPestValue('');
    setOtherPest('');
    setHasManualPestSelection(false);
    setNotes('');
    setCustomerMentioned(null);
    setIsHighPriority(null);
    setTechMentioned(null);
    setPropertyType(null);
    setSelectedCustomer(null);
    setSelectedPestPacClient(null);
    setSelectedServicePlan(null);
    setSignatureData(null);
    setNewCustomerForm({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      addressInput: '',
      addressComponents: null,
    });
    setCreateCustomerError(null);
    setSubmitError(null);
    setSyncError(null);
    setCustomerSource(null);
    setRouteStopPickError(null);
    setTodayRouteStops([]);
    setUpsellSelection(null);
    setCompletedToday(null);
    setRequestedDay('');
    setRequestedTime('');
    setSellItNowFlow(false);
  };

  const handleAnalyze = async () => {
    if (!photos.length || !companyId) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch('/api/ai/analyze-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          images: photos.map(p => ({ mimeType: p.mimeType, data: p.base64 })),
          notes,
          pestOptions: pestOptions.map(p => ({ id: p.id, name: p.name })),
        }),
      });
      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setAIResult(data);

      // Auto-select pest option: try exact name match first, then fuzzy fallback
      if (!hasManualPestSelection) {
        const exactMatch = data.matched_pest_option
          ? pestOptions.find(
              p =>
                p.name.toLowerCase() === data.matched_pest_option!.toLowerCase()
            )
          : null;
        const match = exactMatch ?? findBestPestMatch(data, pestOptions);
        if (match) setSelectedPestValue(match.id);
      }

      // Advance to ai-review step
      const aiReviewIndex = wizardSteps.indexOf('ai-review');
      if (aiReviewIndex !== -1) setStepIndex(aiReviewIndex);
    } catch {
      setAnalyzeError(
        'AI analysis failed. You can still continue and fill in the details manually.'
      );
      const aiReviewIndex = wizardSteps.indexOf('ai-review');
      if (aiReviewIndex !== -1) setStepIndex(aiReviewIndex);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (
    mode:
      | 'default'
      | 'schedule'
      | 'service-today'
      | 'send-quote'
      | 'sell-it-now-today'
      | 'sell-it-now-scheduled' = 'default'
  ) => {
    if (!companyId) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const summary = aiResult.ai_summary?.trim() || '';
      const trimmedOtherPest = otherPest.trim();

      const commentWithOtherPest =
        selectedPestValue === OTHER_PEST_OPTION_VALUE && trimmedOtherPest
          ? summary
            ? `${summary}\nPrimary pest concern (other): ${trimmedOtherPest}`
            : `Primary pest concern (other): ${trimmedOtherPest}`
          : summary;

      const fallbackSuggestedPest =
        pestOptions.length === 0
          ? (aiResult.suggested_pest_type ?? undefined)
          : undefined;

      // Build notes: tech notes + service-today attribution note
      const today = new Date();
      const formattedDate = today.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      const serviceTodayNote =
        mode === 'service-today' || mode === 'sell-it-now-today'
          ? `This Lead had already been Serviced by ${techName || 'the technician'} on ${formattedDate}. Please update the customer\u2019s billing and close the lead.`
          : null;

      // Resolve the upsell pick (plan or addon) into a single plan-id + display
      // name so the API can still key off selectedPlanId/recommendedPlanName.
      // When the tech picks an addon, we use the addon id + name for now; a
      // future enhancement can wire addon quotes through a dedicated path.
      const upsellPlan =
        upsellSelection?.kind === 'plan' ? upsellSelection.plan : null;
      const upsellAddon =
        upsellSelection?.kind === 'addon' ? upsellSelection.addon : null;
      const upsellPlanName =
        upsellAddon?.addon_name ?? upsellPlan?.plan_name ?? null;

      const trimmedTechNotes = notes.trim();
      const combinedNotes = [trimmedTechNotes, serviceTodayNote]
        .filter(Boolean)
        .join('\n\n');

      const checkboxNotes = [
        techMentioned === true ? 'Discussed with customer.' : null,
        customerMentioned === true ? 'Customer mentioned this issue.' : null,
        isHighPriority === true ? 'High priority.' : null,
      ]
        .filter(Boolean)
        .join('\n');

      const finalNotes = [combinedNotes, checkboxNotes]
        .filter(Boolean)
        .join('\n\n');

      const body: Record<string, unknown> = {
        companyId,
        comments: commentWithOtherPest || 'TechLead opportunity',
        notes: finalNotes || undefined,
        pestType: selectedPestOption?.name ?? fallbackSuggestedPest,
        priority: isHighPriority === true ? 'high' : 'medium',
        leadSource: 'technician',
        leadType: 'manual',
        serviceType: aiResult.service_category || undefined,
        techDiscussed: techMentioned === true,
        propertyType: propertyType ?? undefined,
        // Upsell leads stay owned by the tech; new-lead flow goes in
        // unassigned so sales can triage.
        ...(techUserId && leadType === 'upsell'
          ? { assignedTo: techUserId }
          : {}),
        ...(routeStopIdParam ? { routeStopId: routeStopIdParam } : {}),
      };

      if (mode === 'schedule' || mode === 'service-today') {
        body.leadStatus = 'scheduling';
      }

      if (mode === 'service-today') {
        body.scheduledDate = today.toISOString().split('T')[0];
        const hh = String(today.getHours()).padStart(2, '0');
        const mm = String(today.getMinutes()).padStart(2, '0');
        body.scheduledTime = `${hh}:${mm}`;
      }

      // ── Upsell modes ────────────────────────────────────────────────────
      if (mode === 'send-quote') {
        body.leadStatus = 'in_process';
      }
      if (mode === 'sell-it-now-today') {
        body.leadStatus = 'scheduling';
        body.scheduledDate = today.toISOString().split('T')[0];
        const hh = String(today.getHours()).padStart(2, '0');
        const mm = String(today.getMinutes()).padStart(2, '0');
        body.scheduledTime = `${hh}:${mm}`;
      }
      if (mode === 'sell-it-now-scheduled') {
        body.leadStatus = 'scheduling';
        // requestedDay is a day-of-week name ("Tuesday"); translate to the
        // next occurrence of that weekday as an ISO date for the DATE column.
        if (requestedDay) {
          const nextDate = nextOccurrenceOfDay(requestedDay);
          if (nextDate) body.requestedDate = nextDate;
        }
        if (requestedTime) body.requestedTime = requestedTime;
      }

      // Prefer upsell pick over legacy selectedServicePlan for upsell flows.
      if (upsellPlan) {
        body.serviceType = upsellPlan.plan_name;
        body.selectedPlanId = upsellPlan.id;
        body.recommendedPlanName = upsellPlan.plan_name;
      } else if (upsellAddon) {
        body.serviceType = upsellAddon.addon_name;
        body.recommendedPlanName = upsellAddon.addon_name;
      } else if (selectedServicePlan) {
        body.serviceType = selectedServicePlan.plan_name;
        body.selectedPlanId = selectedServicePlan.id;
        body.recommendedPlanName = selectedServicePlan.plan_name;
      }

      if (selectedCustomer) {
        body.customerId = selectedCustomer.id;
        if (selectedCustomer.zip_code) {
          body.zip = selectedCustomer.zip_code;
        }
      } else if (newCustomerForm.firstName.trim()) {
        // New customer entered in wizard — pass fields to /api/leads which
        // handles dedup by email/phone and creates a customer if needed.
        const ac = newCustomerForm.addressComponents;
        const street =
          `${ac?.street_number ? ac.street_number + ' ' : ''}${ac?.route ?? ''}`.trim();
        body.firstName = newCustomerForm.firstName.trim();
        body.lastName = newCustomerForm.lastName.trim();
        body.email = newCustomerForm.email.trim() || undefined;
        body.phoneNumber = newCustomerForm.phone.trim() || undefined;
        body.streetAddress = street || undefined;
        body.city = ac?.locality ?? undefined;
        body.state = ac?.administrative_area_level_1 ?? undefined;
        body.zip = ac?.postal_code ?? undefined;
      }

      // Upload photos to Supabase Storage
      if (photos.length > 0) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const uploadedUrls: string[] = [];

        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          // Convert base64 directly to Blob (avoids fetch(dataUrl) failing on mobile/PWA)
          const byteString = atob(photo.base64);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let j = 0; j < byteString.length; j++)
            ia[j] = byteString.charCodeAt(j);
          const mimeType = photo.mimeType || 'image/jpeg';
          const blob = new Blob([ab], { type: mimeType });
          const ext =
            mimeType === 'image/png'
              ? 'png'
              : mimeType === 'image/webp'
                ? 'webp'
                : 'jpg';
          const path = `${companyId}/${user?.id ?? 'unknown'}/${Date.now()}-${i}.${ext}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from('tech-lead-photos')
              .upload(path, blob, { contentType: blob.type, upsert: false });

          if (!uploadError && uploadData) {
            const {
              data: { publicUrl },
            } = supabase.storage
              .from('tech-lead-photos')
              .getPublicUrl(uploadData.path);
            uploadedUrls.push(publicUrl);
          }
        }

        if (uploadedUrls.length > 0) {
          body.photoUrls = uploadedUrls;
        }
      }

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to create lead');
      }

      const leadData = await res.json();
      const leadId = leadData?.lead?.id ?? leadData?.id;

      // Quote creation: prefer upsell plan pick, fall back to legacy
      // service-plan selection. Addons don't have a quote line-item path yet
      // (the /api/leads/[id]/quote endpoint takes service_plans only) so we
      // skip quote creation for addon upsells — the lead still carries the
      // addon name on recommendedPlanName for sales to follow up.
      const quotePlanId = upsellPlan?.id ?? selectedServicePlan?.id ?? null;
      let quoteId: string | null = null;
      if (leadId && quotePlanId) {
        const quoteRes = await fetch(`/api/leads/${leadId}/quote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_plans: [{ service_plan_id: quotePlanId }],
          }),
        });
        if (quoteRes.ok) {
          const quoteData = await quoteRes.json().catch(() => null);
          // /api/leads/[id]/quote POST returns { success, data: completeQuote }
          quoteId =
            quoteData?.data?.id ??
            quoteData?.quote?.id ??
            quoteData?.id ??
            null;
        }
      }

      // Send Quote — email the quote to the customer so they can accept it.
      // selectedCustomer is only populated when the tech picks an existing
      // customer; "Add New Customer" creates the customer server-side inside
      // /api/leads, so fall back to the new-customer form fields here.
      if (mode === 'send-quote' && leadId && quoteId) {
        const newCustomerName = [
          newCustomerForm.firstName.trim(),
          newCustomerForm.lastName.trim(),
        ]
          .filter(Boolean)
          .join(' ');
        const resolvedClientEmail =
          selectedCustomer?.email || newCustomerForm.email.trim() || undefined;
        const resolvedClientName =
          (selectedCustomer && getCustomerDisplayName(selectedCustomer)) ||
          newCustomerName ||
          undefined;
        await fetch('/api/field-map/send-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            quoteId,
            companyId,
            sendEmail: true,
            clientEmail: resolvedClientEmail,
            clientName: resolvedClientName,
            inspectorName: techName || undefined,
          }),
        });
      }

      // Sell It Now (today) — persist the captured signature + T&C snapshot.
      if (
        mode === 'sell-it-now-today' &&
        leadId &&
        quoteId &&
        signatureData
      ) {
        const termsSnapshot =
          upsellAddon?.addon_terms ??
          upsellPlan?.plan_terms ??
          selectedServicePlan?.plan_terms ??
          null;
        await fetch(`/api/quotes/${quoteId}/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signature_data: signatureData,
            terms_accepted_text: termsSnapshot,
          }),
        }).catch(() => {
          /* non-fatal: lead already created as won */
        });
      }

      // Reference upsellPlanName so lint doesn't flag it; it's kept for a
      // future addon-quote path.
      void upsellPlanName;

      clearDraft();
      router.push(`/field-sales/dashboard?submitted=${leadType}`);
    } catch (err: any) {
      setSubmitError(err.message ?? 'Failed to create lead. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canGoNext = (): boolean => {
    if (currentStepId === 'photos' && photos.length === 0) return false;
    if (
      currentStepId === 'ai-review' &&
      isFromRouteStop &&
      (isSyncingCustomer || !selectedCustomer)
    )
      return false;
    if (
      currentStepId === 'ai-review' &&
      selectedPestValue === OTHER_PEST_OPTION_VALUE &&
      !otherPest.trim()
    )
      return false;
    // Require explicit yes/no on the three toggles, and (for new-lead)
    // a property-type selection before advancing past the review step.
    if (currentStepId === 'ai-review') {
      if (
        techMentioned === null ||
        customerMentioned === null ||
        isHighPriority === null
      ) {
        return false;
      }
      if (leadType === 'new-lead' && propertyType === null) {
        return false;
      }
    }
    if (currentStepId === 'select-site') {
      // Tech must have picked an existing customer (local or PestPac) to
      // advance. If they want to key in a new customer, the dedicated
      // "Add New Customer" button jumps to the new-customer step directly.
      if (!selectedPestPacClient && !selectedCustomer) return false;
    }
    if (currentStepId === 'new-customer') {
      return !!(
        newCustomerForm.firstName.trim() &&
        newCustomerForm.lastName.trim() &&
        newCustomerForm.phone.trim()
      );
    }
    if (currentStepId === 'service-plan-select')
      return selectedServicePlan !== null;
    if (currentStepId === 'service-details')
      return selectedServicePlan !== null;
    if (currentStepId === 'upsell-catalog') return upsellSelection !== null;
    if (currentStepId === 'service-today-confirm') {
      if (completedToday === null) return false;
      if (completedToday === true) return signatureData !== null;
      return !!requestedDay && !!requestedTime;
    }
    return true;
  };

  const handleNext = async () => {
    // Sync PestPac client into local DB when leaving the step where it was
    // picked. select-site is the legacy entry; new-customer is the new one
    // (PestPac search moved here per the Tech Leads flow updates).
    if (
      (currentStepId === 'select-site' ||
        currentStepId === 'new-customer') &&
      isPestPacEnabled &&
      selectedPestPacClient
    ) {
      setIsSyncingCustomer(true);
      setSyncError(null);
      try {
        const res = await fetch('/api/customers/pestpac-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: selectedPestPacClient.clientId,
            companyId,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? 'Failed to sync customer');
        }
        const data = await res.json();
        const synced = data.customer;
        setSelectedCustomer(synced);
        setCustomerSource('existing');
        // Save to recent customers
        const addr =
          synced.primary_service_address?.[0]?.service_address ?? null;
        addRecent({
          id: synced.id,
          first_name: synced.first_name,
          last_name: synced.last_name,
          email: synced.email,
          phone: synced.phone,
          pestpac_client_id: synced.pestpac_client_id ?? null,
          primaryAddress: addr
            ? {
                street_address: addr.street_address,
                city: addr.city,
                state: addr.state,
                zip_code: addr.zip_code,
              }
            : null,
        });
        setStepIndex(i => i + 1);
      } catch (err: any) {
        setSyncError(
          err.message ??
            'Failed to sync customer from PestPac. Please try again.'
        );
      } finally {
        setIsSyncingCustomer(false);
      }
      return;
    }

    // Save local DB customer selection to recent
    if (currentStepId === 'select-site' && selectedCustomer) {
      const addr = getPrimaryAddress(selectedCustomer);
      addRecent({
        id: selectedCustomer.id,
        first_name: selectedCustomer.first_name,
        last_name: selectedCustomer.last_name,
        email: selectedCustomer.email,
        phone: selectedCustomer.phone,
        primaryAddress: addr
          ? {
              street_address: addr.street_address,
              city: addr.city,
              state: addr.state,
              zip_code: addr.zip_code,
            }
          : null,
      });
    }

    if (stepIndex < wizardSteps.length - 1) setStepIndex(i => i + 1);
  };

  const handleBack = () => {
    if (stepIndex > 1) {
      setStepIndex(i => i - 1);
    } else if (stepIndex === 1) {
      router.push('/field-sales/dashboard');
    }
  };

  // Determine if the next button should show a loading state
  const isNextLoading = isSyncingCustomer || isCreatingCustomer;
  const nextLoadingLabel = isCreatingCustomer
    ? 'Creating customer…'
    : 'Syncing customer…';

  // Steps visible in progress bar
  const progressSteps: StepId[] = wizardSteps.filter(
    s => s !== 'type-select' && s !== 'service-today-confirm'
  ) as StepId[];
  const progressIndex = progressSteps.indexOf(currentStepId);

  const showRouteStopLoader = isFromRouteStop && isSyncingCustomer;

  return (
    <div className={styles.wizardContainer} ref={wizardContainerRef}>
      {showRouteStopLoader ? (
        <div className={styles.routeStopLoader}>
          <span className={styles.spinnerDark} />
          <p>Loading customer…</p>
        </div>
      ) : (
        <>
          {/* Progress indicator — only show after type selection */}
          {stepIndex > 0 && (
            <div className={styles.progressSection}>
              <p className={styles.progressLeadType}>
                {leadType === 'new-lead' ? 'New Lead' : 'Upsell Opportunity'}
              </p>
              <div className={styles.progressBar}>
                {progressSteps.map((stepId, i) => (
                  <div
                    key={stepId}
                    className={`${styles.progressStep} ${i === progressIndex ? styles.progressStepActive : ''} ${i < progressIndex ? styles.progressStepDone : ''}`}
                  >
                    <div className={styles.progressDot}>
                      {i < progressIndex ? '✓' : i + 1}
                    </div>
                    <span className={styles.progressLabel}>
                      {STEP_ID_LABELS[stepId]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step content */}
          <div className={styles.stepWrapper}>
            {currentStepId === 'type-select' && (
              <StepTypeSelect
                onSelect={type => {
                  setLeadType(type);
                  setWizardTitle(
                    type === 'new-lead' ? 'New Lead' : 'Upsell Opportunity'
                  );
                  setStepIndex(1);
                }}
              />
            )}

            {currentStepId === 'photos' && (
              <StepPhotos photos={photos} onPhotosChange={setPhotos} />
            )}

            {currentStepId === 'ai-review' && (
              <>
                {analyzeError && (
                  <p className={styles.analyzeError}>{analyzeError}</p>
                )}
                <StepAIReview
                  aiResult={aiResult}
                  notes={notes}
                  customerMentioned={customerMentioned}
                  isHighPriority={isHighPriority}
                  propertyType={propertyType}
                  showPropertyType={leadType === 'new-lead'}
                  pestOptions={pestOptions}
                  selectedPestValue={selectedPestValue}
                  otherPestValue={otherPest}
                  isPestOptionsLoading={isPestOptionsLoading}
                  onAIResultChange={setAIResult}
                  onPestValueChange={value => {
                    setSelectedPestValue(value);
                    setHasManualPestSelection(true);
                    if (value !== OTHER_PEST_OPTION_VALUE) {
                      setOtherPest('');
                    }
                  }}
                  onOtherPestChange={value => {
                    setOtherPest(value);
                    setHasManualPestSelection(true);
                  }}
                  onNotesChange={setNotes}
                  onCustomerMentionedChange={v => {
                    setCustomerMentioned(v);
                    setReviewAttempted(false);
                  }}
                  onHighPriorityChange={v => {
                    setIsHighPriority(v);
                    setReviewAttempted(false);
                  }}
                  techMentioned={techMentioned}
                  onTechMentionedChange={v => {
                    setTechMentioned(v);
                    setReviewAttempted(false);
                  }}
                  onPropertyTypeChange={v => {
                    setPropertyType(v);
                    setReviewAttempted(false);
                  }}
                  attempted={reviewAttempted}
                />
              </>
            )}

            {currentStepId === 'new-customer' && (
              <StepNewCustomer
                form={newCustomerForm}
                onChange={setNewCustomerForm}
                error={createCustomerError}
                companyId={companyId}
                isPestPacEnabled={isPestPacEnabled}
                onPestPacPick={client => {
                  setSelectedPestPacClient(client);
                  setSelectedCustomer(null);
                  // Prefill the form so the tech can review/edit before
                  // submitting. The client is synced on leaving this step.
                  setNewCustomerForm(prev => ({
                    ...prev,
                    firstName: client.firstName ?? prev.firstName,
                    lastName: client.lastName ?? prev.lastName,
                    phone: client.phone ?? prev.phone,
                    email: client.email ?? prev.email,
                    addressInput: client.primaryAddress
                      ? [
                          client.primaryAddress.street,
                          [
                            client.primaryAddress.city,
                            client.primaryAddress.state,
                          ]
                            .filter(Boolean)
                            .join(', '),
                          client.primaryAddress.zip,
                        ]
                          .filter(Boolean)
                          .join(', ')
                      : prev.addressInput,
                    addressComponents: null,
                  }));
                }}
              />
            )}

            {currentStepId === 'select-site' && (
              <StepSelectSite
                companyId={companyId}
                selectedCustomer={selectedCustomer}
                onSelectCustomer={c => {
                  setSelectedCustomer(c);
                  setSelectedPestPacClient(null);
                  setCustomerSource('existing');
                }}
                recentCustomers={recentCustomers}
                todayRouteStops={todayRouteStops}
                isTodayRouteLoading={isTodayRouteLoading}
                onPickRouteStop={handlePickRouteStop}
                onAddNewCustomer={handleAddNewCustomer}
                isSyncingCustomer={isSyncingCustomer}
                routeStopPickError={routeStopPickError}
                companyTimezone={companyTimezone}
              />
            )}

            {currentStepId === 'service-plan-select' && (
              <StepServicePlanSelect
                companyId={companyId}
                selectedPlan={selectedServicePlan}
                onPlanSelect={setSelectedServicePlan}
                suggestedPestType={aiResult.suggested_pest_type}
                selectedPestValue={selectedPestValue}
              />
            )}

            {currentStepId === 'service-details' && (
              <StepServiceDetails
                companyId={companyId}
                locationId={
                  selectedPestPacClient?.clientId ??
                  selectedCustomer?.pestpac_client_id ??
                  null
                }
                suggestedPestType={aiResult.suggested_pest_type}
                matchedPestOption={aiResult.matched_pest_option}
                selectedPestValue={selectedPestValue}
                selectedPlan={selectedServicePlan}
                onPlanSelect={setSelectedServicePlan}
              />
            )}

            {currentStepId === 'upsell-catalog' && (
              <StepUpsellCatalog
                companyId={companyId}
                selected={upsellSelection}
                onSelect={setUpsellSelection}
              />
            )}

            {currentStepId === 'service-today-confirm' && (
              <StepServiceTodayConfirm
                selectedPlan={selectedServicePlan}
                upsellSelection={upsellSelection}
                selectedCustomer={selectedCustomer}
                techName={techName}
                onSignatureChange={setSignatureData}
                completedToday={completedToday}
                onCompletedTodayChange={setCompletedToday}
                requestedDay={requestedDay}
                onRequestedDayChange={setRequestedDay}
                requestedTime={requestedTime}
                onRequestedTimeChange={setRequestedTime}
                companyQuoteTerms={companyQuoteTerms}
                timeOptions={companyTimeOptions}
              />
            )}
          </div>

          {/* Bottom action bar */}
          <div className={styles.actionBar}>
            {syncError && (
              <p className={styles.submitError}>
                {syncError}
                {isFromRouteStop && currentStepId === 'ai-review' && (
                  <button
                    className={styles.retryLink}
                    onClick={handleSyncRetry}
                  >
                    {' '}
                    Retry
                  </button>
                )}
              </p>
            )}
            {submitError && <p className={styles.submitError}>{submitError}</p>}
            <div className={styles.actionBarButtons}>
              {stepIndex > 0 ? (
                <button
                  type="button"
                  className={styles.prevBtn}
                  onClick={handleBack}
                  aria-label="Previous step"
                >
                  <ArrowLeft size={18} className={styles.prevArrow} />
                  Previous
                </button>
              ) : (
                <button
                  className={styles.prevBtn}
                  onClick={() => router.push('/field-sales/dashboard')}
                >
                  <ArrowLeft size={18} className={styles.prevArrow} /> Cancel
                </button>
              )}

              {currentStepId === 'photos' && photos.length > 0 && (
                <button
                  className={styles.analyzeBtn}
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <span className={styles.spinner} />
                      Analyzing…
                    </>
                  ) : (
                    <>Analyze Photo</>
                  )}
                </button>
              )}

              {currentStepId === 'photos' && photos.length === 0 && (
                <button className={styles.nextBtn} onClick={handleNext}>
                  Continue Without Photos
                </button>
              )}

              {currentStepId !== 'type-select' &&
                currentStepId !== 'photos' &&
                currentStepId !== 'ai-review' &&
                currentStepId !== 'upsell-catalog' &&
                currentStepId !== 'service-today-confirm' && (
                  <button
                    className={styles.nextBtn}
                    onClick={handleNext}
                    disabled={!canGoNext() || isNextLoading}
                  >
                    {isNextLoading ? (
                      <>
                        <span className={styles.spinner} />
                        {nextLoadingLabel}
                      </>
                    ) : (
                      'Next'
                    )}
                  </button>
                )}

              {currentStepId === 'upsell-catalog' && (
                <>
                  <button
                    className={styles.sendQuoteBtn}
                    onClick={() => {
                      if (!upsellSelection) return;
                      handleSubmit('send-quote');
                    }}
                    disabled={!upsellSelection || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className={styles.spinner} />
                        Sending…
                      </>
                    ) : (
                      'Send Quote'
                    )}
                  </button>
                  <button
                    className={styles.scheduleBtn}
                    onClick={() => {
                      if (!upsellSelection) return;
                      setSellItNowFlow(true);
                      setStepIndex(i => i + 1);
                    }}
                    disabled={!upsellSelection || isSubmitting}
                  >
                    Sell It Now
                  </button>
                </>
              )}

              {currentStepId === 'ai-review' && leadType === 'new-lead' && (
                <button
                  className={styles.scheduleBtn}
                  onClick={() => {
                    if (!canGoNext()) {
                      setReviewAttempted(true);
                      // Scroll to the first unanswered required toggle so the
                      // tech sees what's missing — matches the visual
                      // top-to-bottom order on screen.
                      const orderedIds = [
                        'review-tech-mentioned',
                        'review-customer-mentioned',
                        'review-high-priority',
                        'review-property-type',
                      ];
                      if (typeof document !== 'undefined') {
                        for (const id of orderedIds) {
                          const el = document.getElementById(id);
                          if (
                            el &&
                            el.getAttribute('data-unset') === 'true'
                          ) {
                            el.scrollIntoView({
                              behavior: 'smooth',
                              block: 'center',
                            });
                            break;
                          }
                        }
                      }
                      return;
                    }
                    handleSubmit('default');
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className={styles.spinner} />
                      Submitting…
                    </>
                  ) : (
                    <>Refer To Sales</>
                  )}
                </button>
              )}

              {currentStepId === 'ai-review' && leadType === 'upsell' && (
                <button
                  className={styles.nextBtn}
                  onClick={handleNext}
                  disabled={!canGoNext() || isNextLoading}
                >
                  {isNextLoading ? (
                    <>
                      <span className={styles.spinner} />
                      {nextLoadingLabel}
                    </>
                  ) : (
                    'Next'
                  )}
                </button>
              )}

              {currentStepId === 'service-today-confirm' && (
                <button
                  className={styles.submitBtn}
                  onClick={() => {
                    // Upsell Sell It Now branches depend on "Completed Today?":
                    // Yes → won + signature/T&C; No → scheduling + preferred date.
                    // Legacy non-upsell path still uses 'service-today'.
                    if (sellItNowFlow) {
                      handleSubmit(
                        completedToday === true
                          ? 'sell-it-now-today'
                          : 'sell-it-now-scheduled'
                      );
                    } else {
                      handleSubmit('service-today');
                    }
                  }}
                  disabled={isSubmitting || !canGoNext()}
                >
                  {isSubmitting ? (
                    <>
                      <span className={styles.spinner} />
                      Submitting…
                    </>
                  ) : (
                    'Submit'
                  )}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Exit prompt modal */}
      {showExitPrompt && (
        <div
          className={styles.exitPromptOverlay}
          onClick={() => setShowExitPrompt(false)}
        >
          <div
            className={styles.exitPromptSheet}
            onClick={e => e.stopPropagation()}
          >
            <p className={styles.exitPromptTitle}>Leave opportunity?</p>
            <p className={styles.exitPromptBody}>
              Your progress has been saved as a draft. You can restore it from
              My Opportunities.
            </p>
            <button
              type="button"
              className={styles.exitSaveDraftBtn}
              onClick={() => {
                setShowExitPrompt(false);
                router.back();
              }}
            >
              Save as Draft
            </button>
            <button
              type="button"
              className={styles.exitDiscardBtn}
              onClick={() => {
                setShowExitPrompt(false);
                clearDraft();
                router.back();
              }}
            >
              Discard
            </button>
            <button
              type="button"
              className={styles.exitCancelBtn}
              onClick={() => setShowExitPrompt(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
