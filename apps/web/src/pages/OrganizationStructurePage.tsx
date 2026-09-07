import {
    useEffect,
    useState,
} from 'react'

import type {
    SyntheticEvent,
} from 'react'

import {
    createHierarchyLevel,
    getHierarchyLevels,
    reorderHierarchyLevels,
    updateHierarchyLevel,
} from '../lib/api'

import type {
    HierarchyLevel,
} from '../lib/api'

interface LevelEditorState {
    id: string
    name: string
    description: string
    isGovernance: boolean
}

export function OrganizationStructurePage() {
    const [
        levels,
        setLevels,
    ] = useState<HierarchyLevel[]>([])

    const [
        loading,
        setLoading,
    ] = useState(true)

    const [
        error,
        setError,
    ] = useState<string | null>(null)

    const [
        createOpen,
        setCreateOpen,
    ] = useState(false)

    const [
        createName,
        setCreateName,
    ] = useState('')

    const [
        createDescription,
        setCreateDescription,
    ] = useState('')

    const [
        createGovernance,
        setCreateGovernance,
    ] = useState(false)

    const [
        creating,
        setCreating,
    ] = useState(false)

    const [
        editing,
        setEditing,
    ] = useState<LevelEditorState | null>(
        null,
    )

    const [
        savingEdit,
        setSavingEdit,
    ] = useState(false)

    const [
        movingLevelId,
        setMovingLevelId,
    ] = useState<string | null>(null)

    async function loadLevels() {
        setLoading(true)
        setError(null)

        try {
            const result =
                await getHierarchyLevels()

            setLevels(
                result.levels,
            )
        } catch (loadError) {
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : 'Unable to load hierarchy levels.',
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadLevels()
    }, [])

    function resetCreateForm() {
        setCreateName('')
        setCreateDescription('')
        setCreateGovernance(false)
    }

    function closeCreateDialog() {
        if (creating) {
            return
        }

        setCreateOpen(false)

        resetCreateForm()
    }

    async function handleCreate(
        event: SyntheticEvent<
            HTMLFormElement,
            SubmitEvent
        >,
    ) {
        event.preventDefault()

        const name =
            createName.trim()

        if (!name) {
            return
        }

        setCreating(true)
        setError(null)

        try {
            const result =
                await createHierarchyLevel({
                    name,

                    description:
                        createDescription.trim() ||
                        null,

                    isGovernance:
                        createGovernance,
                })

            setLevels(
                (current) => [
                    ...current,
                    result.level,
                ],
            )

            resetCreateForm()

            setCreateOpen(false)
        } catch (createError) {
            setError(
                createError instanceof Error
                    ? createError.message
                    : 'Unable to create hierarchy level.',
            )
        } finally {
            setCreating(false)
        }
    }

    function openEditor(
        level: HierarchyLevel,
    ) {
        setEditing({
            id:
                level.id,

            name:
                level.name,

            description:
                level.description ??
                '',

            isGovernance:
                level.isGovernance,
        })
    }

    function closeEditor() {
        if (savingEdit) {
            return
        }

        setEditing(null)
    }

    async function handleEdit(
        event: SyntheticEvent<
            HTMLFormElement,
            SubmitEvent
        >,
    ) {
        event.preventDefault()

        if (!editing) {
            return
        }

        const name =
            editing.name.trim()

        if (!name) {
            return
        }

        setSavingEdit(true)
        setError(null)

        try {
            const result =
                await updateHierarchyLevel(
                    editing.id,
                    {
                        name,

                        description:
                            editing.description.trim() ||
                            null,

                        isGovernance:
                            editing.isGovernance,
                    },
                )

            setLevels(
                (current) =>
                    current.map(
                        (level) =>
                            level.id ===
                                result.level.id
                                ? result.level
                                : level,
                    ),
            )

            setEditing(null)
        } catch (editError) {
            setError(
                editError instanceof Error
                    ? editError.message
                    : 'Unable to update hierarchy level.',
            )
        } finally {
            setSavingEdit(false)
        }
    }

    async function toggleActive(
        level: HierarchyLevel,
    ) {
        setError(null)

        try {
            const result =
                await updateHierarchyLevel(
                    level.id,
                    {
                        isActive:
                            !level.isActive,
                    },
                )

            setLevels(
                (current) =>
                    current.map(
                        (item) =>
                            item.id ===
                                result.level.id
                                ? result.level
                                : item,
                    ),
            )
        } catch (toggleError) {
            setError(
                toggleError instanceof Error
                    ? toggleError.message
                    : 'Unable to update hierarchy level.',
            )
        }
    }

    async function moveLevel(
        levelId: string,
        direction: 'up' | 'down',
    ) {
        const currentIndex =
            levels.findIndex(
                (level) =>
                    level.id ===
                    levelId,
            )

        if (currentIndex === -1) {
            return
        }

        const targetIndex =
            direction === 'up'
                ? currentIndex - 1
                : currentIndex + 1

        if (
            targetIndex < 0 ||
            targetIndex >=
            levels.length
        ) {
            return
        }

        const reordered =
            [...levels]

        const currentLevel =
            reordered[currentIndex]

        const targetLevel =
            reordered[targetIndex]

        if (
            !currentLevel ||
            !targetLevel
        ) {
            return
        }

        reordered[currentIndex] =
            targetLevel

        reordered[targetIndex] =
            currentLevel

        setLevels(reordered)
        setMovingLevelId(levelId)
        setError(null)

        try {
            const result =
                await reorderHierarchyLevels(
                    reordered.map(
                        (level) =>
                            level.id,
                    ),
                )

            setLevels(
                result.levels,
            )
        } catch (moveError) {
            await loadLevels()

            setError(
                moveError instanceof Error
                    ? moveError.message
                    : 'Unable to reorder hierarchy levels.',
            )
        } finally {
            setMovingLevelId(null)
        }
    }

    return (
        <section className="structure-page">
            <header className="structure-page-header">
                <div>
                    <p className="structure-eyebrow">
                        People
                    </p>

                    <h2>
                        Organization structure
                    </h2>

                    <p>
                        Define authority levels for
                        your organization. The top
                        of the list represents the
                        highest organizational
                        authority.
                    </p>
                </div>

                <button
                    type="button"
                    className="structure-primary"
                    onClick={() =>
                        setCreateOpen(true)
                    }
                >
                    Add level
                </button>
            </header>

            {error && (
                <div
                    className="structure-error"
                    role="alert"
                >
                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setError(null)
                        }
                        aria-label="Dismiss error"
                    >
                        ×
                    </button>
                </div>
            )}

            <section className="structure-panel">
                <header className="structure-panel-header">
                    <div>
                        <h3>
                            Hierarchy levels
                        </h3>

                        <span>
                            {levels.length}
                        </span>
                    </div>

                    {levels.length > 0 && (
                        <p>
                            Top of the list has the
                            highest organizational
                            authority.
                        </p>
                    )}
                </header>

                {loading ? (
                    <div className="structure-loading">
                        Loading structure…
                    </div>
                ) : levels.length === 0 ? (
                    <div className="structure-empty">
                        <div className="structure-empty-icon">
                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path d="M12 4v5M7 20v-4h10v4M5 12h14M7 12v4M17 12v4" />

                                <circle
                                    cx="12"
                                    cy="4"
                                    r="2"
                                />

                                <circle
                                    cx="7"
                                    cy="20"
                                    r="2"
                                />

                                <circle
                                    cx="17"
                                    cy="20"
                                    r="2"
                                />
                            </svg>
                        </div>

                        <strong>
                            No hierarchy levels yet
                        </strong>

                        <p>
                            Create the real authority
                            structure used by your
                            organization.
                        </p>

                        <button
                            type="button"
                            className="structure-secondary"
                            onClick={() =>
                                setCreateOpen(true)
                            }
                        >
                            Create first level
                        </button>
                    </div>
                ) : (
                    <div className="hierarchy-list">
                        {levels.map(
                            (
                                level,
                                index,
                            ) => (
                                <article
                                    className={`hierarchy-row ${level.isActive
                                            ? ''
                                            : 'inactive'
                                        }`}
                                    key={level.id}
                                >
                                    <div className="hierarchy-position">
                                        <span>
                                            {String(
                                                index + 1,
                                            ).padStart(
                                                2,
                                                '0',
                                            )}
                                        </span>
                                    </div>

                                    <div className="hierarchy-main">
                                        <div className="hierarchy-title">
                                            <strong>
                                                {level.name}
                                            </strong>

                                            {level.isGovernance && (
                                                <span className="hierarchy-badge">
                                                    Governance
                                                </span>
                                            )}

                                            {!level.isActive && (
                                                <span className="hierarchy-badge muted">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>

                                        <p>
                                            {level.description ||
                                                'No description'}
                                        </p>
                                    </div>

                                    <div className="hierarchy-order">
                                        <button
                                            type="button"
                                            aria-label={`Move ${level.name} up`}
                                            title="Move up"
                                            disabled={
                                                index === 0 ||
                                                movingLevelId !==
                                                null
                                            }
                                            onClick={() =>
                                                void moveLevel(
                                                    level.id,
                                                    'up',
                                                )
                                            }
                                        >
                                            <svg
                                                viewBox="0 0 24 24"
                                                aria-hidden="true"
                                            >
                                                <path d="m7 14 5-5 5 5" />
                                            </svg>
                                        </button>

                                        <button
                                            type="button"
                                            aria-label={`Move ${level.name} down`}
                                            title="Move down"
                                            disabled={
                                                index ===
                                                levels.length -
                                                1 ||
                                                movingLevelId !==
                                                null
                                            }
                                            onClick={() =>
                                                void moveLevel(
                                                    level.id,
                                                    'down',
                                                )
                                            }
                                        >
                                            <svg
                                                viewBox="0 0 24 24"
                                                aria-hidden="true"
                                            >
                                                <path d="m7 10 5 5 5-5" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="hierarchy-actions">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openEditor(
                                                    level,
                                                )
                                            }
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            className={
                                                level.isActive
                                                    ? 'hierarchy-deactivate'
                                                    : ''
                                            }
                                            onClick={() =>
                                                void toggleActive(
                                                    level,
                                                )
                                            }
                                        >
                                            {level.isActive
                                                ? 'Deactivate'
                                                : 'Activate'}
                                        </button>
                                    </div>
                                </article>
                            ),
                        )}
                    </div>
                )}
            </section>

            {createOpen && (
                <div
                    className="structure-dialog-backdrop"
                    role="presentation"
                    onMouseDown={(
                        event,
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeCreateDialog()
                        }
                    }}
                >
                    <section
                        className="structure-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="create-level-title"
                    >
                        <header>
                            <div>
                                <p>
                                    Organization structure
                                </p>

                                <h3 id="create-level-title">
                                    Add hierarchy level
                                </h3>
                            </div>

                            <button
                                type="button"
                                className="structure-dialog-close"
                                onClick={
                                    closeCreateDialog
                                }
                                aria-label="Close"
                                disabled={
                                    creating
                                }
                            >
                                ×
                            </button>
                        </header>

                        <form
                            onSubmit={
                                handleCreate
                            }
                        >
                            <label className="structure-field">
                                <span>
                                    Level name
                                </span>

                                <input
                                    type="text"
                                    value={
                                        createName
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setCreateName(
                                            event.target
                                                .value,
                                        )
                                    }
                                    autoFocus
                                    required
                                    minLength={2}
                                    maxLength={120}
                                />
                            </label>

                            <label className="structure-field">
                                <span>
                                    Description
                                </span>

                                <textarea
                                    value={
                                        createDescription
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setCreateDescription(
                                            event.target
                                                .value,
                                        )
                                    }
                                    rows={4}
                                    maxLength={1000}
                                />
                            </label>

                            <label className="structure-check">
                                <input
                                    type="checkbox"
                                    checked={
                                        createGovernance
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setCreateGovernance(
                                            event.target
                                                .checked,
                                        )
                                    }
                                />

                                <span>
                                    <strong>
                                        Governance level
                                    </strong>

                                    <small>
                                        Intended for board or
                                        governance-oriented
                                        authority.
                                    </small>
                                </span>
                            </label>

                            <footer>
                                <button
                                    type="button"
                                    className="structure-secondary"
                                    onClick={
                                        closeCreateDialog
                                    }
                                    disabled={
                                        creating
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="structure-primary"
                                    disabled={
                                        creating
                                    }
                                >
                                    {creating
                                        ? 'Creating…'
                                        : 'Add level'}
                                </button>
                            </footer>
                        </form>
                    </section>
                </div>
            )}

            {editing && (
                <div
                    className="structure-dialog-backdrop"
                    role="presentation"
                    onMouseDown={(
                        event,
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeEditor()
                        }
                    }}
                >
                    <section
                        className="structure-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="edit-level-title"
                    >
                        <header>
                            <div>
                                <p>
                                    Organization structure
                                </p>

                                <h3 id="edit-level-title">
                                    Edit hierarchy level
                                </h3>
                            </div>

                            <button
                                type="button"
                                className="structure-dialog-close"
                                onClick={
                                    closeEditor
                                }
                                aria-label="Close"
                                disabled={
                                    savingEdit
                                }
                            >
                                ×
                            </button>
                        </header>

                        <form
                            onSubmit={
                                handleEdit
                            }
                        >
                            <label className="structure-field">
                                <span>
                                    Level name
                                </span>

                                <input
                                    type="text"
                                    value={
                                        editing.name
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setEditing({
                                            ...editing,

                                            name:
                                                event.target
                                                    .value,
                                        })
                                    }
                                    autoFocus
                                    required
                                    minLength={2}
                                    maxLength={120}
                                />
                            </label>

                            <label className="structure-field">
                                <span>
                                    Description
                                </span>

                                <textarea
                                    value={
                                        editing.description
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setEditing({
                                            ...editing,

                                            description:
                                                event.target
                                                    .value,
                                        })
                                    }
                                    rows={4}
                                    maxLength={1000}
                                />
                            </label>

                            <label className="structure-check">
                                <input
                                    type="checkbox"
                                    checked={
                                        editing.isGovernance
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setEditing({
                                            ...editing,

                                            isGovernance:
                                                event.target
                                                    .checked,
                                        })
                                    }
                                />

                                <span>
                                    <strong>
                                        Governance level
                                    </strong>

                                    <small>
                                        Mark this level as
                                        governance-oriented.
                                    </small>
                                </span>
                            </label>

                            <footer>
                                <button
                                    type="button"
                                    className="structure-secondary"
                                    onClick={
                                        closeEditor
                                    }
                                    disabled={
                                        savingEdit
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="structure-primary"
                                    disabled={
                                        savingEdit
                                    }
                                >
                                    {savingEdit
                                        ? 'Saving…'
                                        : 'Save changes'}
                                </button>
                            </footer>
                        </form>
                    </section>
                </div>
            )}
        </section>
    )
}