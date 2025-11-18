'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Outfit } from 'next/font/google';
import QuoteSteps from '@/components/Quote/QuoteSteps/QuoteSteps';
import './quote-modal.css';

const outfit = Outfit({ subsets: ['latin'] });

interface Branding {
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  icon_logo_url: string;
  font_primary_name?: string;
  font_primary_url?: string;
  slogans?: {
    line1: string;
    line2: string;
    line3: string;
  };
}

interface Company {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  website: any;
  branding?: Branding;
}

interface Quote {
  id: string;
  company_id: string;
  lead_id: string;
  customer_id: string;
  service_address_id: string;
  primary_pest: string;
  additional_pests: string[];
  home_size_range: string;
  yard_size_range: string;
  total_initial_price: number;
  total_recurring_price: number;
  quote_status: string;
  quote_url: string;
  line_items: any[];
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  service_address: {
    id: string;
    street_address: string;
    apartment_unit: string | null;
    address_line_2: string | null;
    city: string;
    state: string;
    zip_code: string;
    home_size_range: string;
    yard_size_range: string;
  };
  lead: {
    id: string;
    lead_status: string;
    service_type: string;
    comments: string;
    requested_date: string | null;
    requested_time: string | null;
  };
  company: Company;
}

function QuoteContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const companySlug = params.companySlug as string;
  const quoteId = params.quoteId as string;
  const token = searchParams.get('token');

  const [company, setCompany] = useState<Company | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Check if token is present
        if (!token) {
          setError('Invalid or missing access token. Please use the link provided in your email.');
          setLoading(false);
          return;
        }

        // Fetch company data
        const companyResponse = await fetch(`/api/companies/by-slug/${companySlug}`);
        if (!companyResponse.ok) {
          if (companyResponse.status === 404) {
            router.push('/404');
            return;
          }
          throw new Error('Failed to fetch company data');
        }
        const companyData = await companyResponse.json();
        setCompany(companyData.company);
        setBranding(companyData.branding || null);

        // Fetch quote data with token
        const quoteResponse = await fetch(
          `/api/quotes/${quoteId}/public?companySlug=${companySlug}&token=${token}`
        );
        if (!quoteResponse.ok) {
          if (quoteResponse.status === 404) {
            router.push('/404');
            return;
          }
          if (quoteResponse.status === 403) {
            setError('Invalid or expired access token. Please use the link provided in your email.');
            return;
          }
          throw new Error('Failed to fetch quote data');
        }
        const quoteData = await quoteResponse.json();
        setQuote(quoteData.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load quote. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (companySlug && quoteId) {
      fetchData();
    }
  }, [companySlug, quoteId, token, router]);

  // Load custom font from branding
  useEffect(() => {
    if (branding?.font_primary_url) {
      // Remove any existing custom font link
      const existingLink = document.querySelector('#quote-custom-font');
      if (existingLink) {
        existingLink.remove();
      }

      // Add new font link
      const link = document.createElement('link');
      link.id = 'quote-custom-font';
      link.rel = 'stylesheet';
      link.href = branding.font_primary_url;
      document.head.appendChild(link);
    }
  }, [branding]);

  if (loading) {
    return (
      <div className={`dh-modal-overlay ${outfit.className}`}>
        <div className="dh-modal-content">
          <div className="dh-modal-body">
            <div className="quote-loading">
              <div className="loading-spinner"></div>
              <p>Loading your quote...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`dh-modal-overlay ${outfit.className}`}>
        <div className="dh-modal-content">
          <div className="dh-modal-body">
            <div className="quote-error">
              <h2>Unable to Load Quote</h2>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className={`dh-modal-overlay ${outfit.className}`}>
        <div className="dh-modal-content">
          <div className="dh-modal-body">
            <div className="quote-error">
              <h2>Company Not Found</h2>
              <p>The company &quot;{companySlug}&quot; could not be found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className={`dh-modal-overlay ${outfit.className}`}>
        <div className="dh-modal-content">
          <div className="dh-modal-body">
            <div className="quote-error">
              <h2>Quote Not Found</h2>
              <p>The quote you&apos;re looking for could not be found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`dh-modal-overlay ${outfit.className}`}>
      <div className="dh-modal-content">
        <div className="dh-modal-body">
          <QuoteSteps company={company} branding={branding} quote={quote} token={token} />
        </div>
      </div>
    </div>
  );
}

export default function QuotePage() {
  return (
    <Suspense
      fallback={
        <div className={`dh-modal-overlay ${outfit.className}`}>
          <div className="dh-modal-content">
            <div className="dh-modal-body">
              <div className="quote-loading">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <QuoteContent />
    </Suspense>
  );
}
