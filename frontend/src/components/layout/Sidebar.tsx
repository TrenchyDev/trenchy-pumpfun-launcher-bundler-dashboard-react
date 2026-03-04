import { NavLink } from 'react-router-dom'
import {
  Squares2X2Icon,
  RocketLaunchIcon,
  ChartBarIcon,
  WalletIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'

const tools = [
  { to: '/', label: 'Dashboard', Icon: Squares2X2Icon },
  { to: '/launch', label: 'Launch', Icon: RocketLaunchIcon },
  { to: '/trading', label: 'Trading', Icon: ChartBarIcon },
  { to: '/wallets', label: 'Wallets', Icon: WalletIcon },
]

interface SidebarProps {
  collapsed: boolean
  onCollapsedChange: (v: boolean) => void
  envWarning?: boolean
  onClearSession?: () => void
}

export default function Sidebar({ collapsed, onCollapsedChange, envWarning = false, onClearSession }: SidebarProps) {

  return (
    <aside
      className="sidebar"
      style={{ width: collapsed ? 64 : 220, transition: 'width 0.2s ease' }}
    >
      <a
        href="https://trenchytools.lol"
        target="_blank"
        rel="noopener noreferrer"
        className="sidebar-logo"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 12 : '20px 18px',
        }}
      >
        <img
          src="/image/trenchy_toolz_wide_transparent.png"
          alt="Trencher"
          style={{
            height: collapsed ? 28 : 36,
            width: 'auto',
            objectFit: 'contain',
          }}
        />
      </a>

      <nav style={{ flex: 1, padding: collapsed ? '8px 0' : '12px 0', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tools.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              style={{
                justifyContent: collapsed ? 'center' : undefined,
                padding: collapsed ? '10px' : undefined,
              }}
              title={collapsed ? link.label : undefined}
            >
              <link.Icon style={{ width: 18, height: 18, flexShrink: 0 }} />
              {!collapsed && link.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div style={{ padding: collapsed ? 8 : '12px 18px', borderTop: '1px solid rgba(37,51,70,0.5)' }}>
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          style={{
            justifyContent: collapsed ? 'center' : undefined,
            padding: collapsed ? '10px' : undefined,
            marginBottom: 8,
          }}
          title={collapsed ? 'Settings' : undefined}
        >
          <Cog6ToothIcon style={{ width: 18, height: 18, flexShrink: 0 }} />
          {!collapsed && (
            <>
              Settings
              {envWarning && (
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#ef4444',
                    marginLeft: 'auto',
                    flexShrink: 0,
                    boxShadow: '0 0 8px rgba(239,68,68,0.5)',
                  }}
                />
              )}
            </>
          )}
        </NavLink>
        {onClearSession && (
          <button
            onClick={onClearSession}
            title="Clear session"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? 0 : 8,
              justifyContent: collapsed ? 'center' : undefined,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: collapsed ? '10px' : '6px 0',
              width: '100%',
              fontSize: 12,
              color: '#64748b',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
          >
            <ArrowRightStartOnRectangleIcon style={{ width: 16, height: 16 }} />
            {!collapsed && 'Clear session'}
          </button>
        )}
        <button
          onClick={() => onCollapsedChange(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? 0 : 8,
            justifyContent: collapsed ? 'center' : undefined,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 0',
            width: '100%',
            marginTop: 8,
            fontSize: 12,
            color: '#64748b',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
        >
          {collapsed ? (
            <ChevronRightIcon style={{ width: 18, height: 18 }} />
          ) : (
            <>
              <ChevronLeftIcon style={{ width: 18, height: 18 }} />
              Collapse
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
