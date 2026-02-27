import { Dispatch, SetStateAction } from 'react';
import { InfoCard } from '@/components/Common/InfoCard/InfoCard';
import { DetailsCardsSidebar } from '@/components/Common/DetailsCardsSidebar/DetailsCardsSidebar';
import { CustomerInformation } from '@/components/Tickets/TicketContent';
import { ServiceLocationCard } from '@/components/Common/ServiceLocationCard/ServiceLocationCard';
import { ActivityFeed } from '@/components/Common/ActivityFeed/ActivityFeed';
import { NotesSection } from '@/components/Common/NotesSection/NotesSection';
import { useUser } from '@/hooks/useUser';
import { usePricingSettings } from '@/hooks/usePricingSettings';
import { useActiveSection } from '@/contexts/ActiveSectionContext';
import {
  SquareUserRound,
  SquareActivity,
  NotebookPen,
  Phone,
  TextCursorInput,
  Mail,
  MessageSquare,
  Info,
} from 'lucide-react';
import { SupportCase } from '@/types/support-case';
import styles from './SupportCaseDetailsSidebar.module.scss';

interface SupportCaseDetailsSidebarProps {
  supportCase: SupportCase;
  onShowToast?: (message: string, type: 'success' | 'error') => void;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: Dispatch<SetStateAction<boolean>>;
}

export function SupportCaseDetailsSidebar({
  supportCase,
  onShowToast,
  isSidebarExpanded,
  setIsSidebarExpanded,
}: SupportCaseDetailsSidebarProps) {
  const { activeSection, setActiveSection } = useActiveSection();
  const { user } = useUser();
  const { settings: pricingSettings } = usePricingSettings(
    supportCase.company_id
  );

  // Handler to expand sidebar when any card is expanded
  const handleCardExpand = () => {
    if (!isSidebarExpanded) {
      setIsSidebarExpanded(true);
    }
  };

  // Create a ticket-like object for the CustomerInformation component
  const createTicketFromSupportCase = {
    id: supportCase.id,
    customer: supportCase.customer || undefined,
    company_id: supportCase.company_id,
    created_at: supportCase.created_at,
    updated_at: supportCase.updated_at,
  } as any;

  return (
    <DetailsCardsSidebar
      isSidebarExpanded={isSidebarExpanded}
      setIsSidebarExpanded={setIsSidebarExpanded}
      activeSection={activeSection || undefined}
      onSectionClick={() => setActiveSection('sidebar')}
    >
      <InfoCard
        title="Contact Info"
        icon={<SquareUserRound size={20} />}
        startExpanded={false}
        onExpand={handleCardExpand}
        forceCollapse={!isSidebarExpanded}
        isCompact={!isSidebarExpanded}
        inSidebar={true}
      >
        <CustomerInformation
          ticket={createTicketFromSupportCase}
          activityEntityType="ticket"
          activityEntityId={supportCase.ticket_id || supportCase.id}
          onShowToast={onShowToast}
          onUpdate={async () => {
            if (onShowToast) {
              onShowToast(
                'Customer information updated successfully.',
                'success'
              );
            }
          }}
        />
      </InfoCard>

      <ServiceLocationCard
        serviceAddress={supportCase.primary_service_address || null}
        startExpanded={false}
        showSizeInputs
        pricingSettings={pricingSettings || undefined}
        onShowToast={onShowToast}
        editable={true}
        onExpand={handleCardExpand}
        forceCollapse={!isSidebarExpanded}
        isCompact={!isSidebarExpanded}
        inSidebar={true}
      />

      <InfoCard
        title="Activity"
        icon={<SquareActivity size={20} />}
        startExpanded={false}
        onExpand={handleCardExpand}
        forceCollapse={!isSidebarExpanded}
        isCompact={!isSidebarExpanded}
        inSidebar={true}
      >
        <ActivityFeed
          entityType="support_case"
          entityId={supportCase.id}
          companyId={supportCase.company_id}
        />
      </InfoCard>

      <InfoCard
        title="Notes"
        icon={<NotebookPen size={20} />}
        startExpanded={false}
        onExpand={handleCardExpand}
        forceCollapse={!isSidebarExpanded}
        isCompact={!isSidebarExpanded}
        inSidebar={true}
      >
        <NotesSection
          entityType="support_case"
          entityId={supportCase.id}
          companyId={supportCase.company_id}
          userId={user?.id || ''}
        />
      </InfoCard>

      <InfoCard
        title={
          supportCase.format === 'form' || (!supportCase.format && supportCase.ticket?.source === 'web_form')
            ? 'Form Details'
            : supportCase.format === 'call' || (!supportCase.format && supportCase.ticket?.source === 'phone_call')
              ? 'Call Information'
              : supportCase.format === 'email'
                ? 'Email Details'
                : supportCase.format === 'text'
                  ? 'Text Details'
                  : 'Source Information'
        }
        icon={
          supportCase.format === 'form' || (!supportCase.format && supportCase.ticket?.source === 'web_form') ? (
            <TextCursorInput size={20} />
          ) : supportCase.format === 'call' || (!supportCase.format && supportCase.ticket?.source === 'phone_call') ? (
            <Phone size={20} />
          ) : supportCase.format === 'email' ? (
            <Mail size={20} />
          ) : supportCase.format === 'text' ? (
            <MessageSquare size={20} />
          ) : (
            <Info size={20} />
          )
        }
        startExpanded={false}
        onExpand={handleCardExpand}
        forceCollapse={!isSidebarExpanded}
        isCompact={!isSidebarExpanded}
        inSidebar={true}
      >
        <div className={styles.cardContent}>
          {supportCase.source || supportCase.ticket ? (
            <>
              {supportCase.source && (
                <div className={styles.detailItem}>
                  <div className={styles.label}>Source</div>
                  <div className={styles.value}>
                    {({
                      google_ads: 'Google Ads',
                      google_organic: 'Google Organic',
                      facebook_ads: 'Facebook Ads',
                      referral: 'Referral',
                      direct: 'Direct',
                      campaign: 'Campaign',
                      widget: 'Widget',
                      other: 'Other',
                    } as Record<string, string>)[supportCase.source] ||
                      supportCase.source.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </div>
                </div>
              )}
              {supportCase.ticket && (
                <>
                  <div className={styles.detailItem}>
                    <div className={styles.label}>Type</div>
                    <div className={styles.value}>
                      {supportCase.ticket.type
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                    </div>
                  </div>
                  <div className={styles.detailItem}>
                    <div className={styles.label}>Created</div>
                    <div className={styles.value}>
                      {new Date(supportCase.ticket.created_at).toLocaleString(
                        'en-US',
                        {
                          month: 'numeric',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        }
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className={styles.noData}>No source information available</div>
          )}
        </div>
      </InfoCard>
    </DetailsCardsSidebar>
  );
}
