/**
 * Pre-Footer Section Component
 *
 * Rich text section displayed between FAQ and Footer
 */

import { useMemo } from 'react';
import styles from '../CampaignLandingPage.module.scss';
import { processTextWithVariables, type VariableContext } from '@/lib/campaign-text-processing';

interface PreFooterSectionProps {
  content: string;
  customer: VariableContext['customer'];
  company: VariableContext['company'];
  pricing: VariableContext['pricing'];
  branding?: VariableContext['branding'];
  serviceName?: string;
  tagline?: string;
}

export default function PreFooterSection({
  content,
  customer,
  company,
  pricing,
  branding,
  serviceName,
  tagline,
}: PreFooterSectionProps) {
  const processedContent = useMemo(() => {
    const variableContext: VariableContext = {
      customer,
      pricing,
      company,
      branding,
      serviceName,
      tagline,
    };
    return processTextWithVariables(content, variableContext);
  }, [content, customer, pricing, company, branding, serviceName, tagline]);

  return (
    <section className={styles.preFooterSection}>
      <div dangerouslySetInnerHTML={{ __html: processedContent }} />
    </section>
  );
}
