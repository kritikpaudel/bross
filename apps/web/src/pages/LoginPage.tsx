import {
    useState,
} from 'react'

import type {
    SyntheticEvent,
} from 'react'

import {
    login,
    platformLogin,
} from '../lib/api'

import type {
    AuthUser,
    PlatformUser,
} from '../lib/api'

export type LoginMode =
    | 'organization'
    | 'platform'

interface LoginPageProps {
    onOrganizationAuthenticated:
    (user: AuthUser) => void

    onPlatformAuthenticated:
    (user: PlatformUser) => void
}

export function LoginPage({
    onOrganizationAuthenticated,
    onPlatformAuthenticated,
}: LoginPageProps) {
    const [
        mode,
        setMode,
    ] = useState<LoginMode>(
        'organization',
    )

    const [
        email,
        setEmail,
    ] = useState('')

    const [
        password,
        setPassword,
    ] = useState('')

    const [
        submitting,
        setSubmitting,
    ] = useState(false)

    const [
        error,
        setError,
    ] = useState<string | null>(
        null,
    )

    function changeMode(
        nextMode: LoginMode,
    ) {
        setMode(nextMode)

        setPassword('')
        setError(null)
    }

    function handleEmailChange(
        value: string,
    ) {
        setEmail(value)

        if (error) {
            setError(null)
        }
    }

    function handlePasswordChange(
        value: string,
    ) {
        setPassword(value)

        if (error) {
            setError(null)
        }
    }

    async function handleSubmit(
        event: SyntheticEvent<
            HTMLFormElement,
            SubmitEvent
        >,
    ) {
        event.preventDefault()

        if (submitting) {
            return
        }

        setError(null)
        setSubmitting(true)

        try {
            if (
                mode ===
                'platform'
            ) {
                const result =
                    await platformLogin(
                        email,
                        password,
                    )

                onPlatformAuthenticated(
                    result.user,
                )

                return
            }

            const result =
                await login(
                    email,
                    password,
                )

            onOrganizationAuthenticated(
                result.user,
            )
        } catch (loginError) {
            setError(
                loginError instanceof Error
                    ? loginError.message
                    : 'Unable to sign in. Please try again.',
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <main className="login-screen">
            <section className="login-layout">
                <header className="login-brand">
                    <img
                        src="/branding/product/white-short.png"
                        alt=""
                    />

                    <div>
                        <strong>
                            Workspace
                        </strong>

                        <span>
                            Project Management System
                        </span>
                    </div>
                </header>

                <div className="login-heading">
                    <p className="login-kicker">
                        Welcome back
                    </p>

                    <h1>
                        Sign in
                    </h1>

                    <p>
                        {mode ===
                            'platform'
                            ? 'Platform administration access.'
                            : 'Use your organization account to continue.'}
                    </p>
                </div>

                <div
                    className="login-mode-switch"
                    aria-label="Account type"
                >
                    <button
                        type="button"
                        className={
                            mode ===
                                'organization'
                                ? 'active'
                                : ''
                        }
                        aria-pressed={
                            mode ===
                            'organization'
                        }
                        onClick={() =>
                            changeMode(
                                'organization',
                            )
                        }
                    >
                        Organization
                    </button>

                    <button
                        type="button"
                        className={
                            mode ===
                                'platform'
                                ? 'active'
                                : ''
                        }
                        aria-pressed={
                            mode ===
                            'platform'
                        }
                        onClick={() =>
                            changeMode(
                                'platform',
                            )
                        }
                    >
                        Platform administration
                    </button>
                </div>

                <form
                    className="login-form"
                    onSubmit={
                        handleSubmit
                    }
                >
                    <label className="login-field">
                        <span>
                            Email
                        </span>

                        <input
                            type="email"
                            value={email}
                            onChange={(event) =>
                                handleEmailChange(
                                    event.target.value,
                                )
                            }
                            autoComplete="email"
                            required
                            maxLength={254}
                            autoFocus
                            disabled={
                                submitting
                            }
                        />
                    </label>

                    <label className="login-field">
                        <span>
                            Password
                        </span>

                        <input
                            type="password"
                            value={password}
                            onChange={(event) =>
                                handlePasswordChange(
                                    event.target.value,
                                )
                            }
                            autoComplete="current-password"
                            required
                            maxLength={128}
                            disabled={
                                submitting
                            }
                        />
                    </label>

                    {error && (
                        <div
                            className="login-message login-message-error"
                            role="alert"
                            aria-live="assertive"
                        >
                            <span
                                className="login-message-icon"
                                aria-hidden="true"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 8v5M12 16.5v.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </span>

                            <span>
                                {error}
                            </span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-primary"
                        disabled={
                            submitting
                        }
                    >
                        {submitting
                            ? 'Signing in…'
                            : mode ===
                                'platform'
                                ? 'Sign in to platform'
                                : 'Sign in'}
                    </button>
                </form>
            </section>
        </main>
    )
}