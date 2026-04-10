'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import styles from './QuickQuoteStep1.module.scss';

interface PestOption {
  id: string;
  pest_id: string;
  name: string;
  slug: string;
  description: string;
  icon_svg: string;
  custom_label: string | null;
  how_we_do_it_text: string | null;
}

interface QuickQuoteStep1Props {
  companyId: string;
  salesScript: string;
  salesTips: string[];
  onSelectPest: (pest: PestOption) => void;
}

export default function QuickQuoteStep1({
  companyId,
  salesScript,
  salesTips,
  onSelectPest,
}: QuickQuoteStep1Props) {
  const [pests, setPests] = useState<PestOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const fetchPests = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/pest-options/${companyId}`);
        if (!response.ok) throw new Error('Failed to fetch pest options');
        const data = await response.json();
        setPests(data.data?.companyPestOptions || []);
      } catch (err) {
        console.error('Error fetching pest options:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPests();
  }, [companyId]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader2 size={20} className={styles.spinner} />
        Loading pests&hellip;
      </div>
    );
  }

  return (
    <div className={styles.step}>
      {/* Sales Script */}
      <div className={styles.scriptCard}>
        <p className={styles.scriptTitle}>Sales Script</p>
        <p className={styles.scriptText}>{salesScript}</p>
      </div>

      {/* Pest Grid */}
      <div>
        <p className={styles.pestSectionTitle}>What pest is the customer calling about?</p>
        <p className={styles.pestSectionSubtitle}>Click a pest to continue</p>
        <div className={styles.pestGrid}>
          {pests.map((pest) => (
            <button
              key={pest.id}
              type="button"
              className={styles.pestCard}
              onClick={() => onSelectPest(pest)}
            >
              <span
                className={styles.pestIcon}
                dangerouslySetInnerHTML={{ __html: pest.icon_svg }}
              />
              <span className={styles.pestName}>
                {pest.custom_label || pest.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Sales Tips */}
      <div className={styles.tipsCard}>
        <p className={styles.tipsTitle}>Sales Tips</p>
        <ul className={styles.tipsList}>
          {salesTips.map((tip, i) => (
            <li key={i} className={styles.tipsItem}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
