import type {
    PlatformUser,
} from '../lib/api'

interface PlatformAdminPageProps {
    user: PlatformUser
    onLogout: () => void
}

export function PlatformAdminPage({
    user,
    onLogout,
}: PlatformAdminPageProps) {
    return (
        <main className="platform-screen">
            <header className="platform-header">
                <div className="platform-brand">
                    <img
                        src="/branding/product/white-short.png"
                        alt=""
                    />

                    <div>
                        <strong>
                            Platform Administration
                        </strong>

                        <span>
                            Platform Administration
                        </span>
                    </div>
                </div>

                <div className="platform-account">
                    <div>
                        <strong>
                            {user.fullName}
                        </strong>

                        <span>
                            {user.email}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={
                            onLogout
                        }
                    >
                        Sign out
                    </button>
                </div>
            </header>

            <section className="platform-content">
                <div className="platform-heading">
                    <p>
                        Platform
                    </p>

                    <h1>
                        Organizations
                    </h1>

                    <span>
                        Manage organizations and
                        their administrative access.
                    </span>
                </div>

                <section className="platform-empty">
                    <strong>
                        Organization management
                    </strong>

                    <p>
                        Organization administration
                        will be configured here.
                    </p>
                </section>
            </section>
        </main>
    )
}