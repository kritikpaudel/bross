export function MyWorkPage() {
    return (
        <section className="content">
            <div className="content-header">
                <div>
                    <h2>My Work</h2>
                    <p>Your assigned work will appear here.</p>
                </div>

                <div className="view-switcher">
                    <button className="selected">Today</button>
                    <button>Upcoming</button>
                    <button>All</button>
                </div>
            </div>

            <div className="work-grid">
                <section className="work-section">
                    <div className="section-title">
                        <h3>Today</h3>
                        <span>0</span>
                    </div>

                    <div className="empty-state">
                        <strong>No tasks yet</strong>
                        <p>Tasks assigned to you will appear here.</p>
                    </div>
                </section>

                <aside className="summary-panel">
                    <div className="summary-header">
                        <h3>Workload</h3>
                    </div>

                    <div className="workload">
                        <div className="workload-value">
                            <strong>0</strong>
                            <span>active tasks</span>
                        </div>

                        <div className="progress-track">
                            <div
                                className="progress-value"
                                style={{ width: '0%' }}
                            />
                        </div>

                        <div className="workload-meta">
                            <span>Capacity</span>
                            <strong>0%</strong>
                        </div>
                    </div>

                    <div className="summary-divider" />

                    <div className="summary-item">
                        <span>Due today</span>
                        <strong>0</strong>
                    </div>

                    <div className="summary-item">
                        <span>Blocked</span>
                        <strong>0</strong>
                    </div>

                    <div className="summary-item">
                        <span>Waiting</span>
                        <strong>0</strong>
                    </div>
                </aside>
            </div>
        </section>
    )
}