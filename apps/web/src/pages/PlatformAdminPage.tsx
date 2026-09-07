import {
    useEffect,
    useState,
} from 'react'

import type {
    SyntheticEvent,
} from 'react'

import {
    ConfirmDialog,
} from '../components/ConfirmDialog'

import {
    archivePlatformOrganization,
    archivePlatformUser,
    createPlatformOrganization,
    createPlatformOrganizationUser,
    getPlatformOrganizations,
    getPlatformOrganizationUsers,
    restorePlatformUser,
    setPlatformUserPassword,
    updatePlatformOrganization,
    updatePlatformOrganizationStatus,
    updatePlatformUser,
    updatePlatformUserStatus,
} from '../lib/api'

import type {
    PlatformOrganization,
    PlatformOrganizationUser,
    PlatformUser,
} from '../lib/api'

interface PlatformAdminPageProps {
    user: PlatformUser
    onLogout: () => void
}

type OrganizationFormMode =
    | 'create'
    | 'edit'

type UserDialogMode =
    | 'create'
    | 'edit'
    | 'password'

interface OrganizationFormState {
    name: string
    slug: string
    timezone: string
    logoUrl: string
}

interface UserFormState {
    email: string
    employeeId: string
    password: string
}

type ConfirmAction =
    | {
        type:
        'organization-status'

        organization:
        PlatformOrganization

        status:
        | 'active'
        | 'suspended'
    }
    | {
        type:
        'archive-organization'

        organization:
        PlatformOrganization
    }
    | {
        type:
        'user-status'

        account:
        PlatformOrganizationUser

        status:
        | 'active'
        | 'disabled'
    }
    | {
        type:
        'archive-user'

        account:
        PlatformOrganizationUser
    }
    | {
        type:
        'restore-user'

        account:
        PlatformOrganizationUser
    }

function getDefaultTimezone() {
    return (
        Intl.DateTimeFormat()
            .resolvedOptions()
            .timeZone ||
        'UTC'
    )
}

function createEmptyOrganizationForm():
    OrganizationFormState {
    return {
        name: '',
        slug: '',
        timezone:
            getDefaultTimezone(),
        logoUrl: '',
    }
}

function createEmptyUserForm():
    UserFormState {
    return {
        email: '',
        employeeId: '',
        password: '',
    }
}

function formatDate(
    value: string | null,
) {
    if (!value) {
        return 'Never'
    }

    return new Intl.DateTimeFormat(
        undefined,
        {
            dateStyle: 'medium',
            timeStyle: 'short',
        },
    ).format(
        new Date(value),
    )
}

function getAccountName(
    account:
        PlatformOrganizationUser,
) {
    return (
        account.employeeName ??
        account.email
    )
}

function getOrganizationInitial(
    organization:
        PlatformOrganization,
) {
    return (
        organization.name
            .trim()
            .charAt(0)
            .toUpperCase() ||
        'O'
    )
}

function getConfirmationContent(
    action: ConfirmAction,
) {
    if (
        action.type ===
        'archive-organization'
    ) {
        return {
            title:
                'Delete organization?',

            message:
                `${action.organization.name} will be archived. Its historical data will be preserved.`,

            confirmLabel:
                'Delete organization',

            tone:
                'danger' as const,
        }
    }

    if (
        action.type ===
        'organization-status'
    ) {
        if (
            action.status ===
            'suspended'
        ) {
            return {
                title:
                    'Suspend organization?',

                message:
                    `Users in ${action.organization.name} will immediately lose access until the organization is restored.`,

                confirmLabel:
                    'Suspend organization',

                tone:
                    'danger' as const,
            }
        }

        return {
            title:
                'Restore organization?',

            message:
                `${action.organization.name} will become active and its users may sign in again.`,

            confirmLabel:
                'Restore organization',

            tone:
                'default' as const,
        }
    }

    if (
        action.type ===
        'archive-user'
    ) {
        return {
            title:
                'Delete user account?',

            message:
                `${action.account.email} will lose access immediately. The login account will be archived while employee and historical records remain preserved.`,

            confirmLabel:
                'Delete account',

            tone:
                'danger' as const,
        }
    }

    if (
        action.type ===
        'restore-user'
    ) {
        return {
            title:
                'Restore user account?',

            message:
                `${action.account.email} will be restored with access disabled. You can enable access separately after reviewing the account.`,

            confirmLabel:
                'Restore account',

            tone:
                'default' as const,
        }
    }

    if (
        action.status ===
        'disabled'
    ) {
        return {
            title:
                'Disable account?',

            message:
                `${action.account.email} will immediately lose access and all active sessions will be revoked.`,

            confirmLabel:
                'Disable access',

            tone:
                'danger' as const,
        }
    }

    if (
        action.account.accountStatus ===
        'locked'
    ) {
        return {
            title:
                'Unlock account?',

            message:
                `${action.account.email} will be unlocked and allowed to sign in again.`,

            confirmLabel:
                'Unlock account',

            tone:
                'default' as const,
        }
    }

    return {
        title:
            'Enable account?',

        message:
            `${action.account.email} will be allowed to sign in again.`,

        confirmLabel:
            'Enable access',

        tone:
            'default' as const,
    }
}

export function PlatformAdminPage({
    user,
    onLogout,
}: PlatformAdminPageProps) {
    const [
        organizations,
        setOrganizations,
    ] = useState<
        PlatformOrganization[]
    >([])

    const [
        selectedOrganization,
        setSelectedOrganization,
    ] = useState<
        PlatformOrganization | null
    >(null)

    const [
        organizationUsers,
        setOrganizationUsers,
    ] = useState<
        PlatformOrganizationUser[]
    >([])

    const [
        organizationsLoading,
        setOrganizationsLoading,
    ] = useState(true)

    const [
        usersLoading,
        setUsersLoading,
    ] = useState(false)

    const [
        changingUserId,
        setChangingUserId,
    ] = useState<
        string | null
    >(null)

    const [
        userActionLoading,
        setUserActionLoading,
    ] = useState(false)

    const [
        organizationActionLoading,
        setOrganizationActionLoading,
    ] = useState(false)

    const [
        formMode,
        setFormMode,
    ] = useState<
        OrganizationFormMode | null
    >(null)

    const [
        organizationForm,
        setOrganizationForm,
    ] = useState<
        OrganizationFormState
    >(
        createEmptyOrganizationForm(),
    )

    const [
        userDialogMode,
        setUserDialogMode,
    ] = useState<
        UserDialogMode | null
    >(null)

    const [
        userDialogAccount,
        setUserDialogAccount,
    ] = useState<
        PlatformOrganizationUser | null
    >(null)

    const [
        userForm,
        setUserForm,
    ] = useState<
        UserFormState
    >(
        createEmptyUserForm(),
    )

    const [
        confirmAction,
        setConfirmAction,
    ] = useState<
        ConfirmAction | null
    >(null)

    const [
        error,
        setError,
    ] = useState<
        string | null
    >(null)

    const [
        success,
        setSuccess,
    ] = useState<
        string | null
    >(null)

    function clearMessages() {
        setError(null)
        setSuccess(null)
    }

    function showError(
        message: string,
    ) {
        setSuccess(null)
        setError(message)
    }

    function showSuccess(
        message: string,
    ) {
        setError(null)
        setSuccess(message)
    }

    async function loadOrganizations(
        preferredOrganizationId?: string,
    ) {
        setOrganizationsLoading(
            true,
        )

        try {
            const response =
                await getPlatformOrganizations()

            setOrganizations(
                response.organizations,
            )

            if (
                response.organizations
                    .length === 0
            ) {
                setSelectedOrganization(
                    null,
                )

                return
            }

            const targetId =
                preferredOrganizationId ??
                selectedOrganization?.id

            const nextSelected =
                targetId
                    ? response.organizations.find(
                        (
                            organization,
                        ) =>
                            organization.id ===
                            targetId,
                    )
                    : null

            setSelectedOrganization(
                nextSelected ??
                response.organizations[0],
            )
        } catch (loadError) {
            showError(
                loadError instanceof Error
                    ? loadError.message
                    : 'Unable to load organizations.',
            )
        } finally {
            setOrganizationsLoading(
                false,
            )
        }
    }

    async function loadOrganizationUsers(
        organizationId: string,
    ) {
        setUsersLoading(true)

        try {
            const response =
                await getPlatformOrganizationUsers(
                    organizationId,
                )

            setOrganizationUsers(
                response.users,
            )
        } catch (loadError) {
            setOrganizationUsers([])

            showError(
                loadError instanceof Error
                    ? loadError.message
                    : 'Unable to load organization accounts.',
            )
        } finally {
            setUsersLoading(false)
        }
    }

    function openCreateOrganization() {
        clearMessages()

        setOrganizationForm(
            createEmptyOrganizationForm(),
        )

        setFormMode(
            'create',
        )
    }

    function openEditOrganization() {
        if (!selectedOrganization) {
            return
        }

        clearMessages()

        setOrganizationForm({
            name:
                selectedOrganization.name,

            slug:
                selectedOrganization.slug,

            timezone:
                selectedOrganization.timezone,

            logoUrl:
                selectedOrganization.logoUrl ??
                '',
        })

        setFormMode(
            'edit',
        )
    }

    function closeOrganizationForm() {
        if (
            organizationActionLoading
        ) {
            return
        }

        setFormMode(null)

        setOrganizationForm(
            createEmptyOrganizationForm(),
        )
    }

    async function handleOrganizationSubmit(
        event: SyntheticEvent<
            HTMLFormElement,
            SubmitEvent
        >,
    ) {
        event.preventDefault()

        if (
            organizationActionLoading
        ) {
            return
        }

        const name =
            organizationForm.name.trim()

        const slug =
            organizationForm.slug
                .trim()
                .toLowerCase()

        const timezone =
            organizationForm.timezone.trim()

        const logoUrl =
            organizationForm.logoUrl
                .trim()

        if (
            !name ||
            !slug ||
            !timezone
        ) {
            showError(
                'Name, slug, and timezone are required.',
            )

            return
        }

        setOrganizationActionLoading(
            true,
        )

        clearMessages()

        try {
            if (
                formMode ===
                'create'
            ) {
                const result =
                    await createPlatformOrganization(
                        {
                            name,
                            slug,
                            timezone,

                            logoUrl:
                                logoUrl ||
                                null,
                        },
                    )

                setFormMode(null)

                showSuccess(
                    result.message,
                )

                await loadOrganizations(
                    result.organization.id,
                )

                return
            }

            if (
                formMode ===
                'edit' &&
                selectedOrganization
            ) {
                const result =
                    await updatePlatformOrganization(
                        selectedOrganization.id,
                        {
                            name,
                            slug,
                            timezone,

                            logoUrl:
                                logoUrl ||
                                null,
                        },
                    )

                setFormMode(null)

                showSuccess(
                    result.message,
                )

                await loadOrganizations(
                    result.organization.id,
                )
            }
        } catch (submitError) {
            showError(
                submitError instanceof Error
                    ? submitError.message
                    : 'Unable to save organization.',
            )
        } finally {
            setOrganizationActionLoading(
                false,
            )
        }
    }

    function handleOrganizationStatus(
        status:
            | 'active'
            | 'suspended',
    ) {
        if (
            !selectedOrganization ||
            organizationActionLoading
        ) {
            return
        }

        setConfirmAction({
            type:
                'organization-status',

            organization:
                selectedOrganization,

            status,
        })
    }

    function handleArchiveOrganization() {
        if (
            !selectedOrganization ||
            organizationActionLoading
        ) {
            return
        }

        setConfirmAction({
            type:
                'archive-organization',

            organization:
                selectedOrganization,
        })
    }

    function resetUserDialog() {
        setUserDialogMode(null)
        setUserDialogAccount(null)

        setUserForm(
            createEmptyUserForm(),
        )
    }

    function closeUserDialog() {
        if (userActionLoading) {
            return
        }

        resetUserDialog()
    }

    function openCreateUser() {
        if (
            !selectedOrganization ||
            selectedOrganization.status ===
            'archived'
        ) {
            return
        }

        clearMessages()
        setUserDialogAccount(null)

        setUserForm(
            createEmptyUserForm(),
        )

        setUserDialogMode(
            'create',
        )
    }

    function openEditUser(
        account:
            PlatformOrganizationUser,
    ) {
        if (
            account.accountStatus ===
            'archived'
        ) {
            return
        }

        clearMessages()

        setUserDialogAccount(
            account,
        )

        setUserForm({
            email:
                account.email,

            employeeId:
                account.employeeId ??
                '',

            password:
                '',
        })

        setUserDialogMode(
            'edit',
        )
    }

    function openPasswordUser(
        account:
            PlatformOrganizationUser,
    ) {
        if (
            account.accountStatus ===
            'archived'
        ) {
            return
        }

        clearMessages()

        setUserDialogAccount(
            account,
        )

        setUserForm({
            email:
                account.email,

            employeeId:
                account.employeeId ??
                '',

            password:
                '',
        })

        setUserDialogMode(
            'password',
        )
    }

    async function handleUserSubmit(
        event: SyntheticEvent<
            HTMLFormElement,
            SubmitEvent
        >,
    ) {
        event.preventDefault()

        if (
            userActionLoading ||
            !userDialogMode
        ) {
            return
        }

        setUserActionLoading(
            true,
        )

        clearMessages()

        try {
            if (
                userDialogMode ===
                'create'
            ) {
                if (!selectedOrganization) {
                    throw new Error(
                        'Select an organization first.',
                    )
                }

                const email =
                    userForm.email.trim()

                const employeeId =
                    userForm.employeeId.trim()

                const password =
                    userForm.password

                if (!email) {
                    throw new Error(
                        'Email is required.',
                    )
                }

                const result =
                    await createPlatformOrganizationUser(
                        selectedOrganization.id,
                        {
                            email,

                            employeeId:
                                employeeId ||
                                null,

                            ...(password
                                ? {
                                    password,
                                }
                                : {}),
                        },
                    )

                resetUserDialog()

                showSuccess(
                    result.message,
                )

                await loadOrganizationUsers(
                    selectedOrganization.id,
                )

                return
            }

            if (!userDialogAccount) {
                throw new Error(
                    'User account is unavailable.',
                )
            }

            if (
                userDialogMode ===
                'edit'
            ) {
                const email =
                    userForm.email.trim()

                const employeeId =
                    userForm.employeeId.trim()

                if (!email) {
                    throw new Error(
                        'Email is required.',
                    )
                }

                const result =
                    await updatePlatformUser(
                        userDialogAccount.id,
                        {
                            email,

                            employeeId:
                                employeeId ||
                                null,
                        },
                    )

                resetUserDialog()

                showSuccess(
                    result.message,
                )

                if (
                    selectedOrganization
                ) {
                    await loadOrganizationUsers(
                        selectedOrganization.id,
                    )
                }

                return
            }

            const password =
                userForm.password

            if (!password) {
                throw new Error(
                    'Password is required.',
                )
            }

            const result =
                await setPlatformUserPassword(
                    userDialogAccount.id,
                    password,
                )

            resetUserDialog()

            showSuccess(
                result.message,
            )

            if (
                selectedOrganization
            ) {
                await loadOrganizationUsers(
                    selectedOrganization.id,
                )
            }
        } catch (submitError) {
            showError(
                submitError instanceof Error
                    ? submitError.message
                    : 'Unable to save user account.',
            )
        } finally {
            setUserActionLoading(
                false,
            )
        }
    }

    function handleAccountStatusChange(
        account:
            PlatformOrganizationUser,
    ) {
        if (
            account.accountStatus ===
            'active'
        ) {
            setConfirmAction({
                type:
                    'user-status',

                account,

                status:
                    'disabled',
            })

            return
        }

        if (
            account.accountStatus ===
            'disabled' ||
            account.accountStatus ===
            'locked'
        ) {
            setConfirmAction({
                type:
                    'user-status',

                account,

                status:
                    'active',
            })
        }
    }

    function handleArchiveUser(
        account:
            PlatformOrganizationUser,
    ) {
        if (
            account.accountStatus ===
            'archived'
        ) {
            return
        }

        setConfirmAction({
            type:
                'archive-user',

            account,
        })
    }

    function handleRestoreUser(
        account:
            PlatformOrganizationUser,
    ) {
        if (
            account.accountStatus !==
            'archived'
        ) {
            return
        }

        setConfirmAction({
            type:
                'restore-user',

            account,
        })
    }

    async function executeConfirmedAction() {
        if (!confirmAction) {
            return
        }

        if (
            confirmAction.type ===
            'organization-status'
        ) {
            setOrganizationActionLoading(
                true,
            )

            clearMessages()

            try {
                const result =
                    await updatePlatformOrganizationStatus(
                        confirmAction.organization.id,
                        confirmAction.status,
                    )

                showSuccess(
                    result.message,
                )

                await loadOrganizations(
                    result.organization.id,
                )
            } catch (actionError) {
                showError(
                    actionError instanceof Error
                        ? actionError.message
                        : 'Unable to update organization status.',
                )
            } finally {
                setOrganizationActionLoading(
                    false,
                )

                setConfirmAction(
                    null,
                )
            }

            return
        }

        if (
            confirmAction.type ===
            'archive-organization'
        ) {
            setOrganizationActionLoading(
                true,
            )

            clearMessages()

            try {
                const result =
                    await archivePlatformOrganization(
                        confirmAction.organization.id,
                    )

                showSuccess(
                    result.message,
                )

                await loadOrganizations(
                    result.organization.id,
                )
            } catch (actionError) {
                showError(
                    actionError instanceof Error
                        ? actionError.message
                        : 'Unable to delete organization.',
                )
            } finally {
                setOrganizationActionLoading(
                    false,
                )

                setConfirmAction(
                    null,
                )
            }

            return
        }

        const action =
            confirmAction

        setChangingUserId(
            action.account.id,
        )

        clearMessages()

        try {
            let message:
                string

            if (
                action.type ===
                'user-status'
            ) {
                const result =
                    await updatePlatformUserStatus(
                        action.account.id,
                        action.status,
                    )

                message =
                    result.message
            } else if (
                action.type ===
                'archive-user'
            ) {
                const result =
                    await archivePlatformUser(
                        action.account.id,
                    )

                message =
                    result.message
            } else {
                const result =
                    await restorePlatformUser(
                        action.account.id,
                    )

                message =
                    result.message
            }

            showSuccess(
                message,
            )

            if (
                selectedOrganization
            ) {
                await loadOrganizationUsers(
                    selectedOrganization.id,
                )
            }
        } catch (actionError) {
            showError(
                actionError instanceof Error
                    ? actionError.message
                    : 'Unable to update account.',
            )
        } finally {
            setChangingUserId(
                null,
            )

            setConfirmAction(
                null,
            )
        }
    }

    useEffect(() => {
        void loadOrganizations()
    }, [])

    useEffect(() => {
        setUserDialogMode(null)
        setUserDialogAccount(null)

        if (
            !selectedOrganization
        ) {
            setOrganizationUsers([])

            return
        }

        void loadOrganizationUsers(
            selectedOrganization.id,
        )
    }, [
        selectedOrganization,
    ])

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
                            Platform
                        </strong>

                        <span>
                            Administration
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
                <div className="platform-heading platform-heading-actions">
                    <div>
                        <p>
                            Platform
                        </p>

                        <h1>
                            Organizations
                        </h1>

                        <span>
                            Manage organizations
                            and their user access.
                        </span>
                    </div>

                    <button
                        type="button"
                        className="platform-primary-action"
                        onClick={
                            openCreateOrganization
                        }
                    >
                        Create organization
                    </button>
                </div>

                {success && (
                    <div
                        className="platform-message platform-message-success"
                        role="status"
                        aria-live="polite"
                    >
                        <span>
                            {success}
                        </span>

                        <button
                            type="button"
                            aria-label="Dismiss message"
                            onClick={() =>
                                setSuccess(
                                    null,
                                )
                            }
                        >
                            ×
                        </button>
                    </div>
                )}

                {error && (
                    <div
                        className="platform-message platform-message-error"
                        role="alert"
                    >
                        <span>
                            {error}
                        </span>

                        <button
                            type="button"
                            aria-label="Dismiss message"
                            onClick={() =>
                                setError(
                                    null,
                                )
                            }
                        >
                            ×
                        </button>
                    </div>
                )}

                <div className="platform-management">
                    <aside className="platform-organizations">
                        <div className="platform-section-heading">
                            <strong>
                                Organizations
                            </strong>

                            <span>
                                {
                                    organizations.length
                                }
                            </span>
                        </div>

                        {organizationsLoading ? (
                            <div className="platform-panel-state">
                                Loading organizations…
                            </div>
                        ) : organizations.length ===
                            0 ? (
                            <div className="platform-panel-state">
                                No organizations
                                exist yet.
                            </div>
                        ) : (
                            <div className="platform-organization-list">
                                {organizations.map(
                                    (
                                        organization,
                                    ) => {
                                        const isSelected =
                                            selectedOrganization
                                                ?.id ===
                                            organization.id

                                        return (
                                            <button
                                                key={
                                                    organization.id
                                                }
                                                type="button"
                                                className={`platform-organization-item ${isSelected
                                                    ? 'active'
                                                    : ''
                                                    }`}
                                                onClick={() => {
                                                    clearMessages()

                                                    setSelectedOrganization(
                                                        organization,
                                                    )
                                                }}
                                            >
                                                <div className="platform-organization-logo">
                                                    {organization.logoUrl ? (
                                                        <img
                                                            src={
                                                                organization.logoUrl
                                                            }
                                                            alt=""
                                                        />
                                                    ) : (
                                                        <span>
                                                            {getOrganizationInitial(
                                                                organization,
                                                            )}
                                                        </span>
                                                    )}
                                                </div>

                                                <div>
                                                    <strong>
                                                        {
                                                            organization.name
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            organization.slug
                                                        }
                                                    </span>
                                                </div>

                                                <span
                                                    className={`platform-organization-status platform-organization-status-${organization.status}`}
                                                >
                                                    {
                                                        organization.status
                                                    }
                                                </span>
                                            </button>
                                        )
                                    },
                                )}
                            </div>
                        )}
                    </aside>

                    <section className="platform-users">
                        {!selectedOrganization ? (
                            <div className="platform-panel-state">
                                Select an
                                organization.
                            </div>
                        ) : (
                            <>
                                <div className="platform-organization-toolbar">
                                    <div>
                                        <strong>
                                            {
                                                selectedOrganization.name
                                            }
                                        </strong>

                                        <span>
                                            {
                                                selectedOrganization.timezone
                                            }
                                            {' · '}
                                            {
                                                selectedOrganization.status
                                            }
                                        </span>
                                    </div>

                                    <div className="platform-organization-actions">
                                        <button
                                            type="button"
                                            onClick={
                                                openEditOrganization
                                            }
                                            disabled={
                                                selectedOrganization.status ===
                                                'archived'
                                            }
                                        >
                                            Edit
                                        </button>

                                        {selectedOrganization.status ===
                                            'active' && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleOrganizationStatus(
                                                            'suspended',
                                                        )
                                                    }
                                                    disabled={
                                                        organizationActionLoading
                                                    }
                                                >
                                                    Suspend
                                                </button>
                                            )}

                                        {(selectedOrganization.status ===
                                            'suspended' ||
                                            selectedOrganization.status ===
                                            'archived') && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleOrganizationStatus(
                                                            'active',
                                                        )
                                                    }
                                                    disabled={
                                                        organizationActionLoading
                                                    }
                                                >
                                                    Restore
                                                </button>
                                            )}

                                        {selectedOrganization.status !==
                                            'archived' && (
                                                <button
                                                    type="button"
                                                    className="platform-danger-action"
                                                    onClick={
                                                        handleArchiveOrganization
                                                    }
                                                    disabled={
                                                        organizationActionLoading
                                                    }
                                                >
                                                    Delete
                                                </button>
                                            )}
                                    </div>
                                </div>

                                <div className="platform-section-heading">
                                    <div>
                                        <strong>
                                            Accounts
                                        </strong>

                                        <span>
                                            Organization
                                            user access
                                        </span>
                                    </div>

                                    <div className="platform-organization-actions">
                                        {!usersLoading && (
                                            <span>
                                                {
                                                    organizationUsers.length
                                                }{' '}
                                                account
                                                {organizationUsers.length ===
                                                    1
                                                    ? ''
                                                    : 's'}
                                            </span>
                                        )}

                                        <button
                                            type="button"
                                            className="platform-primary-action"
                                            onClick={
                                                openCreateUser
                                            }
                                            disabled={
                                                selectedOrganization.status ===
                                                'archived'
                                            }
                                        >
                                            Create account
                                        </button>
                                    </div>
                                </div>

                                {usersLoading ? (
                                    <div className="platform-panel-state">
                                        Loading accounts…
                                    </div>
                                ) : organizationUsers.length ===
                                    0 ? (
                                    <div className="platform-panel-state">
                                        This organization
                                        has no user
                                        accounts.
                                    </div>
                                ) : (
                                    <div className="platform-user-list">
                                        {organizationUsers.map(
                                            (
                                                account,
                                            ) => {
                                                const isChanging =
                                                    changingUserId ===
                                                    account.id

                                                const isArchived =
                                                    account.accountStatus ===
                                                    'archived'

                                                return (
                                                    <article
                                                        key={
                                                            account.id
                                                        }
                                                        className="platform-user-row"
                                                    >
                                                        <div className="platform-user-avatar">
                                                            {getAccountName(
                                                                account,
                                                            )
                                                                .charAt(
                                                                    0,
                                                                )
                                                                .toUpperCase()}
                                                        </div>

                                                        <div className="platform-user-identity">
                                                            <strong>
                                                                {getAccountName(
                                                                    account,
                                                                )}
                                                            </strong>

                                                            <span>
                                                                {
                                                                    account.email
                                                                }
                                                            </span>
                                                        </div>

                                                        <div className="platform-user-meta">
                                                            <span>
                                                                Last login
                                                            </span>

                                                            <strong>
                                                                {formatDate(
                                                                    account.lastLoginAt,
                                                                )}
                                                            </strong>
                                                        </div>

                                                        <span
                                                            className={`platform-status platform-status-${account.accountStatus}`}
                                                        >
                                                            {
                                                                account.accountStatus
                                                            }
                                                        </span>

                                                        <div className="platform-organization-actions">
                                                            {isArchived ? (
                                                                <button
                                                                    type="button"
                                                                    className="platform-user-action"
                                                                    disabled={
                                                                        isChanging
                                                                    }
                                                                    onClick={() =>
                                                                        handleRestoreUser(
                                                                            account,
                                                                        )
                                                                    }
                                                                >
                                                                    {isChanging
                                                                        ? 'Restoring…'
                                                                        : 'Restore'}
                                                                </button>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        className="platform-user-action"
                                                                        disabled={
                                                                            isChanging
                                                                        }
                                                                        onClick={() =>
                                                                            openEditUser(
                                                                                account,
                                                                            )
                                                                        }
                                                                    >
                                                                        Edit
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className="platform-user-action"
                                                                        disabled={
                                                                            isChanging
                                                                        }
                                                                        onClick={() =>
                                                                            openPasswordUser(
                                                                                account,
                                                                            )
                                                                        }
                                                                    >
                                                                        {account.accountStatus ===
                                                                            'pending'
                                                                            ? 'Set password'
                                                                            : 'Reset password'}
                                                                    </button>

                                                                    {account.accountStatus ===
                                                                        'active' && (
                                                                            <button
                                                                                type="button"
                                                                                className="platform-user-action"
                                                                                disabled={
                                                                                    isChanging
                                                                                }
                                                                                onClick={() =>
                                                                                    handleAccountStatusChange(
                                                                                        account,
                                                                                    )
                                                                                }
                                                                            >
                                                                                {isChanging
                                                                                    ? 'Saving…'
                                                                                    : 'Disable'}
                                                                            </button>
                                                                        )}

                                                                    {account.accountStatus ===
                                                                        'disabled' && (
                                                                            <button
                                                                                type="button"
                                                                                className="platform-user-action"
                                                                                disabled={
                                                                                    isChanging
                                                                                }
                                                                                onClick={() =>
                                                                                    handleAccountStatusChange(
                                                                                        account,
                                                                                    )
                                                                                }
                                                                            >
                                                                                {isChanging
                                                                                    ? 'Saving…'
                                                                                    : 'Enable'}
                                                                            </button>
                                                                        )}

                                                                    {account.accountStatus ===
                                                                        'locked' && (
                                                                            <button
                                                                                type="button"
                                                                                className="platform-user-action"
                                                                                disabled={
                                                                                    isChanging
                                                                                }
                                                                                onClick={() =>
                                                                                    handleAccountStatusChange(
                                                                                        account,
                                                                                    )
                                                                                }
                                                                            >
                                                                                {isChanging
                                                                                    ? 'Saving…'
                                                                                    : 'Unlock'}
                                                                            </button>
                                                                        )}

                                                                    <button
                                                                        type="button"
                                                                        className="platform-user-action platform-danger-action"
                                                                        disabled={
                                                                            isChanging
                                                                        }
                                                                        onClick={() =>
                                                                            handleArchiveUser(
                                                                                account,
                                                                            )
                                                                        }
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </article>
                                                )
                                            },
                                        )}
                                    </div>
                                )}

                            </>
                        )}
                    </section>
                </div>
            </section>

            {formMode && (
                <div
                    className="platform-dialog-backdrop"
                    role="presentation"
                >
                    <section
                        className="platform-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="organization-dialog-title"
                    >
                        <header className="platform-dialog-header">
                            <div>
                                <p>
                                    Organization
                                </p>

                                <h2
                                    id="organization-dialog-title"
                                >
                                    {formMode ===
                                        'create'
                                        ? 'Create organization'
                                        : 'Edit organization'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                aria-label="Close"
                                onClick={
                                    closeOrganizationForm
                                }
                            >
                                ×
                            </button>
                        </header>

                        <form
                            className="platform-dialog-form"
                            onSubmit={
                                handleOrganizationSubmit
                            }
                        >
                            <label>
                                <span>
                                    Organization name
                                </span>

                                <input
                                    type="text"
                                    value={
                                        organizationForm.name
                                    }
                                    onChange={(event) =>
                                        setOrganizationForm(
                                            (
                                                current,
                                            ) => ({
                                                ...current,

                                                name:
                                                    event.target.value,
                                            }),
                                        )
                                    }
                                    required
                                    maxLength={160}
                                    autoFocus
                                />
                            </label>

                            <label>
                                <span>
                                    Slug
                                </span>

                                <input
                                    type="text"
                                    value={
                                        organizationForm.slug
                                    }
                                    onChange={(event) =>
                                        setOrganizationForm(
                                            (
                                                current,
                                            ) => ({
                                                ...current,

                                                slug:
                                                    event.target.value,
                                            }),
                                        )
                                    }
                                    required
                                    maxLength={80}
                                    placeholder="example-company"
                                />
                            </label>

                            <label>
                                <span>
                                    Timezone
                                </span>

                                <input
                                    type="text"
                                    value={
                                        organizationForm.timezone
                                    }
                                    onChange={(event) =>
                                        setOrganizationForm(
                                            (
                                                current,
                                            ) => ({
                                                ...current,

                                                timezone:
                                                    event.target.value,
                                            }),
                                        )
                                    }
                                    required
                                    maxLength={80}
                                    placeholder="Asia/Kathmandu"
                                />
                            </label>

                            <label>
                                <span>
                                    Logo URL
                                </span>

                                <input
                                    type="text"
                                    value={
                                        organizationForm.logoUrl
                                    }
                                    onChange={(event) =>
                                        setOrganizationForm(
                                            (
                                                current,
                                            ) => ({
                                                ...current,

                                                logoUrl:
                                                    event.target.value,
                                            }),
                                        )
                                    }
                                    maxLength={500}
                                    placeholder="/branding/organizations/company/logo.png"
                                />
                            </label>

                            <footer className="platform-dialog-actions">
                                <button
                                    type="button"
                                    onClick={
                                        closeOrganizationForm
                                    }
                                    disabled={
                                        organizationActionLoading
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="platform-primary-action"
                                    disabled={
                                        organizationActionLoading
                                    }
                                >
                                    {organizationActionLoading
                                        ? 'Saving…'
                                        : formMode ===
                                            'create'
                                            ? 'Create organization'
                                            : 'Save changes'}
                                </button>
                            </footer>
                        </form>
                    </section>
                </div>
            )}

            {userDialogMode && (
                <div
                    className="platform-dialog-backdrop"
                    role="presentation"
                >
                    <section
                        className="platform-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="user-dialog-title"
                    >
                        <header className="platform-dialog-header">
                            <div>
                                <p>
                                    User account
                                </p>

                                <h2
                                    id="user-dialog-title"
                                >
                                    {userDialogMode ===
                                        'create'
                                        ? 'Create account'
                                        : userDialogMode ===
                                            'edit'
                                            ? 'Edit account'
                                            : userDialogAccount?.accountStatus ===
                                                'pending'
                                                ? 'Set password'
                                                : 'Reset password'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                aria-label="Close"
                                onClick={
                                    closeUserDialog
                                }
                            >
                                ×
                            </button>
                        </header>

                        <form
                            className="platform-dialog-form"
                            onSubmit={
                                handleUserSubmit
                            }
                        >
                            {userDialogMode !==
                                'password' && (
                                    <>
                                        <label>
                                            <span>
                                                Email
                                            </span>

                                            <input
                                                type="email"
                                                value={
                                                    userForm.email
                                                }
                                                onChange={(event) =>
                                                    setUserForm(
                                                        (
                                                            current,
                                                        ) => ({
                                                            ...current,

                                                            email:
                                                                event.target.value,
                                                        }),
                                                    )
                                                }
                                                required
                                                maxLength={254}
                                                autoFocus
                                            />
                                        </label>

                                        <label>
                                            <span>
                                                Employee ID
                                                {' '}
                                                (optional)
                                            </span>

                                            <input
                                                type="text"
                                                value={
                                                    userForm.employeeId
                                                }
                                                onChange={(event) =>
                                                    setUserForm(
                                                        (
                                                            current,
                                                        ) => ({
                                                            ...current,

                                                            employeeId:
                                                                event.target.value,
                                                        }),
                                                    )
                                                }
                                                maxLength={36}
                                                placeholder="Employee UUID"
                                            />
                                        </label>
                                    </>
                                )}

                            {userDialogMode ===
                                'create' && (
                                    <label>
                                        <span>
                                            Initial password
                                            {' '}
                                            (optional)
                                        </span>

                                        <input
                                            type="password"
                                            value={
                                                userForm.password
                                            }
                                            onChange={(event) =>
                                                setUserForm(
                                                    (
                                                        current,
                                                    ) => ({
                                                        ...current,

                                                        password:
                                                            event.target.value,
                                                    }),
                                                )
                                            }
                                            minLength={8}
                                            maxLength={128}
                                            autoComplete="new-password"
                                        />

                                        <small>
                                            Leave blank to
                                            create a pending
                                            account and set
                                            the password
                                            later.
                                        </small>
                                    </label>
                                )}

                            {userDialogMode ===
                                'password' && (
                                    <>
                                        <div className="platform-panel-state">
                                            {userDialogAccount?.email}
                                        </div>

                                        <label>
                                            <span>
                                                New password
                                            </span>

                                            <input
                                                type="password"
                                                value={
                                                    userForm.password
                                                }
                                                onChange={(event) =>
                                                    setUserForm(
                                                        (
                                                            current,
                                                        ) => ({
                                                            ...current,

                                                            password:
                                                                event.target.value,
                                                        }),
                                                    )
                                                }
                                                required
                                                minLength={8}
                                                maxLength={128}
                                                autoComplete="new-password"
                                                autoFocus
                                            />
                                        </label>
                                    </>
                                )}

                            <footer className="platform-dialog-actions">
                                <button
                                    type="button"
                                    onClick={
                                        closeUserDialog
                                    }
                                    disabled={
                                        userActionLoading
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="platform-primary-action"
                                    disabled={
                                        userActionLoading
                                    }
                                >
                                    {userActionLoading
                                        ? 'Saving…'
                                        : userDialogMode ===
                                            'create'
                                            ? 'Create account'
                                            : userDialogMode ===
                                                'edit'
                                                ? 'Save changes'
                                                : userDialogAccount?.accountStatus ===
                                                    'pending'
                                                    ? 'Set password'
                                                    : 'Reset password'}
                                </button>
                            </footer>
                        </form>
                    </section>
                </div>
            )}

            {confirmAction && (
                <ConfirmDialog
                    open
                    {...getConfirmationContent(
                        confirmAction,
                    )}
                    loading={
                        organizationActionLoading ||
                        changingUserId !==
                        null
                    }
                    onCancel={() =>
                        setConfirmAction(
                            null,
                        )
                    }
                    onConfirm={() =>
                        void executeConfirmedAction()
                    }
                />
            )}
        </main>
    )
}