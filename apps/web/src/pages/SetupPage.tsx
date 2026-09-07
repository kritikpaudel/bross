import {
    useMemo,
    useState,
} from 'react'

import type {
    SyntheticEvent,
} from 'react'

import {
    createInitialSetup,
} from '../lib/api'

interface SetupPageProps {
    onComplete: () => void
}

function createSlug(
    value: string,
) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

export function SetupPage({
    onComplete,
}: SetupPageProps) {
    const detectedTimezone =
        useMemo(
            () =>
                Intl.DateTimeFormat()
                    .resolvedOptions()
                    .timeZone,
            [],
        )

    const [
        organizationName,
        setOrganizationName,
    ] = useState('')

    const [
        organizationSlug,
        setOrganizationSlug,
    ] = useState('')

    const [
        slugEdited,
        setSlugEdited,
    ] = useState(false)

    const [
        timezone,
        setTimezone,
    ] = useState(
        detectedTimezone || '',
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
        confirmPassword,
        setConfirmPassword,
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

    const [
        completed,
        setCompleted,
    ] = useState(false)

    function handleOrganizationNameChange(
        value: string,
    ) {
        setOrganizationName(value)

        if (!slugEdited) {
            setOrganizationSlug(
                createSlug(value),
            )
        }
    }

    function handleSlugChange(
        value: string,
    ) {
        setSlugEdited(true)

        setOrganizationSlug(
            createSlug(value),
        )
    }

    async function handleSubmit(
        event: SyntheticEvent<
            HTMLFormElement,
            SubmitEvent
        >,
    ) {
        event.preventDefault()

        setError(null)

        if (
            password !==
            confirmPassword
        ) {
            setError(
                'Passwords do not match.',
            )

            return
        }

        if (
            password.length < 12
        ) {
            setError(
                'Password must be at least 12 characters.',
            )

            return
        }

        if (
            organizationSlug.length < 2
        ) {
            setError(
                'Workspace address must be at least 2 characters.',
            )

            return
        }

        setSubmitting(true)

        try {
            await createInitialSetup({
                organizationName,
                organizationSlug,
                timezone,
                email,
                password,
            })

            setCompleted(true)
        } catch (setupError) {
            setError(
                setupError instanceof Error
                    ? setupError.message
                    : 'Setup failed.',
            )
        } finally {
            setSubmitting(false)
        }
    }

    if (completed) {
        return (
            <main className="setup-screen">
                <section className="setup-complete">
                    <img
                        src="/branding/bross-logo.jpg"
                        alt="Bross Solutions"
                        className="setup-complete-logo"
                    />

                    <h1>
                        Bross Work OS is ready
                    </h1>

                    <p>
                        Your organization and first
                        administrator account were
                        created successfully.
                    </p>

                    <button
                        type="button"
                        className="setup-primary"
                        onClick={onComplete}
                    >
                        Continue
                    </button>
                </section>
            </main>
        )
    }

    return (
        <main className="setup-screen">
            <section className="setup-layout">
                <header className="setup-brand">
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

                <div className="setup-heading">
                    <p className="setup-kicker">
                        Initial setup
                    </p>

                    <h1>
                        Set up your workspace
                    </h1>

                    <p>
                        Create your organization and
                        first administrator account.
                    </p>
                </div>

                <form
                    className="setup-form"
                    onSubmit={handleSubmit}
                >
                    <fieldset>
                        <legend>
                            Organization
                        </legend>

                        <label className="setup-field">
                            <span>
                                Organization name
                            </span>

                            <input
                                type="text"
                                value={organizationName}
                                onChange={(event) =>
                                    handleOrganizationNameChange(
                                        event.target.value,
                                    )
                                }
                                autoComplete="organization"
                                required
                                maxLength={160}
                            />
                        </label>

                        <label className="setup-field">
                            <span>
                                Workspace address
                            </span>

                            <div className="setup-slug">
                                <span>
                                    /
                                </span>

                                <input
                                    type="text"
                                    value={organizationSlug}
                                    onChange={(event) =>
                                        handleSlugChange(
                                            event.target.value,
                                        )
                                    }
                                    required
                                    minLength={2}
                                    maxLength={80}
                                    spellCheck={false}
                                />
                            </div>

                            <small>
                                Lowercase letters, numbers
                                and hyphens only.
                            </small>
                        </label>

                        <label className="setup-field">
                            <span>
                                Timezone
                            </span>

                            <input
                                type="text"
                                value={timezone}
                                onChange={(event) =>
                                    setTimezone(
                                        event.target.value,
                                    )
                                }
                                required
                                maxLength={80}
                                spellCheck={false}
                            />

                            <small>
                                Detected automatically from
                                your device. You can change
                                it.
                            </small>
                        </label>
                    </fieldset>

                    <fieldset>
                        <legend>
                            Administrator
                        </legend>

                        <label className="setup-field">
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
                            />
                        </label>

                        <label className="setup-field">
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
                                autoComplete="new-password"
                                required
                                minLength={12}
                                maxLength={128}
                            />

                            <small>
                                Minimum 12 characters.
                            </small>
                        </label>

                        <label className="setup-field">
                            <span>
                                Confirm password
                            </span>

                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(event) =>
                                    setConfirmPassword(
                                        event.target.value,
                                    )
                                }
                                autoComplete="new-password"
                                required
                                minLength={12}
                                maxLength={128}
                            />
                        </label>
                    </fieldset>

                    {error && (
                        <div
                            className="setup-error"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}

                    <div className="setup-submit">
                        <button
                            type="submit"
                            className="setup-primary"
                            disabled={submitting}
                        >
                            {submitting
                                ? 'Setting up…'
                                : 'Create workspace'}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    )
}