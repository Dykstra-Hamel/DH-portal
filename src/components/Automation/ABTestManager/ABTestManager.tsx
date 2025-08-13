import React, { useState, useEffect } from 'react';
import ABTestAnalytics from '../ABTestAnalytics/ABTestAnalytics';
import styles from './ABTestManager.module.scss';

interface ABTestCampaign {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  template_id: string;
  created_at: string;
  started_at?: string;
  ended_at?: string;
  winner_variant?: string;
  significance_threshold: number;
  confidence_level: number;
  minimum_sample_size: number;
}

interface ABTestVariant {
  id: string;
  campaign_id: string;
  name: string;
  template_id: string;
  traffic_percentage: number;
  is_control: boolean;
}

interface ABTestResults {
  variant_id: string;
  variant_name: string;
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  conversions: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  statistical_significance: boolean;
}

interface StatisticalResults {
  winner?: string;
  confidence: number;
  significance: boolean;
  improvement: number;
  recommendation: string;
  results: ABTestResults[];
}

interface EmailTemplate {
  id?: string;
  name: string;
  description: string;
  template_type: string;
  subject_line: string;
  html_content: string;
  text_content: string;
  variables?: string[];
  is_active: boolean;
}

interface ABTestManagerProps {
  companyId: string;
  emailTemplates: EmailTemplate[];
  onRefreshTemplates: () => void;
}

export default function ABTestManager({ companyId, emailTemplates, onRefreshTemplates }: ABTestManagerProps) {
  const [campaigns, setCampaigns] = useState<ABTestCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<ABTestCampaign | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [testResults, setTestResults] = useState<StatisticalResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'analytics'>('campaigns');

  // Form state for creating new campaigns
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    template_id: '',
    variants: [
      { name: 'Control', template_id: '', traffic_percentage: 50, is_control: true },
      { name: 'Variant A', template_id: '', traffic_percentage: 50, is_control: false }
    ],
    significance_threshold: 0.95,
    confidence_level: 0.95,
    minimum_sample_size: 100
  });

  useEffect(() => {
    fetchCampaigns();
  }, [companyId]);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}/ab-tests`);
      if (response.ok) {
        const data = await response.json();
        // Extract campaigns array from API response structure
        setCampaigns(data.campaigns || []);
      } else {
        console.error('Failed to fetch campaigns:', response.status);
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}/ab-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCampaign),
      });

      if (response.ok) {
        const data = await response.json();
        // Extract campaign from API response structure
        if (data.campaign) {
          setCampaigns([...campaigns, data.campaign]);
          setShowCreateModal(false);
          resetForm();
        }
      } else {
        const error = await response.json();
        alert(`Error creating campaign: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Error creating campaign');
    }
  };

  const startCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/ab-tests/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'running' }),
      });

      if (response.ok) {
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error starting campaign:', error);
    }
  };

  const pauseCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/ab-tests/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'paused' }),
      });

      if (response.ok) {
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error pausing campaign:', error);
    }
  };

  const viewResults = async (campaign: ABTestCampaign) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/ab-tests/${campaign.id}/results`);
      if (response.ok) {
        const results = await response.json();
        setTestResults(results);
        setSelectedCampaign(campaign);
        setShowResultsModal(true);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const promoteWinner = async (campaignId: string, winnerVariant: string, force: boolean = false) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/ab-tests/${campaignId}/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ winner_variant: winnerVariant, force }),
      });

      if (response.ok) {
        fetchCampaigns();
        setShowResultsModal(false);
        onRefreshTemplates();
        alert('Winner promoted successfully!');
      } else {
        const error = await response.json();
        alert(`Error promoting winner: ${error.error}`);
      }
    } catch (error) {
      console.error('Error promoting winner:', error);
    }
  };

  const resetForm = () => {
    setNewCampaign({
      name: '',
      template_id: '',
      variants: [
        { name: 'Control', template_id: '', traffic_percentage: 50, is_control: true },
        { name: 'Variant A', template_id: '', traffic_percentage: 50, is_control: false }
      ],
      significance_threshold: 0.95,
      confidence_level: 0.95,
      minimum_sample_size: 100
    });
  };

  const addVariant = () => {
    const variantLetter = String.fromCharCode(65 + newCampaign.variants.length - 1);
    setNewCampaign({
      ...newCampaign,
      variants: [
        ...newCampaign.variants,
        {
          name: `Variant ${variantLetter}`,
          template_id: '',
          traffic_percentage: 0,
          is_control: false
        }
      ]
    });
  };

  const removeVariant = (index: number) => {
    if (newCampaign.variants.length > 2) {
      const newVariants = newCampaign.variants.filter((_, i) => i !== index);
      setNewCampaign({
        ...newCampaign,
        variants: newVariants
      });
    }
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...newCampaign.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setNewCampaign({
      ...newCampaign,
      variants: newVariants
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#10b981';
      case 'paused': return '#f59e0b';
      case 'completed': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading A/B tests...</div>;
  }

  return (
    <div className={styles.abTestManager}>
      <div className={styles.header}>
        <h3>A/B Testing</h3>
        <button 
          className={styles.createButton}
          onClick={() => setShowCreateModal(true)}
        >
          Create Test
        </button>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'campaigns' ? styles.active : ''}`}
          onClick={() => setActiveTab('campaigns')}
        >
          Campaigns
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'analytics' ? styles.active : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>

      {activeTab === 'campaigns' && (
        <div className={styles.campaignsList}>
          {campaigns.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No A/B tests created yet</p>
              <button 
                className={styles.createButton}
                onClick={() => setShowCreateModal(true)}
              >
                Create Your First Test
              </button>
            </div>
          ) : (
            (campaigns || []).map((campaign) => (
              <div key={campaign.id} className={styles.campaignCard}>
                <div className={styles.campaignHeader}>
                  <h4>{campaign.name}</h4>
                  <span 
                    className={styles.status}
                    style={{ backgroundColor: getStatusColor(campaign.status) }}
                  >
                    {campaign.status}
                  </span>
                </div>
                <div className={styles.campaignMeta}>
                  <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                  {campaign.started_at && (
                    <span>Started: {new Date(campaign.started_at).toLocaleDateString()}</span>
                  )}
                </div>
                <div className={styles.campaignActions}>
                  {campaign.status === 'draft' && (
                    <button onClick={() => startCampaign(campaign.id)}>
                      Start Test
                    </button>
                  )}
                  {campaign.status === 'running' && (
                    <button onClick={() => pauseCampaign(campaign.id)}>
                      Pause Test
                    </button>
                  )}
                  {campaign.status === 'paused' && (
                    <button onClick={() => startCampaign(campaign.id)}>
                      Resume Test
                    </button>
                  )}
                  <button onClick={() => viewResults(campaign)}>
                    View Results
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className={styles.analytics}>
          <ABTestAnalytics companyId={companyId} />
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h4>Create A/B Test Campaign</h4>
              <button onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Campaign Name</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                  placeholder="Enter campaign name"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Base Template</label>
                <select
                  value={newCampaign.template_id}
                  onChange={(e) => setNewCampaign({...newCampaign, template_id: e.target.value})}
                >
                  <option value="">Select template</option>
                  {emailTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.variantsSection}>
                <div className={styles.variantsHeader}>
                  <h5>Test Variants</h5>
                  <button type="button" onClick={addVariant}>Add Variant</button>
                </div>
                
                {newCampaign.variants.map((variant, index) => (
                  <div key={index} className={styles.variantRow}>
                    <input
                      type="text"
                      placeholder="Variant name"
                      value={variant.name}
                      onChange={(e) => updateVariant(index, 'name', e.target.value)}
                    />
                    <select
                      value={variant.template_id}
                      onChange={(e) => updateVariant(index, 'template_id', e.target.value)}
                    >
                      <option value="">Select template</option>
                      {emailTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Traffic %"
                      value={variant.traffic_percentage}
                      onChange={(e) => updateVariant(index, 'traffic_percentage', Number(e.target.value))}
                      min="1"
                      max="100"
                    />
                    {!variant.is_control && newCampaign.variants.length > 2 && (
                      <button 
                        type="button"
                        onClick={() => removeVariant(index)}
                        className={styles.removeButton}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className={styles.statisticalSettings}>
                <h5>Statistical Settings</h5>
                <div className={styles.settingsRow}>
                  <div className={styles.formGroup}>
                    <label>Confidence Level</label>
                    <select
                      value={newCampaign.confidence_level}
                      onChange={(e) => setNewCampaign({...newCampaign, confidence_level: Number(e.target.value)})}
                    >
                      <option value={0.90}>90%</option>
                      <option value={0.95}>95%</option>
                      <option value={0.99}>99%</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Minimum Sample Size</label>
                    <input
                      type="number"
                      value={newCampaign.minimum_sample_size}
                      onChange={(e) => setNewCampaign({...newCampaign, minimum_sample_size: Number(e.target.value)})}
                      min="50"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button 
                onClick={createCampaign}
                disabled={!newCampaign.name || !newCampaign.template_id || newCampaign.variants.some(v => !v.template_id)}
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && testResults && selectedCampaign && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h4>{selectedCampaign.name} - Results</h4>
              <button onClick={() => setShowResultsModal(false)}>×</button>
            </div>
            
            <div className={styles.modalBody}>
              {testResults.significance && testResults.winner && (
                <div className={styles.winnerAlert}>
                  <h5>Statistical Winner Detected!</h5>
                  <p>
                    <strong>{testResults.results.find(r => r.variant_id === testResults.winner)?.variant_name}</strong> 
                    {' '}shows a <strong>{testResults.improvement.toFixed(1)}%</strong> improvement 
                    with <strong>{(testResults.confidence * 100).toFixed(1)}%</strong> confidence.
                  </p>
                  <p>{testResults.recommendation}</p>
                </div>
              )}

              <div className={styles.resultsTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Variant</th>
                      <th>Emails Sent</th>
                      <th>Opens</th>
                      <th>Clicks</th>
                      <th>Conversions</th>
                      <th>Open Rate</th>
                      <th>Click Rate</th>
                      <th>Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testResults.results.map((result) => (
                      <tr key={result.variant_id}>
                        <td>{result.variant_name}</td>
                        <td>{result.emails_sent}</td>
                        <td>{result.emails_opened}</td>
                        <td>{result.emails_clicked}</td>
                        <td>{result.conversions}</td>
                        <td>{(result.open_rate * 100).toFixed(1)}%</td>
                        <td>{(result.click_rate * 100).toFixed(1)}%</td>
                        <td>{(result.conversion_rate * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {testResults.significance && testResults.winner && (
                <div className={styles.promotionSection}>
                  <h5>Promote Winner</h5>
                  <p>
                    This will copy the winning variant&apos;s content to replace the base template 
                    and mark this test as completed.
                  </p>
                  <div className={styles.promotionButtons}>
                    <button 
                      onClick={() => promoteWinner(selectedCampaign.id, testResults.winner!, false)}
                      className={styles.promoteButton}
                    >
                      Promote Winner
                    </button>
                    <button 
                      onClick={() => promoteWinner(selectedCampaign.id, testResults.winner!, true)}
                      className={styles.forcePromoteButton}
                    >
                      Force Promote
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => setShowResultsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}