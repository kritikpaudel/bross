import {
  useEffect,
  useState,
} from 'react'

import type {
  ReactNode,
} from 'react'

import {
  InstallPrompt,
} from './components/InstallPrompt'

import {
  Sidebar,
} from './components/Sidebar'

import type {
  AppView,
} from './components/Sidebar'

import {
  Topbar,
} from './components/Topbar'

import {
  getCurrentUser,
  getSetupStatus,
  logout,
} from './lib/api'

import type {
  AuthUser,
} from './lib/api'

import {
  LoginPage,
} from './pages/LoginPage'

import {
  MyWorkPage,
} from './pages/MyWorkPage'

import {
  OrganizationStructurePage,
} from './pages/OrganizationStructurePage'

import {
  SetupPage,
} from './pages/SetupPage'

type AppState =
  | 'loading'
  | 'setup-required'
  | 'login-required'
  | 'authenticated'
  | 'error'

function App() {
  const [
    appState,
    setAppState,
  ] = useState<AppState>(
    'loading',
  )

  const [
    user,
    setUser,
  ] = useState<AuthUser | null>(
    null,
  )

  const [
    activeView,
    setActiveView,
  ] = useState<AppView>(
    'my-work',
  )

  async function initializeApp() {
    setAppState('loading')

    try {
      const setup =
        await getSetupStatus()

      if (!setup.configured) {
        setUser(null)

        setAppState(
          'setup-required',
        )

        return
      }

      const currentUser =
        await getCurrentUser()

      if (!currentUser) {
        setUser(null)

        setAppState(
          'login-required',
        )

        return
      }

      setUser(
        currentUser,
      )

      setAppState(
        'authenticated',
      )
    } catch {
      setUser(null)

      setAppState(
        'error',
      )
    }
  }

  async function handleLogout() {
    try {
      await logout()
    } finally {
      setUser(null)

      setActiveView(
        'my-work',
      )

      setAppState(
        'login-required',
      )
    }
  }

  useEffect(() => {
    void initializeApp()
  }, [])

  if (
    appState === 'loading'
  ) {
    return (
      <main className="app-loading">
        <img
          src="/branding/bross-logo.jpg"
          alt="Bross Solutions"
        />

        <span>
          Loading…
        </span>
      </main>
    )
  }

  if (
    appState === 'error'
  ) {
    return (
      <main className="app-loading">
        <strong>
          Unable to connect
        </strong>

        <span>
          Check that the Bross API
          is running.
        </span>

        <button
          type="button"
          className="setup-primary"
          onClick={() =>
            void initializeApp()
          }
        >
          Retry
        </button>
      </main>
    )
  }

  if (
    appState ===
    'setup-required'
  ) {
    return (
      <SetupPage
        onComplete={() =>
          void initializeApp()
        }
      />
    )
  }

  if (
    appState ===
    'login-required'
  ) {
    return (
      <LoginPage
        onAuthenticated={(
          authenticatedUser,
        ) => {
          setUser(
            authenticatedUser,
          )

          setAppState(
            'authenticated',
          )
        }}
      />
    )
  }

  if (!user) {
    return null
  }

  let page:
    ReactNode

  if (
    activeView ===
    'people-structure'
  ) {
    page = (
      <OrganizationStructurePage />
    )
  } else {
    page = (
      <MyWorkPage />
    )
  }

  return (
    <>
      <div className="app">
        <Sidebar
          user={user}
          activeView={
            activeView
          }
          onNavigate={
            setActiveView
          }
          onLogout={() =>
            void handleLogout()
          }
        />

        <main className="workspace">
          <Topbar />

          {page}
        </main>
      </div>

      <InstallPrompt />
    </>
  )
}

export default App