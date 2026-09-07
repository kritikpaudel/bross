import {
    useEffect,
    useRef,
} from 'react'

interface ConfirmDialogProps {
    open: boolean

    title: string
    message: string

    confirmLabel?: string
    cancelLabel?: string

    tone?:
    | 'default'
    | 'danger'

    loading?: boolean

    onConfirm: () => void
    onCancel: () => void
}

export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    tone = 'default',
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const cancelButtonRef =
        useRef<HTMLButtonElement | null>(
            null,
        )

    useEffect(() => {
        if (!open) {
            return
        }

        cancelButtonRef.current?.focus()

        function handleKeyDown(
            event: KeyboardEvent,
        ) {
            if (
                event.key ===
                'Escape' &&
                !loading
            ) {
                onCancel()
            }
        }

        window.addEventListener(
            'keydown',
            handleKeyDown,
        )

        return () => {
            window.removeEventListener(
                'keydown',
                handleKeyDown,
            )
        }
    }, [
        open,
        loading,
        onCancel,
    ])

    if (!open) {
        return null
    }

    return (
        <div
            className="confirm-dialog-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget &&
                    !loading
                ) {
                    onCancel()
                }
            }}
        >
            <section
                className="confirm-dialog"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-message"
            >
                <header className="confirm-dialog-header">
                    <div
                        className={`confirm-dialog-icon confirm-dialog-icon-${tone}`}
                        aria-hidden="true"
                    >
                        {tone ===
                            'danger' ? (
                            <svg
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 8v5M12 16.5v.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        ) : (
                            <svg
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 7.5v5M12 16v.01M4.2 18.5h15.6a1.2 1.2 0 0 0 1.04-1.8L13.04 3.2a1.2 1.2 0 0 0-2.08 0L3.16 16.7a1.2 1.2 0 0 0 1.04 1.8Z" />
                            </svg>
                        )}
                    </div>

                    <div>
                        <h2
                            id="confirm-dialog-title"
                        >
                            {title}
                        </h2>

                        <p
                            id="confirm-dialog-message"
                        >
                            {message}
                        </p>
                    </div>
                </header>

                <footer className="confirm-dialog-actions">
                    <button
                        ref={
                            cancelButtonRef
                        }
                        type="button"
                        className="confirm-dialog-cancel"
                        disabled={
                            loading
                        }
                        onClick={
                            onCancel
                        }
                    >
                        {cancelLabel}
                    </button>

                    <button
                        type="button"
                        className={
                            tone ===
                                'danger'
                                ? 'confirm-dialog-confirm danger'
                                : 'confirm-dialog-confirm'
                        }
                        disabled={
                            loading
                        }
                        onClick={
                            onConfirm
                        }
                    >
                        {loading
                            ? 'Please wait…'
                            : confirmLabel}
                    </button>
                </footer>
            </section>
        </div>
    )
}