'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, UserIdentity } from '@supabase/supabase-js'
import styles from './AccountLinking.module.scss'

interface AccountLinkingProps {
  user: User
}

export default function AccountLinking({ user }: AccountLinkingProps) {
  const [identities, setIdentities] = useState<UserIdentity[]>([])
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState<string | null>(null)

  useEffect(() => {
    if (user?.identities) {
      setIdentities(user.identities)
      setLoading(false)
    }
  }, [user])

  const linkProvider = async (provider: 'google' | 'facebook') => {
    setLinking(provider)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          // PKCE is used by default for linkIdentity
          queryParams: {
            // Add any additional query params if needed
            flow_type: 'pkce'
          }
        }
      })
      
      if (error) {
        console.error('Error linking account:', error)
        alert(`Error linking ${provider}: ${error.message}`)
      }
      // Note: The actual linking happens after redirect, so we don't update state here
    } catch (error) {
      console.error('Error linking account:', error)
      alert(`Error linking ${provider} account`)
    } finally {
      setLinking(null)
    }
  }

  const unlinkProvider = async (identity: UserIdentity) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.unlinkIdentity(identity)
      
      if (error) {
        console.error('Error unlinking account:', error)
        alert(`Error unlinking account: ${error.message}`)
      } else {
        // Refresh user data to update the UI
        const { data: { user: updatedUser } } = await supabase.auth.getUser()
        if (updatedUser?.identities) {
          setIdentities(updatedUser.identities)
        }
      }
    } catch (error) {
      console.error('Error unlinking account:', error)
      alert('Error unlinking account')
    }
  }

  const getProviderDisplayName = (provider: string) => {
    switch (provider) {
      case 'google': return 'Google'
      case 'facebook': return 'Facebook'
      case 'email': return 'Email'
      default: return provider.charAt(0).toUpperCase() + provider.slice(1)
    }
  }

  const isProviderLinked = (provider: string) => {
    return identities.some(identity => identity.provider === provider)
  }

  const canUnlink = (identity: UserIdentity) => {
    // Don't allow unlinking if it's the only identity
    return identities.length > 1
  }

  if (loading) {
    return <div>Loading linked accounts...</div>
  }

  return (
    <div className={styles.accountLinking}>
      <h3>Linked Accounts</h3>
      
      <div className={styles.linkedAccounts}>
        <h4>Currently Linked:</h4>
        {identities.length === 0 ? (
          <p>No accounts linked</p>
        ) : (
          <div className={styles.identityList}>
            {identities.map((identity) => (
              <div key={identity.id} className={styles.identityItem}>
                <div className={styles.identityInfo}>
                  <span className={styles.provider}>
                    {getProviderDisplayName(identity.provider)}
                  </span>
                  <span className={styles.email}>
                    {identity.identity_data?.email || 'No email'}
                  </span>
                </div>
                {canUnlink(identity) && identity.provider !== 'email' && (
                  <button
                    onClick={() => unlinkProvider(identity)}
                    className={styles.unlinkButton}
                  >
                    Unlink
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.availableProviders}>
        <h4>Link Additional Accounts:</h4>
        <div className={styles.providerButtons}>
          {!isProviderLinked('google') && (
            <button
              onClick={() => linkProvider('google')}
              disabled={linking === 'google'}
              className={styles.linkButton}
            >
              {linking === 'google' ? 'Linking...' : 'Link Google Account'}
            </button>
          )}
          
          {!isProviderLinked('facebook') && (
            <button
              onClick={() => linkProvider('facebook')}
              disabled={linking === 'facebook'}
              className={styles.linkButton}
            >
              {linking === 'facebook' ? 'Linking...' : 'Link Facebook Account'}
            </button>
          )}
        </div>
      </div>

      <div className={styles.info}>
        <p><strong>Note:</strong> Linking accounts allows you to sign in with any of your connected providers while maintaining the same profile and data.</p>
      </div>
    </div>
  )
}