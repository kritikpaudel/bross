import {
    useState,
} from 'react'

import type {
    SyntheticEvent,
} from 'react'

import {
    login,
} from '../lib/api'

import type {
    AuthUser,
} from '../lib/api'

interface LoginPageProps {
    onAuthenticated:
    (user: AuthUser) => void
}

export function LoginPage({
    onAuthenticated,
}: LoginPageProps) {
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

    async function handleSubmit(
        event: SyntheticEvent<
            HTMLFormElement,
            SubmitEvent
        >,
    ) {
        event.preventDefault()

        setError(null)
        setSubmitting(true)

        try {
            const result =
                await login(
                    email,
                    password,
                )

            onAuthenticated(
                result.user,
            )
        } catch (loginError) {
            setError(
                loginError instanceof Error
                    ? loginError.message
                    : 'Unable to sign in.',
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
                        src="/branding/bross-logo.jpg"
                        alt="Bross Solutions"
                    />

                    <div>
                        <strong>
                            Bross Solutions
                        </strong>

                        <span>
                            Work OS
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
                        Use your Bross Work OS
                        account to continue.
                    </p>
                </div>

                <form
                    className="login-form"
                    onSubmit={handleSubmit}
                >
                    <label className="login-field">
                        <span>
                            Email
                        </span>

                        <input
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(
                                    event.target.value,
                                )
                            }
                            autoComplete="email"
                            required
                            maxLength={254}
                            autoFocus
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
                                setPassword(
                                    event.target.value,
                                )
                            }
                            autoComplete="current-password"
                            required
                            maxLength={128}
                        />
                    </label>

                    {error && (
                        <div
                            className="login-error"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-primary"
                        disabled={submitting}
                    >
                        {submitting
                            ? 'Signing in…'
                            : 'Sign in'}
                    </button>
                </form>
            </section>
        </main>
    )
}