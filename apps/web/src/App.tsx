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

type AuthRealm =
  | 'organization'
  | 'platform'

const AUTH_REALM_STORAGE_KEY =
  'app-auth-realm'

function getStoredAuthRealm():
  AuthRealm | null {
  const value =
    sessionStorage.getItem(
      AUTH_REALM_STORAGE_KEY,
    )

  if (
    value ===
    'organization' ||
    value ===
    'platform'
  ) {
    return value
  }

  return null
}

function storeAuthRealm(
  realm: AuthRealm,
) {
  sessionStorage.setItem(
    AUTH_REALM_STORAGE_KEY,
    realm,
  )
}

function clearStoredAuthRealm() {
  sessionStorage.removeItem(
    AUTH_REALM_STORAGE_KEY,
  )
}

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

    const storedRealm =
      getStoredAuthRealm()

    /*
     * No authentication marker exists for this
     * browser tab/window.
     *
     * Do not automatically restore an old cookie
     * session. Show the login screen instead.
     */
    if (!storedRealm) {
      setUser(null)
      setPlatformUser(null)

      setAppState(
        'login-required',
      )

      return
    }

    try {
      if (
        storedRealm ===
        'platform'
      ) {
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

        clearStoredAuthRealm()

        setPlatformUser(null)
        setUser(null)

        setAppState(
          'login-required',
        )

        return
      }

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

      clearStoredAuthRealm()

      setUser(null)
      setPlatformUser(null)

      setAppState(
        'login-required',
      )
    } catch {
      setUser(null)
      setPlatformUser(null)

      setAppState(
        'error',
      )
    }
  }

  async function handleOrganizationLogout() {
    try {
      await logout()
    } finally {
      clearStoredAuthRealm()

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
      clearStoredAuthRealm()

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
          storeAuthRealm(
            'organization',
          )

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
          storeAuthRealm(
            'platform',
          )

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