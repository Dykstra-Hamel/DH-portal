'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Upload, FileText, Link2, Type, RefreshCw, AlertCircle, CheckCircle, Info, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import styles from './KnowledgeBase.module.scss'

export interface RetellKnowledgeBaseItem {
  id: string
  type: 'url' | 'file' | 'text'
  name: string
  content: string
  source_id: string
}

interface KnowledgeBaseSettings {
  retell_api_key: string
  retell_knowledge_base_id: string
}


interface KnowledgeBaseProps {
  companyId: string
}

export default function KnowledgeBase({ companyId }: KnowledgeBaseProps) {
  const [retellItems, setRetellItems] = useState<RetellKnowledgeBaseItem[]>([])
  const [retellLoading, setRetellLoading] = useState(true)
  const [settings, setSettings] = useState<KnowledgeBaseSettings>({
    retell_api_key: '',
    retell_knowledge_base_id: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'urls' | 'files' | 'texts'>('urls')
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set())
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  
  // Form states
  const [newUrl, setNewUrl] = useState('')
  const [newText, setNewText] = useState({ name: '', content: '' })
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadKnowledgeBase()
    loadRetellKnowledgeBase()
  }, [companyId])

  const loadKnowledgeBase = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/companies/${companyId}/knowledge-base`)
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || {
          retell_api_key: '',
          retell_knowledge_base_id: ''
        })
      } else {
        throw new Error('Failed to load knowledge base settings')
      }
    } catch (error) {
      console.error('Error loading knowledge base settings:', error)
      setError('Failed to load knowledge base settings')
    } finally {
      setLoading(false)
    }
  }

  const loadRetellKnowledgeBase = async () => {
    try {
      setRetellLoading(true)
      const response = await fetch(`/api/companies/${companyId}/knowledge-base/retell`)
      
      if (response.ok) {
        const data = await response.json()
        setRetellItems(data.items || [])
      } else {
        console.warn('Failed to load Retell AI knowledge base:', await response.text())
        setRetellItems([])
      }
    } catch (error) {
      console.warn('Error loading Retell AI knowledge base:', error)
      setRetellItems([])
    } finally {
      setRetellLoading(false)
    }
  }


  const showMessage = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(message)
      setError(null)
      setTimeout(() => setSuccess(null), 5000)
    } else {
      setError(message)
      setSuccess(null)
      setTimeout(() => setError(null), 5000)
    }
  }

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const addUrl = async () => {
    if (!newUrl.trim()) return
    
    if (!validateUrl(newUrl)) {
      showMessage('Please enter a valid URL', 'error')
      return
    }

    if (retellItems.filter(item => item.type === 'url').length >= 500) {
      showMessage('URL limit reached. Maximum 500 URLs allowed per knowledge base.', 'error')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/companies/${companyId}/knowledge-base`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'url',
          name: new URL(newUrl).hostname,
          content: newUrl
        })
      })

      if (response.ok) {
        setNewUrl('')
        await loadRetellKnowledgeBase()
        showMessage('URL added to Retell AI successfully', 'success')
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add URL')
      }
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to add URL', 'error')
    } finally {
      setSaving(false)
    }
  }

  const addText = async () => {
    if (!newText.name.trim() || !newText.content.trim()) return

    if (retellItems.filter(item => item.type === 'text').length >= 50) {
      showMessage('Text limit reached. Maximum 50 text snippets allowed per knowledge base.', 'error')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/companies/${companyId}/knowledge-base`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text',
          name: newText.name,
          content: newText.content,
          enabled: true
        })
      })

      if (response.ok) {
        setNewText({ name: '', content: '' })
        await loadRetellKnowledgeBase()
        showMessage('Text snippet added to Retell AI successfully', 'success')
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add text')
      }
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to add text', 'error')
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async (sourceId: string) => {
    if (!confirm('Are you sure you want to delete this item from Retell AI?')) return

    try {
      setDeleting(sourceId)
      const response = await fetch(`/api/companies/${companyId}/knowledge-base?sourceId=${sourceId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadRetellKnowledgeBase()
        showMessage('Item deleted from Retell AI successfully', 'success')
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete item')
      }
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to delete item', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const handleFileUpload = async (files: FileList) => {
    if (retellItems.filter(item => item.type === 'file').length >= 25) {
      showMessage('File limit reached. Maximum 25 files allowed per knowledge base.', 'error')
      return
    }

    const filesToUpload = Array.from(files).slice(0, 25 - retellItems.filter(item => item.type === 'file').length)
    setUploadingFiles(filesToUpload)

    try {
      setSaving(true)
      
      for (const file of filesToUpload) {
        // Create FormData for this file
        const formData = new FormData()
        formData.append('knowledge_base_files', file)

        const response = await fetch(`/api/companies/${companyId}/knowledge-base/upload`, {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || `Failed to upload ${file.name}`)
        }
      }

      setUploadingFiles([])
      await loadRetellKnowledgeBase()
      showMessage(`${filesToUpload.length} file(s) uploaded to Retell AI successfully`, 'success')
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to upload files', 'error')
    } finally {
      setSaving(false)
      setUploadingFiles([])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files)
    }
  }







  const filteredItems = retellItems.filter(item => {
    if (activeTab === 'urls') return item.type === 'url'
    if (activeTab === 'files') return item.type === 'file'
    if (activeTab === 'texts') return item.type === 'text'
    return false
  })
  
  // Group URLs by domain
  const groupedUrls = React.useMemo(() => {
    if (activeTab !== 'urls') return {}
    
    const groups: { [domain: string]: RetellKnowledgeBaseItem[] } = {}
    
    filteredItems.forEach(item => {
      try {
        const url = new URL(item.content)
        const domain = url.hostname.replace(/^www\./, '') // Remove www prefix for grouping
        if (!groups[domain]) {
          groups[domain] = []
        }
        groups[domain].push(item)
      } catch {
        // Invalid URL, create a fallback group
        if (!groups['invalid-urls']) {
          groups['invalid-urls'] = []
        }
        groups['invalid-urls'].push(item)
      }
    })
    
    return groups
  }, [filteredItems, activeTab])
  
  const toggleDomain = (domain: string) => {
    const newExpanded = new Set(expandedDomains)
    if (newExpanded.has(domain)) {
      newExpanded.delete(domain)
    } else {
      newExpanded.add(domain)
    }
    setExpandedDomains(newExpanded)
  }

  if (loading || retellLoading) {
    return <div className={styles.loading}>Loading knowledge base...</div>
  }

  return (
    <div className={styles.knowledgeBase}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h3>Knowledge Base</h3>
          <p>Manage information that will be available to your AI agents during calls</p>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.liveStatus}>
            <CheckCircle size={16} />
            <span>Live sync enabled</span>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.message + ' ' + styles.error}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className={styles.message + ' ' + styles.success}>
          <CheckCircle size={16} />
          {success}
        </div>
      )}


      <div className={styles.stats}>
        <div className={styles.statItem}>
          <Link2 size={20} />
          <div>
            <span className={styles.statValue}>{retellItems.filter(item => item.type === 'url').length}</span>
            <span className={styles.statLabel}>URLs</span>
            <span className={styles.statLimit}>/ 500</span>
          </div>
        </div>
        <div className={styles.statItem}>
          <FileText size={20} />
          <div>
            <span className={styles.statValue}>{retellItems.filter(item => item.type === 'file').length}</span>
            <span className={styles.statLabel}>Files</span>
            <span className={styles.statLimit}>/ 25</span>
          </div>
        </div>
        <div className={styles.statItem}>
          <Type size={20} />
          <div>
            <span className={styles.statValue}>{retellItems.filter(item => item.type === 'text').length}</span>
            <span className={styles.statLabel}>Text Snippets</span>
            <span className={styles.statLimit}>/ 50</span>
          </div>
        </div>
        <div className={styles.statItem}>
          <CheckCircle size={20} />
          <div>
            <span className={styles.statValue}>{retellItems.length}</span>
            <span className={styles.statLabel}>Live in Retell AI</span>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'urls' ? styles.active : ''}`}
          onClick={() => setActiveTab('urls')}
        >
          <Link2 size={16} />
          URLs ({retellItems.filter(item => item.type === 'url').length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'files' ? styles.active : ''}`}
          onClick={() => setActiveTab('files')}
        >
          <FileText size={16} />
          Files ({retellItems.filter(item => item.type === 'file').length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'texts' ? styles.active : ''}`}
          onClick={() => setActiveTab('texts')}
        >
          <Type size={16} />
          Text ({retellItems.filter(item => item.type === 'text').length})
        </button>
      </div>

      <div className={styles.tabContent}>
        {/* URLs Tab */}
        {activeTab === 'urls' && (
          <div className={styles.tabPanel}>
            <div className={styles.addForm}>
              <div className={styles.inputGroup}>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com/page"
                  className={styles.input}
                  disabled={saving || retellItems.filter(item => item.type === 'url').length >= 500}
                />
                <button
                  onClick={addUrl}
                  disabled={saving || !newUrl.trim() || retellItems.filter(item => item.type === 'url').length >= 500}
                  className={styles.addButton}
                >
                  <Link2 size={16} />
                  Add URL
                </button>
              </div>
              
              
              {retellItems.filter(item => item.type === 'url').length >= 500 && (
                <div className={styles.limitWarning}>
                  <Info size={14} />
                  URL limit reached (500/500)
                </div>
              )}
            </div>

            <div className={styles.itemsList}>
              {activeTab === 'urls' ? (
                Object.entries(groupedUrls).map(([domain, items]) => (
                  <div key={domain} className={styles.domainGroup}>
                    <div 
                      className={styles.domainHeader}
                      onClick={() => toggleDomain(domain)}
                    >
                      <div className={styles.domainInfo}>
                        {expandedDomains.has(domain) ? (
                          <ChevronDown size={16} className={styles.chevron} />
                        ) : (
                          <ChevronRight size={16} className={styles.chevron} />
                        )}
                        <Link2 size={16} className={styles.domainIcon} />
                        <div>
                          <div className={styles.domainName}>
                            {domain === 'invalid-urls' ? 'Invalid URLs' : domain}
                          </div>
                          <div className={styles.domainCount}>
                            {items.length} page{items.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className={styles.domainActions}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm(`Delete all ${items.length} URLs from ${domain}?`)) {
                              items.forEach(item => deleteItem(item.source_id))
                            }
                          }}
                          className={styles.deleteAllButton}
                          title={`Delete all URLs from ${domain}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {expandedDomains.has(domain) && (
                      <div className={styles.domainItems}>
                        {items.map(item => (
                          <div key={item.id} className={styles.urlItem}>
                            <div className={styles.urlInfo}>
                              <div className={styles.urlPath}>
                                {item.content.replace(/^https?:\/\/[^/]+/, '') || '/'}
                              </div>
                            </div>
                            <div className={styles.urlActions}>
                              <button
                                onClick={() => deleteItem(item.source_id)}
                                disabled={deleting === item.source_id}
                                className={styles.deleteButton}
                                title="Delete this URL"
                              >
                                {deleting === item.source_id ? (
                                  <RefreshCw size={14} className={styles.spinning} />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                filteredItems.map(item => (
                  <div key={item.id} className={styles.item}>
                    <div className={styles.itemHeader}>
                      <div className={styles.itemInfo}>
                        <Type size={16} className={styles.itemIcon} />
                        <div>
                          <div className={styles.itemName}>{item.name}</div>
                          <div className={styles.itemContent}>
                            {item.content.length > 200 
                              ? item.content.substring(0, 200) + '...' 
                              : item.content
                            }
                          </div>
                        </div>
                      </div>
                      <div className={styles.itemActions}>
                        <button
                          onClick={() => deleteItem(item.source_id)}
                          disabled={deleting === item.source_id}
                          className={styles.deleteButton}
                          title="Delete from Retell AI"
                        >
                          {deleting === item.source_id ? (
                            <RefreshCw size={16} className={styles.spinning} />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {filteredItems.length === 0 && (
                <div className={styles.emptyState}>
                  {activeTab === 'urls' ? <Link2 size={32} /> : <Type size={32} />}
                  <p>No {activeTab === 'urls' ? 'URLs' : 'text snippets'} added yet</p>
                  <span>Add {activeTab === 'urls' ? 'website URLs' : 'custom text content'} that your agents can reference</span>
                </div>
              )}
            </div>
          </div>
        )}


        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className={styles.tabPanel}>
            <div
              className={`${styles.dropZone} ${dragOver ? styles.dragOver : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={32} />
              <p>Drop files here or click to browse</p>
              <span>Supports: PDF, DOC, DOCX, TXT, CSV, MD, XLS, XLSX, EPUB, HTML, RTF, XML</span>
              <span>Max file size: 50MB, Max files: 25</span>
              
              {retellItems.filter(item => item.type === 'file').length >= 25 && (
                <div className={styles.limitWarning}>
                  <Info size={14} />
                  File limit reached (25/25)
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.csv,.md,.xls,.xlsx,.epub,.html,.rtf,.xml"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className={styles.hiddenInput}
              disabled={retellItems.filter(item => item.type === 'file').length >= 25}
            />

            {uploadingFiles.length > 0 && (
              <div className={styles.uploadProgress}>
                <RefreshCw size={16} className={styles.spinning} />
                Uploading {uploadingFiles.length} file(s)...
              </div>
            )}

            <div className={styles.itemsList}>
              {filteredItems.map(item => (
                <div key={item.id} className={styles.item}>
                  <div className={styles.itemHeader}>
                    <div className={styles.itemInfo}>
                      <FileText size={16} className={styles.itemIcon} />
                      <div>
                        <div className={styles.itemName}>{item.name}</div>
                        <div className={styles.itemContent}>
                          {activeTab === 'files' ? (
                            <span className={styles.fileType}>
                              {item.name.split('.').pop()?.toUpperCase() || 'FILE'}
                            </span>
                          ) : (
                            item.content
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={styles.itemActions}>
                      <button
                        onClick={() => deleteItem(item.source_id)}
                        disabled={deleting === item.source_id}
                        className={styles.deleteButton}
                        title="Delete from Retell AI"
                      >
                        {deleting === item.source_id ? (
                          <RefreshCw size={16} className={styles.spinning} />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredItems.length === 0 && (
                <div className={styles.emptyState}>
                  <FileText size={32} />
                  <p>No files uploaded yet</p>
                  <span>Upload documents that contain information for your agents</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Text Tab */}
        {activeTab === 'texts' && (
          <div className={styles.tabPanel}>
            <div className={styles.addForm}>
              <div className={styles.textForm}>
                <input
                  type="text"
                  value={newText.name}
                  onChange={(e) => setNewText(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Text snippet name"
                  className={styles.input}
                  disabled={saving || retellItems.filter(item => item.type === 'text').length >= 50}
                />
                <textarea
                  value={newText.content}
                  onChange={(e) => setNewText(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your text content here..."
                  className={styles.textarea}
                  rows={4}
                  disabled={saving || retellItems.filter(item => item.type === 'text').length >= 50}
                />
                <button
                  onClick={addText}
                  disabled={saving || !newText.name.trim() || !newText.content.trim() || retellItems.filter(item => item.type === 'text').length >= 50}
                  className={styles.addButton}
                >
                  <Type size={16} />
                  Add Text
                </button>
              </div>
              {retellItems.filter(item => item.type === 'text').length >= 50 && (
                <div className={styles.limitWarning}>
                  <Info size={14} />
                  Text limit reached (50/50)
                </div>
              )}
            </div>

            <div className={styles.itemsList}>
              {filteredItems.map(item => (
                <div key={item.id} className={styles.item}>
                  <div className={styles.itemHeader}>
                    <div className={styles.itemInfo}>
                      <Type size={16} className={styles.itemIcon} />
                      <div>
                        <div className={styles.itemName}>{item.name}</div>
                        <div className={styles.itemContent}>
                          {item.content.length > 200 
                            ? item.content.substring(0, 200) + '...' 
                            : item.content
                          }
                        </div>
                      </div>
                    </div>
                    <div className={styles.itemActions}>
                      <button
                        onClick={() => deleteItem(item.source_id)}
                        disabled={deleting === item.source_id}
                        className={styles.deleteButton}
                        title="Delete from Retell AI"
                      >
                        {deleting === item.source_id ? (
                          <RefreshCw size={16} className={styles.spinning} />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredItems.length === 0 && (
                <div className={styles.emptyState}>
                  <Type size={32} />
                  <p>No text snippets added yet</p>
                  <span>Add custom text content that your agents can reference</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}