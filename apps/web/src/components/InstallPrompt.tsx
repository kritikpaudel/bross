import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>

    userChoice: Promise<{
        outcome: 'accepted' | 'dismissed'
        platform: string
    }>
}

function isIOS() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function isStandalone() {
    const standaloneDisplay = window.matchMedia(
        '(display-mode: standalone)',
    ).matches

    const iosStandalone =
        'standalone' in window.navigator &&
        Boolean(
            (
                window.navigator as Navigator & {
                    standalone?: boolean
                }
            ).standalone,
        )

    return standaloneDisplay || iosStandalone
}

export function InstallPrompt() {
    const [installEvent, setInstallEvent] =
        useState<BeforeInstallPromptEvent | null>(null)

    const [visible, setVisible] = useState(false)
    const [showIOSHelp, setShowIOSHelp] = useState(false)

    useEffect(() => {
        if (isStandalone()) {
            return
        }

        const dismissedThisSession =
            sessionStorage.getItem(
                'product-install-prompt-dismissed',
            ) === 'true'

        if (dismissedThisSession) {
            return
        }

        const handleBeforeInstallPrompt = (
            event: Event,
        ) => {
            event.preventDefault()

            setInstallEvent(
                event as BeforeInstallPromptEvent,
            )

            window.setTimeout(() => {
                setVisible(true)
            }, 1200)
        }

        const handleInstalled = () => {
            setVisible(false)
            setInstallEvent(null)
        }

        window.addEventListener(
            'beforeinstallprompt',
            handleBeforeInstallPrompt,
        )

        window.addEventListener(
            'appinstalled',
            handleInstalled,
        )

        /*
         * iOS does not support beforeinstallprompt.
         * Show our own installation instructions instead.
         */
        if (isIOS()) {
            window.setTimeout(() => {
                setShowIOSHelp(true)
                setVisible(true)
            }, 1200)
        }

        return () => {
            window.removeEventListener(
                'beforeinstallprompt',
                handleBeforeInstallPrompt,
            )

            window.removeEventListener(
                'appinstalled',
                handleInstalled,
            )
        }
    }, [])

    async function handleInstall() {
        if (!installEvent) {
            return
        }

        await installEvent.prompt()

        const choice =
            await installEvent.userChoice

        if (choice.outcome === 'accepted') {
            setVisible(false)
            setInstallEvent(null)
        }
    }

    function handleDismiss() {
        sessionStorage.setItem(
            'product-install-prompt-dismissed',
            'true',
        )

        setVisible(false)
    }

    if (!visible) {
        return null
    }

    return (
        <aside
            className="install-prompt"
            aria-label="Install application"
        >
            <div className="install-prompt-logo">
                <img
                    src="/branding/product/white-short.png"
                    alt=""
                />
            </div>

            <div className="install-prompt-content">
                <strong>Install application</strong>

                {showIOSHelp ? (
                    <p>
                        Add this application to your Home Screen
                        for faster access.
                    </p>
                ) : (
                    <p>
                        Install the app for faster access and
                        a standalone experience.
                    </p>
                )}

                {showIOSHelp && (
                    <div className="ios-install-help">
                        <span>
                            Open the browser Share menu
                        </span>

                        <span className="ios-install-arrow">
                            →
                        </span>

                        <strong>
                            Add to Home Screen
                        </strong>
                    </div>
                )}

                <div className="install-prompt-actions">
                    <button
                        type="button"
                        className="install-prompt-later"
                        onClick={handleDismiss}
                    >
                        Not now
                    </button>

                    {!showIOSHelp && (
                        <button
                            type="button"
                            className="install-prompt-install"
                            onClick={handleInstall}
                        >
                            Install
                        </button>
                    )}
                </div>
            </div>

            <button
                type="button"
                className="install-prompt-close"
                aria-label="Close install prompt"
                onClick={handleDismiss}
            >
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path d="M6 6l12 12M18 6 6 18" />
                </svg>
            </button>
        </aside>
    )
}