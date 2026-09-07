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
  getCurrentPlatformUser,
  getCurrentUser,
  logout,
  platformLogout,
} from './lib/api'

import type {
  AuthUser,
  PlatformUser,
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
  PlatformAdminPage,
} from './pages/PlatformAdminPage'

type AppState =
  | 'loading'
  | 'login-required'
  | 'organization'
  | 'platform'
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
    platformUser,
    setPlatformUser,
  ] = useState<PlatformUser | null>(
    null,
  )

  const [
    activeView,
    setActiveView,
  ] = useState<AppView>(
    'my-work',
  )

  async function initializeApp() {
    setAppState(
      'loading',
    )

    try {
      const organizationUser =
        await getCurrentUser()

      if (organizationUser) {
        setUser(
          organizationUser,
        )

        setPlatformUser(
          null,
        )

        setAppState(
          'organization',
        )

        return
      }

      const currentPlatformUser =
        await getCurrentPlatformUser()

      if (
        currentPlatformUser
      ) {
        setPlatformUser(
          currentPlatformUser,
        )

        setUser(null)

        setAppState(
          'platform',
        )

        return
      }

      setUser(null)

      setPlatformUser(
        null,
      )

      setAppState(
        'login-required',
      )
    } catch {
      setUser(null)

      setPlatformUser(
        null,
      )

      setAppState(
        'error',
      )
    }
  }

  async function handleOrganizationLogout() {
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

  async function handlePlatformLogout() {
    try {
      await platformLogout()
    } finally {
      setPlatformUser(
        null,
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
    appState ===
    'loading'
  ) {
    return (
      <main className="app-loading">
        <img
          src="/branding/product/white-short.png"
          alt=""
        />

        <span>
          Loading…
        </span>
      </main>
    )
  }

  if (
    appState ===
    'error'
  ) {
    return (
      <main className="app-loading">
        <strong>
          Unable to connect
        </strong>

        <span>
          Check that the API
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
    'login-required'
  ) {
    return (
      <LoginPage
        onOrganizationAuthenticated={(
          authenticatedUser,
        ) => {
          setUser(
            authenticatedUser,
          )

          setPlatformUser(
            null,
          )

          setAppState(
            'organization',
          )
        }}

        onPlatformAuthenticated={(
          authenticatedUser,
        ) => {
          setPlatformUser(
            authenticatedUser,
          )

          setUser(null)

          setAppState(
            'platform',
          )
        }}
      />
    )
  }

  if (
    appState ===
    'platform' &&
    platformUser
  ) {
    return (
      <PlatformAdminPage
        user={
          platformUser
        }
        onLogout={() =>
          void handlePlatformLogout()
        }
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
            void handleOrganizationLogout()
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