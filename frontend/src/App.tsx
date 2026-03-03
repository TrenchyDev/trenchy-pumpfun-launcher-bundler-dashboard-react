import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'
import Layout from './components/layout/Layout'
import Launch from './pages/Launch'
import Wallets from './pages/Wallets'
import Trading from './pages/Trading'
import Settings from './pages/Settings'
import Setup, { SESSION_KEY, FUNDING_KEY, getOrCreateSessionId } from './pages/Setup'
import Login from './pages/Login'

const AUTH_TOKEN_KEY = 'trencher_auth_token'
const isDeployed = import.meta.env.PROD

axios.interceptors.request.use(config => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (!isDeployed) {
    const sessionId = localStorage.getItem(SESSION_KEY) || getOrCreateSessionId()
    config.headers['X-Session-Id'] = sessionId
  }
  return config
})

axios.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && err.config?.url?.includes('/api/')) {
      const msg = err.response?.data?.error || ''
      if (msg.includes('Funding wallet not configured')) {
        localStorage.removeItem(FUNDING_KEY)
        window.location.href = '/'
      }
      if (msg.includes('Login required') || msg.includes('Invalid or expired token')) {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        if (isDeployed) window.location.href = '/'
      }
    }
    return Promise.reject(err)
  },
)

export default function App() {
  const [ready, setReady] = useState<boolean | null>(null)
  const [authed, setAuthed] = useState<boolean | null>(isDeployed ? null : true)

  useEffect(() => {
    if (isDeployed) {
      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      setAuthed(!!token)
    }
  }, [])

  useEffect(() => {
    if (isDeployed && !authed) return

    const fundingKey = localStorage.getItem(FUNDING_KEY)
    if (fundingKey) {
      setReady(true)
      return
    }
    const headers: Record<string, string> = {}
    if (!isDeployed) {
      headers['X-Session-Id'] = localStorage.getItem(SESSION_KEY) || getOrCreateSessionId()
    }
    axios.get('/api/funding/status', { headers })
      .then(r => {
        setReady(r.data?.configured === true)
      })
      .catch(() => setReady(false))
  }, [authed])

  function handleAuth(token: string, _user: { id: number; username: string }) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
    setAuthed(true)
  }

  function handleReady() {
    setReady(true)
  }

  function handleClearSession() {
    localStorage.removeItem(FUNDING_KEY)
    setReady(false)
    if (isDeployed) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      setAuthed(false)
    }
    window.location.href = '/'
  }

  if (isDeployed && authed === null) return null
  if (isDeployed && !authed) {
    return <Login onAuth={handleAuth} />
  }
  if (ready === null) return null
  if (!ready) {
    return <Setup onReady={handleReady} />
  }

  return (
    <Routes>
      <Route element={<Layout onClearSession={handleClearSession} />}>
        <Route path="/" element={<Navigate to="/launch" replace />} />
        <Route path="/launch" element={<Launch />} />
        <Route path="/wallets" element={<Wallets />} />
        <Route path="/trading" element={<Trading />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
