import type {
    AuthUser,
} from '../lib/api'

export type AppView =
    | 'my-work'
    | 'projects'
    | 'people-structure'

interface SidebarProps {
    user: AuthUser
    activeView: AppView
    onNavigate:
    (view: AppView) => void
    onLogout: () => void
}

function getDisplayName(
    user: AuthUser,
) {
    return (
        user.employee?.name ??
        user.email
    )
}

function getRoleLabel(
    user: AuthUser,
) {
    if (
        user.roles.length === 0
    ) {
        return 'Account'
    }

    return user.roles
        .map(
            (role) =>
                role.name,
        )
        .join(', ')
}

function getInitial(
    user: AuthUser,
) {
    const displayName =
        getDisplayName(
            user,
        ).trim()

    return (
        displayName
            .charAt(0)
            .toUpperCase() ||
        'A'
    )
}

export function Sidebar({
    user,
    activeView,
    onNavigate,
    onLogout,
}: SidebarProps) {
    return (
        <aside className="sidebar">
            <div className="brand">
                <img
                    src="/branding/organizations/bross/logo.jpg"
                    alt=""
                    className="brand-logo"
                />

                <div className="brand-copy">
                    <strong>
                        Workspace
                    </strong>

                    <span>
                        Project Management System
                    </span>
                </div>
            </div>

            <nav
                className="navigation"
                aria-label="Main navigation"
            >
                <button
                    className={`nav-item ${activeView ===
                        'my-work'
                        ? 'active'
                        : ''
                        }`}
                    type="button"
                    onClick={() =>
                        onNavigate(
                            'my-work',
                        )
                    }
                >
                    <span className="nav-icon">
                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h4A1.5 1.5 0 0 1 11 5.5v4A1.5 1.5 0 0 1 9.5 11h-4A1.5 1.5 0 0 1 4 9.5v-4ZM13 5.5A1.5 1.5 0 0 1 14.5 4h4A1.5 1.5 0 0 1 20 5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 13 9.5v-4ZM4 14.5A1.5 1.5 0 0 1 5.5 13h4a1.5 1.5 0 0 1 1.5 1.5v4A1.5 1.5 0 0 1 9.5 20h-4A1.5 1.5 0 0 1 4 18.5v-4ZM13 14.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5v-4Z" />
                        </svg>
                    </span>

                    <span>
                        My Work
                    </span>
                </button>

                <button
                    className={`nav-item ${activeView ===
                        'projects'
                        ? 'active'
                        : ''
                        }`}
                    type="button"
                    onClick={() =>
                        onNavigate(
                            'projects',
                        )
                    }
                >
                    <span className="nav-icon">
                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h3.2l1.7 2H17.5A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11Z" />
                        </svg>
                    </span>

                    <span>
                        Projects
                    </span>
                </button>

                <button
                    className={`nav-item ${activeView ===
                        'people-structure'
                        ? 'active'
                        : ''
                        }`}
                    type="button"
                    onClick={() =>
                        onNavigate(
                            'people-structure',
                        )
                    }
                >
                    <span className="nav-icon">
                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.5 18.5A4.5 4.5 0 0 1 8 14h1a4.5 4.5 0 0 1 4.5 4.5V20h-10v-1.5ZM14 14.3a4.1 4.1 0 0 1 6.5 3.3V20h-5" />
                        </svg>
                    </span>

                    <span>
                        People
                    </span>
                </button>
            </nav>

            <div className="sidebar-footer">
                <div className="profile-authenticated">
                    <div className="avatar account-initial">
                        {getInitial(
                            user,
                        )}
                    </div>

                    <div className="profile-placeholder-copy">
                        <strong>
                            {getDisplayName(
                                user,
                            )}
                        </strong>

                        <span>
                            {getRoleLabel(
                                user,
                            )}
                        </span>
                    </div>

                    <button
                        type="button"
                        className="profile-logout"
                        onClick={
                            onLogout
                        }
                        aria-label="Sign out"
                        title="Sign out"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10M14 8l4 4-4 4M9 12h9" />
                        </svg>
                    </button>
                </div>
            </div>
        </aside>
    )
}