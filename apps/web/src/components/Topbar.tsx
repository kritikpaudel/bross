export function Topbar() {
    return (
        <header className="topbar">
            <div>
                <p className="eyebrow">Workspace</p>
                <h1>My Work</h1>
            </div>

            <div className="topbar-actions">
                <button className="search-button">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="11" cy="11" r="6.5" />
                        <path d="m16 16 4 4" />
                    </svg>

                    <span>Search</span>
                    <kbd>Ctrl K</kbd>
                </button>

                <button className="primary-button">New task</button>
            </div>
        </header>
    )
}