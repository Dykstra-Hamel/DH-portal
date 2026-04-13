'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ServiceAreaMap from '@/components/Widget/ServiceAreaMap';
import { getCompanyCoordinates, createCachedGeocodeResult, isCacheValid } from '@/lib/geocoding';
import { adminAPI } from '@/lib/api-client';
import styles from './ServiceAreasManager.module.scss';

interface ServiceAreasManagerProps {
  companyId: string;
}

interface Company {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  widget_config?: any;
}

interface Branch {
  id: string;
  name: string;
  is_active: boolean;
}

interface CompanyUser {
  id: string;
  display_name: string;
}

interface ZipCodeGroup {
  id: string;
  name: string;
  assigned_user_id: string | null;
  assigned_user_name: string | null;
  zip_codes: string[];
}

export default function ServiceAreasManager({ companyId }: ServiceAreasManagerProps) {
  const [serviceAreaInput, setServiceAreaInput] = useState('');
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [showServiceAreaMap, setShowServiceAreaMap] = useState(true);
  const [googleApiKey, setGoogleApiKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zipCodes, setZipCodes] = useState<string[]>([]);
  const [initialCenter, setInitialCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchAssignments, setBranchAssignments] = useState<Record<string, string>>({});

  // CSV upload state
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvSummary, setCsvSummary] = useState<string | null>(null);

  // Group CSV upload state
  const groupCsvUploadGroupRef = useRef<string | null>(null);
  const groupCsvInputRef = useRef<HTMLInputElement>(null);
  const [groupCsvSummary, setGroupCsvSummary] = useState<Record<string, string>>({});

  // Groups state
  const [groups, setGroups] = useState<ZipCodeGroup[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupUserId, setNewGroupUserId] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [groupZipInput, setGroupZipInput] = useState<Record<string, string>>({});
  const [savingGroupId, setSavingGroupId] = useState<string | null>(null);
  const [editingGroupNames, setEditingGroupNames] = useState<Record<string, string>>({});

  // Create stable callback for ServiceAreaMap to prevent infinite loop
  const handleAreasChange = useCallback((areas: any[]) => {
    setServiceAreas(areas);
  }, []);

  // Fetch Google API key on mount
  useEffect(() => {
    const fetchGoogleApiKey = async () => {
      try {
        const response = await fetch('/api/google-places-key');
        if (response.ok) {
          const data = await response.json();
          setGoogleApiKey(data.apiKey || '');
        }
      } catch (error) {
        console.error('Error fetching Google API key:', error);
      }
    };
    fetchGoogleApiKey();
  }, []);

  // Fetch branches for this company
  useEffect(() => {
    if (!companyId) return;
    fetch(`/api/branches?companyId=${companyId}`)
      .then(r => r.json())
      .then(d => setBranches((d.branches ?? []).filter((b: Branch) => b.is_active)))
      .catch(() => setBranches([]));
  }, [companyId]);

  // Fetch company users for the group user picker
  useEffect(() => {
    if (!companyId) return;
    fetch(`/api/companies/${companyId}/users`)
      .then(r => r.json())
      .then(d => setCompanyUsers(d.users ?? []))
      .catch(() => setCompanyUsers([]));
  }, [companyId]);

  // Load service areas, zip code groups, and geocode company address
  useEffect(() => {
    setInitialCenter(undefined);

    const loadData = async () => {
      if (!companyId) return;

      try {
        setLoading(true);

        const [companies, areasResponse, groupsResponse] = await Promise.all([
          adminAPI.getCompanies(),
          fetch(`/api/service-areas/${companyId}`),
          fetch(`/api/companies/${companyId}/zip-code-groups`),
        ]);

        const company = companies.find((c: Company) => c.id === companyId);

        if (company) {
          const coordinates = await getCompanyCoordinates(company);
          setInitialCenter({ lat: coordinates.lat, lng: coordinates.lng });

          const existingCache = company.widget_config?.geocodedAddress;
          const cachedLower = existingCache?.address?.toLowerCase() ?? '';
          const cacheNeedsUpdate =
            !existingCache ||
            !isCacheValid(existingCache) ||
            (company.city && !cachedLower.includes(company.city.toLowerCase())) ||
            (company.state && !cachedLower.includes(company.state.toLowerCase()));

          if (cacheNeedsUpdate) {
            const cachedResult = createCachedGeocodeResult(coordinates);
            adminAPI.updateCompany(company.id, {
              widget_config: { ...company.widget_config, geocodedAddress: cachedResult },
            }).catch((err: unknown) => {
              console.error('Failed to cache geocoded address:', err);
            });
          }
        }

        if (areasResponse.ok) {
          const data = await areasResponse.json();
          if (data.success) {
            const areas = data.serviceAreas || [];
            const geographic = areas.filter((a: any) => a.type !== 'zip_code');
            const zipCodeAreas = areas.filter((a: any) => a.type === 'zip_code');
            setServiceAreas(geographic);
            const assignments: Record<string, string> = {};
            geographic.forEach((a: any) => {
              if (a.id && a.branchId) assignments[a.id] = a.branchId;
            });
            setBranchAssignments(assignments);
            const allZipCodes = [...new Set<string>(zipCodeAreas.flatMap((a: any) => a.zipCodes || []))];
            setZipCodes(allZipCodes);
          }
        }

        if (groupsResponse.ok) {
          const data = await groupsResponse.json();
          setGroups(data.groups ?? []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setServiceAreas([]);
        setZipCodes([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [companyId]);

  const saveServiceAreas = async (areas: any[]) => {
    try {
      setSaving(true);
      const areasWithBranch = areas.map(a => ({
        ...a,
        branchId: branchAssignments[a.id] ?? a.branchId ?? null,
      }));
      const response = await fetch(`/api/service-areas/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceAreas: areasWithBranch }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setServiceAreas(areas);
        } else {
          throw new Error(data.error || 'Failed to save service areas');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving service areas:', error);
      alert('Failed to save service areas. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addZipCode = () => {
    if (serviceAreaInput.trim() && !zipCodes.includes(serviceAreaInput.trim())) {
      const newZipCodes = [...zipCodes, serviceAreaInput.trim()];
      setZipCodes(newZipCodes);
      setServiceAreaInput('');
      saveZipCodes(newZipCodes);
    }
  };

  const removeZipCode = (zipCode: string) => {
    const newZipCodes = zipCodes.filter(z => z !== zipCode);
    setZipCodes(newZipCodes);
    saveZipCodes(newZipCodes);
  };

  const saveZipCodes = async (zipCodeList: string[]) => {
    try {
      // Zip codes live in the service_areas table as a zip_code-type entry.
      // The PUT endpoint replaces all areas, so we must include the current
      // geographic areas to avoid wiping them.
      const geographicAreas = serviceAreas.map(a => ({
        ...a,
        branchId: branchAssignments[a.id] ?? a.branchId ?? null,
      }));

      const uniqueZips = [...new Set(zipCodeList)];
      const zipArea = uniqueZips.length > 0
        ? [{ name: 'Zip Code Service Area', type: 'zip_code', zipCodes: uniqueZips, priority: 0, isActive: true }]
        : [];

      const response = await fetch(`/api/service-areas/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceAreas: [...geographicAreas, ...zipArea] }),
      });
      if (!response.ok) {
        throw new Error('Failed to save zip codes');
      }
    } catch (error) {
      console.error('Error saving zip codes:', error);
      alert('Failed to save zip codes. Please try again.');
    }
  };

  // CSV upload handler
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // Split by commas, newlines, semicolons, tabs — filter to 5-digit numeric strings
      const candidates = text.split(/[\s,;\t]+/);
      const valid5Digit = candidates.filter(v => /^\d{5}$/.test(v.trim())).map(v => v.trim());

      const added: string[] = [];
      const duplicates: string[] = [];

      valid5Digit.forEach(zip => {
        if (zipCodes.includes(zip) || added.includes(zip)) {
          duplicates.push(zip);
        } else {
          added.push(zip);
        }
      });

      if (added.length > 0) {
        const merged = [...zipCodes, ...added];
        setZipCodes(merged);
        saveZipCodes(merged);
      }

      setCsvSummary(
        `Added ${added.length} zip code${added.length !== 1 ? 's' : ''}` +
        (duplicates.length > 0 ? `, ${duplicates.length} duplicate${duplicates.length !== 1 ? 's' : ''} skipped` : '')
      );

      // Reset file input so same file can be re-uploaded if needed
      if (csvInputRef.current) csvInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Group CSV upload handler
  const handleGroupCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const groupId = groupCsvUploadGroupRef.current;
    if (!file || !groupId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const candidates = text.split(/[\s,;\t]+/);
      const valid = candidates.filter(v => /^\d{5}$/.test(v.trim())).map(v => v.trim());

      const currentGroup = groups.find(g => g.id === groupId);
      if (!currentGroup) return;

      const groupAdded: string[] = [];
      const groupDupes: string[] = [];
      valid.forEach(zip => {
        if (currentGroup.zip_codes.includes(zip) || groupAdded.includes(zip)) {
          groupDupes.push(zip);
        } else {
          groupAdded.push(zip);
        }
      });

      if (groupAdded.length > 0) {
        handleUpdateGroup(groupId, { zip_codes: [...currentGroup.zip_codes, ...groupAdded] });
      }

      setZipCodes(prev => {
        const missingFromFlat = valid.filter(z => !prev.includes(z));
        if (missingFromFlat.length > 0) {
          const merged = [...prev, ...missingFromFlat];
          saveZipCodes(merged);
          return merged;
        }
        return prev;
      });

      setGroupCsvSummary(prev => ({
        ...prev,
        [groupId]: `Added ${groupAdded.length} zip${groupAdded.length !== 1 ? 's' : ''} to group` +
          (groupDupes.length > 0 ? `, ${groupDupes.length} duplicate${groupDupes.length !== 1 ? 's' : ''} skipped` : ''),
      }));

      if (groupCsvInputRef.current) groupCsvInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleBranchAssignment = (areaId: string, branchId: string) => {
    setBranchAssignments(prev => ({ ...prev, [areaId]: branchId }));
  };

  const saveBranchAssignments = async () => {
    await saveServiceAreas(serviceAreas);
  };

  // Group CRUD helpers
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setCreatingGroup(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/zip-code-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName.trim(),
          assigned_user_id: newGroupUserId || null,
          zip_codes: [],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(prev => [...prev, {
          id: data.group.id,
          name: data.group.name,
          assigned_user_id: data.group.assigned_user_id,
          assigned_user_name: companyUsers.find(u => u.id === data.group.assigned_user_id)?.display_name ?? null,
          zip_codes: data.group.zip_codes,
        }]);
        setNewGroupName('');
        setNewGroupUserId('');
        setShowCreateGroup(false);
      }
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleUpdateGroup = async (groupId: string, patch: Partial<{ name: string; assigned_user_id: string | null; zip_codes: string[] }>) => {
    setSavingGroupId(groupId);
    try {
      const res = await fetch(`/api/companies/${companyId}/zip-code-groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(prev => prev.map(g => g.id === groupId ? {
          ...g,
          name: data.group.name,
          assigned_user_id: data.group.assigned_user_id,
          assigned_user_name: companyUsers.find(u => u.id === data.group.assigned_user_id)?.display_name ?? null,
          zip_codes: data.group.zip_codes,
        } : g));
      }
    } catch (error) {
      console.error('Error updating group:', error);
    } finally {
      setSavingGroupId(null);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Delete this zip code group? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/companies/${companyId}/zip-code-groups/${groupId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setGroups(prev => prev.filter(g => g.id !== groupId));
        if (expandedGroupId === groupId) setExpandedGroupId(null);
      }
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const handleAddZipToGroup = (group: ZipCodeGroup) => {
    const zip = (groupZipInput[group.id] ?? '').trim();
    if (!zip || group.zip_codes.includes(zip)) return;
    const updated = [...group.zip_codes, zip];
    setGroupZipInput(prev => ({ ...prev, [group.id]: '' }));
    handleUpdateGroup(group.id, { zip_codes: updated });

    // Also add to the main service area zip list if not already there
    if (!zipCodes.includes(zip)) {
      const merged = [...zipCodes, zip];
      setZipCodes(merged);
      saveZipCodes(merged);
    }
  };

  const handleRemoveZipFromGroup = (group: ZipCodeGroup, zip: string) => {
    const updated = group.zip_codes.filter(z => z !== zip);
    handleUpdateGroup(group.id, { zip_codes: updated });
  };

  const handleGroupNameBlur = (group: ZipCodeGroup) => {
    const name = editingGroupNames[group.id];
    if (name !== undefined && name.trim() && name.trim() !== group.name) {
      handleUpdateGroup(group.id, { name: name.trim() });
    }
    setEditingGroupNames(prev => {
      const next = { ...prev };
      delete next[group.id];
      return next;
    });
  };

  if (loading) {
    return <div className={styles.loading}>Loading service areas...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>Service Areas</h2>
          <p>Define where you provide service using geographic areas or zip codes.</p>
        </div>
      </div>

      <div className={styles.serviceAreaTabs}>
        <button
          type="button"
          className={`${styles.tabButton} ${showServiceAreaMap ? styles.active : ''}`}
          onClick={() => setShowServiceAreaMap(true)}
        >
          Geographic Areas
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${!showServiceAreaMap ? styles.active : ''}`}
          onClick={() => setShowServiceAreaMap(false)}
        >
          Zip Codes
        </button>
      </div>

      {!showServiceAreaMap ? (
        <div className={styles.zipCodeSection}>
          {/* Flat zip code input row */}
          <div className={styles.serviceAreaInput}>
            <input
              type="text"
              value={serviceAreaInput}
              onChange={e => setServiceAreaInput(e.target.value)}
              placeholder="Enter zip code (e.g., 12345)"
              onKeyDown={e => e.key === 'Enter' && addZipCode()}
            />
            <button onClick={addZipCode} type="button">
              Add
            </button>
            <button
              type="button"
              className={styles.uploadCsvButton}
              onClick={() => { setCsvSummary(null); csvInputRef.current?.click(); }}
            >
              Upload CSV
            </button>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,.txt"
              className={styles.hiddenFileInput}
              onChange={handleCsvUpload}
            />
            <input
              ref={groupCsvInputRef}
              type="file"
              accept=".csv,.txt"
              className={styles.hiddenFileInput}
              onChange={handleGroupCsvUpload}
            />
          </div>

          {csvSummary && (
            <p className={styles.csvSummary}>{csvSummary}</p>
          )}

          <div className={styles.serviceAreas}>
            {zipCodes.map(zipCode => (
              <span key={zipCode} className={styles.serviceArea}>
                {zipCode}
                <button type="button" onClick={() => removeZipCode(zipCode)}>
                  ×
                </button>
              </span>
            ))}
          </div>
          {zipCodes.length === 0 && (
            <p className={styles.emptyState}>
              No zip codes configured. Add zip codes to restrict service to specific areas.
            </p>
          )}

          {/* Zip Code Groups section */}
          <div className={styles.groupsSection}>
            <div className={styles.groupsSectionHeader}>
              <div>
                <h3 className={styles.groupsSectionTitle}>Zip Code Groups</h3>
                <p className={styles.groupsSectionSubtitle}>
                  Organize zip codes into named groups with an assigned team member.
                </p>
              </div>
              <button
                type="button"
                className={styles.createGroupButton}
                onClick={() => setShowCreateGroup(v => !v)}
              >
                {showCreateGroup ? 'Cancel' : 'Create Group'}
              </button>
            </div>

            {showCreateGroup && (
              <div className={styles.createGroupForm}>
                <input
                  type="text"
                  placeholder="Group name (e.g., North Route)"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateGroup()}
                  className={styles.groupNameInput}
                />
                <select
                  value={newGroupUserId}
                  onChange={e => setNewGroupUserId(e.target.value)}
                  className={styles.groupUserSelect}
                >
                  <option value="">No assigned user</option>
                  {companyUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.display_name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.saveGroupButton}
                  onClick={handleCreateGroup}
                  disabled={creatingGroup || !newGroupName.trim()}
                >
                  {creatingGroup ? 'Creating...' : 'Create'}
                </button>
              </div>
            )}

            {groups.length === 0 && !showCreateGroup && (
              <p className={styles.emptyState}>
                No groups yet. Create a group to organize zip codes by route or team member.
              </p>
            )}

            <div className={styles.groupList}>
              {groups.map(group => (
                <div key={group.id} className={styles.groupCard}>
                  <div
                    className={styles.groupHeader}
                    onClick={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}
                  >
                    <div className={styles.groupHeaderLeft}>
                      <span className={styles.groupExpandIcon}>
                        {expandedGroupId === group.id ? '▾' : '▸'}
                      </span>
                      <input
                        type="text"
                        className={styles.groupNameEditInput}
                        value={editingGroupNames[group.id] !== undefined ? editingGroupNames[group.id] : group.name}
                        onChange={e => setEditingGroupNames(prev => ({ ...prev, [group.id]: e.target.value }))}
                        onBlur={() => handleGroupNameBlur(group)}
                        onClick={e => e.stopPropagation()}
                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                      />
                      <span className={styles.groupZipCount}>{group.zip_codes.length} zip{group.zip_codes.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className={styles.groupHeaderRight} onClick={e => e.stopPropagation()}>
                      <select
                        value={group.assigned_user_id ?? ''}
                        onChange={e => handleUpdateGroup(group.id, { assigned_user_id: e.target.value || null })}
                        className={styles.groupUserSelect}
                        disabled={savingGroupId === group.id}
                      >
                        <option value="">No assigned user</option>
                        {companyUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.display_name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className={styles.deleteGroupButton}
                        onClick={() => handleDeleteGroup(group.id)}
                        title="Delete group"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {expandedGroupId === group.id && (
                    <div className={styles.groupBody}>
                      <div className={styles.groupZipInputRow}>
                        <input
                          type="text"
                          placeholder="Add zip code"
                          value={groupZipInput[group.id] ?? ''}
                          onChange={e => setGroupZipInput(prev => ({ ...prev, [group.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && handleAddZipToGroup(group)}
                          className={styles.groupZipEntryInput}
                        />
                        <button
                          type="button"
                          className={styles.addGroupZipButton}
                          onClick={() => handleAddZipToGroup(group)}
                          disabled={savingGroupId === group.id}
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          className={styles.uploadCsvButton}
                          onClick={() => {
                            setGroupCsvSummary(prev => ({ ...prev, [group.id]: '' }));
                            groupCsvUploadGroupRef.current = group.id;
                            groupCsvInputRef.current?.click();
                          }}
                        >
                          Upload CSV
                        </button>
                      </div>
                      {groupCsvSummary[group.id] && (
                        <p className={styles.csvSummary}>{groupCsvSummary[group.id]}</p>
                      )}
                      <div className={styles.groupZipList}>
                        {group.zip_codes.map(zip => (
                          <span key={zip} className={styles.serviceArea}>
                            {zip}
                            <button
                              type="button"
                              onClick={() => handleRemoveZipFromGroup(group, zip)}
                              disabled={savingGroupId === group.id}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {group.zip_codes.length === 0 && (
                          <p className={styles.groupEmptyZips}>No zip codes in this group yet.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.geographicSection}>
          {googleApiKey ? (
            <ServiceAreaMap
              companyId={companyId}
              existingAreas={serviceAreas}
              onAreasChange={handleAreasChange}
              onSave={saveServiceAreas}
              googleMapsApiKey={googleApiKey}
              defaultCenter={initialCenter}
            />
          ) : (
            <div className={styles.missingApiKey}>
              <p>Google Maps API key is required for geographic service areas.</p>
              <p>Please add NEXT_PUBLIC_GOOGLE_PLACES_API_KEY to your environment variables.</p>
            </div>
          )}

          {serviceAreas.length > 0 && branches.length > 0 && (
            <div className={styles.branchAssignmentPanel}>
              <h3 className={styles.branchAssignmentTitle}>Branch Assignment</h3>
              <p className={styles.branchAssignmentSubtitle}>
                Assign a branch to each service area. Save changes after updating.
              </p>
              <div className={styles.branchAssignmentList}>
                {serviceAreas.map(area => (
                  <div key={area.id || area.name} className={styles.branchAssignmentRow}>
                    <span className={styles.areaName}>{area.name}</span>
                    <select
                      className={styles.branchSelect}
                      value={branchAssignments[area.id] ?? ''}
                      onChange={e => handleBranchAssignment(area.id, e.target.value)}
                      disabled={saving}
                    >
                      <option value="">No branch</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <button
                className={styles.saveBranchButton}
                onClick={saveBranchAssignments}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Branch Assignments'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
