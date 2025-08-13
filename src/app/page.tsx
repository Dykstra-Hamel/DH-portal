import styles from './styles/page.module.scss';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* <Image
          className={styles.logo}
          src="/icon-192x192.png"
          alt="DH Portal logo"
          width={150}
          height={150}
          priority
        /> */}

        <h1>DYKSTRA|HAMEL</h1>
        <h2>Welcome to PCOCENTRAL</h2>

        <div
          style={{
            display: 'flex',
            gap: '2rem',
            marginTop: '2rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              padding: '2rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              textAlign: 'center',
              minWidth: '200px',
              backgroundColor: '#f9fafb',
            }}
          >
            <h2>Login</h2>
            <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
              Access your existing account
            </p>
            <Link
              href="/login"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.375rem',
                fontWeight: '500',
              }}
            >
              Login
            </Link>
          </div>

          <div
            style={{
              padding: '2rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              textAlign: 'center',
              minWidth: '200px',
              backgroundColor: '#f9fafb',
            }}
          >
            <h2>Sign Up</h2>
            <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
              Get in touch with us
            </p>
            <Link
              href="/sign-up"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#10b981',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.375rem',
                fontWeight: '500',
              }}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
