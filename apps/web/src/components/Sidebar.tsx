export function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="brand">
                <img
                    src="/branding/bross-logo.jpg"
                    alt="Bross Solutions"
                    className="brand-logo"
                />

                <div className="brand-copy">
                    <strong>Bross Solutions</strong>
                    <span>Work OS</span>
                </div>
            </div>

            <nav
                className="navigation"
                aria-label="Main navigation"
            >
                <button
                    className="nav-item active"
                    type="button"
                >
                    <span className="nav-icon">
                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h4A1.5 1.5 0 0 1 11 5.5v4A1.5 1.5 0 0 1 9.5 11h-4A1.5 1.5 0 0 1 4 9.5v-4ZM13 5.5A1.5 1.5 0 0 1 14.5 4h4A1.5 1.5 0 0 1 20 5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 13 9.5v-4ZM4 14.5A1.5 1.5 0 0 1 5.5 13h4a1.5 1.5 0 0 1 1.5 1.5v4A1.5 1.5 0 0 1 9.5 20h-4A1.5 1.5 0 0 1 4 18.5v-4ZM13 14.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5v-4Z" />
                        </svg>
                    </span>

                    <span>My Work</span>
                </button>

                <button
                    className="nav-item"
                    type="button"
                >
                    <span className="nav-icon">
                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h3.2l1.7 2H17.5A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11Z" />
                        </svg>
                    </span>

                    <span>Projects</span>
                </button>

                <button
                    className="nav-item"
                    type="button"
                >
                    <span className="nav-icon">
                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.5 18.5A4.5 4.5 0 0 1 8 14h1a4.5 4.5 0 0 1 4.5 4.5V20h-10v-1.5ZM14 14.3a4.1 4.1 0 0 1 6.5 3.3V20h-5" />
                        </svg>
                    </span>

                    <span>People</span>
                </button>
            </nav>

            <div className="sidebar-footer">
                <button
                    className="profile-placeholder"
                    type="button"
                    aria-label="Open account"
                >
                    <span className="avatar account-avatar">
                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <circle
                                cx="12"
                                cy="8"
                                r="3.5"
                            />

                            <path d="M5 19a7 7 0 0 1 14 0" />
                        </svg>
                    </span>

                    <span className="profile-placeholder-copy">
                        <strong>Account</strong>
                        <span>Not signed in</span>
                    </span>

                    <span
                        className="profile-more"
                        aria-hidden="true"
                    >
                        <svg viewBox="0 0 24 24">
                            <circle
                                cx="5"
                                cy="12"
                                r="1.4"
                            />

                            <circle
                                cx="12"
                                cy="12"
                                r="1.4"
                            />

                            <circle
                                cx="19"
                                cy="12"
                                r="1.4"
                            />
                        </svg>
                    </span>
                </button>
            </div>
        </aside>
    )
}