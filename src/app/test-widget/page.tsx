'use client'

import { useEffect, useState } from 'react'

export default function TestWidgetPage() {
  const [companyId, setCompanyId] = useState('')

  useEffect(() => {
    // You can hardcode your company ID here for testing
    // setCompanyId('your-company-id-here')
  }, [])

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Widget Test Page</h1>
      
      <div style={{ margin: '2rem 0', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', background: '#f9f9f9' }}>
        <h2>Company ID Setup</h2>
        <p>Enter your company ID to test the widget:</p>
        <input 
          type="text"
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          placeholder="Enter company ID"
          style={{ padding: '0.5rem', width: '300px', marginRight: '1rem' }}
        />
        <p style={{ fontSize: '0.9em', color: '#666' }}>
          You can find your company ID in the Settings page URL or database
        </p>
      </div>

      {companyId && (
        <div style={{ margin: '2rem 0', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h2>Test Widget</h2>
          <p>Fill out this form below to test auto-calling:</p>
          
          <div id="widget-container">
            <script 
              src={`${window.location.origin}/widget.js`}
              data-company-id={companyId}
              data-base-url={window.location.origin}
              data-header-text="Get Your Free Pest Control Quote"
              data-sub-header-text="Fill out this form to test the auto-call feature."
            />
          </div>
        </div>
      )}

      <div style={{ margin: '2rem 0', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', background: '#fff3cd' }}>
        <h2>Testing Checklist:</h2>
        <ul>
          <li>✅ Make sure auto-calling is enabled in Settings</li>
          <li>✅ Check that current time is within business hours</li>
          <li>✅ Ensure you have Retell.ai API configured</li>
          <li>✅ Monitor browser network tab for API calls</li>
          <li>✅ Check server logs for auto-call execution</li>
        </ul>
      </div>
    </div>
  )
}