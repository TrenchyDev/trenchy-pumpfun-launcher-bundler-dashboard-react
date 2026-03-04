import { Link } from 'react-router-dom'
import { RocketLaunchIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

const tools = [
  {
    id: 'trencher-bundler',
    name: 'Trencher Bundler',
    description: 'Launch tokens on Pump.fun with bundled buys, manage wallets, and trade from a single dashboard.',
    href: '/launch',
    icon: RocketLaunchIcon,
  },
]

export default function Dashboard() {
  return (
    <div className="fade-up">
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Your tools for launching and managing tokens on Solana.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 16,
      }}>
        {tools.map((tool) => (
          <Link
            key={tool.id}
            to={tool.href}
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(20, 184, 166, 0.4)'
              e.currentTarget.style.boxShadow = '0 0 24px rgba(20, 184, 166, 0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(37, 51, 70, 0.6)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(20, 184, 166, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <tool.icon style={{ width: 22, height: 22, color: '#14b8a6' }} />
              </div>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
              {tool.name}
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, marginBottom: 12, flex: 1 }}>
              {tool.description}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#14b8a6' }}>
              <span>Open tool</span>
              <ArrowRightIcon style={{ width: 14, height: 14 }} />
            </div>
          </Link>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24, padding: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>
          More tools coming soon
        </h2>
        <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
          We're building more utilities for your Solana workflow. Stay tuned.
        </p>
      </div>
    </div>
  )
}
