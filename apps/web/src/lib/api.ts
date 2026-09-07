const API_URL =
    import.meta.env.VITE_API_URL ??
    'http://localhost:3000/api'

async function readJson(
    response: Response,
) {
    const contentType =
        response.headers.get(
            'content-type',
        )

    if (
        contentType?.includes(
            'application/json',
        )
    ) {
        return response.json()
    }

    return null
}

async function apiRequest<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const headers =
        new Headers(
            options.headers,
        )

    /*
     * Only declare JSON when we are actually
     * sending a request body.
     *
     * Sending Content-Type: application/json
     * with an empty DELETE request can cause
     * Fastify to reject it as Bad Request.
     */
    if (
        options.body !==
        undefined &&
        options.body !==
        null &&
        !headers.has(
            'Content-Type',
        )
    ) {
        headers.set(
            'Content-Type',
            'application/json',
        )
    }

    const response =
        await fetch(
            `${API_URL}${path}`,
            {
                ...options,

                credentials:
                    'include',

                headers,
            },
        )

    const data =
        await readJson(
            response,
        )

    if (!response.ok) {
        throw new Error(
            data?.error ??
            'Request failed.',
        )
    }

    return data as T
}

/* -------------------------------------------------------
   ORGANIZATION AUTHENTICATION
------------------------------------------------------- */

export interface AuthRole {
    id: string
    name: string
    code: string
}

export interface AuthUser {
    id: string
    email: string

    employee: {
        id: string
        name: string | null
    } | null

    organization: {
        id: string
        name: string
        slug: string
        logoUrl: string | null
    }

    roles: AuthRole[]
}

export async function login(
    email: string,
    password: string,
) {
    return apiRequest<{
        authenticated: true
        user: AuthUser
    }>(
        '/auth/login',
        {
            method: 'POST',

            body:
                JSON.stringify({
                    email,
                    password,
                }),
        },
    )
}

export async function getCurrentUser() {
    const response =
        await fetch(
            `${API_URL}/auth/me`,
            {
                credentials:
                    'include',
            },
        )

    if (
        response.status === 401
    ) {
        return null
    }

    const data =
        await readJson(response)

    if (!response.ok) {
        throw new Error(
            'Unable to check your session.',
        )
    }

    return data.user as AuthUser
}

export async function logout() {
    await apiRequest<{
        authenticated: false
    }>(
        '/auth/logout',
        {
            method: 'POST',
        },
    )
}

/* -------------------------------------------------------
   PLATFORM AUTHENTICATION
------------------------------------------------------- */

export interface PlatformUser {
    id: string
    fullName: string
    email: string
}

export async function platformLogin(
    email: string,
    password: string,
) {
    return apiRequest<{
        authenticated: true
        user: PlatformUser
    }>(
        '/platform/auth/login',
        {
            method: 'POST',

            body:
                JSON.stringify({
                    email,
                    password,
                }),
        },
    )
}

export async function getCurrentPlatformUser() {
    const response =
        await fetch(
            `${API_URL}/platform/auth/me`,
            {
                credentials:
                    'include',
            },
        )

    if (
        response.status === 401
    ) {
        return null
    }

    const data =
        await readJson(response)

    if (!response.ok) {
        throw new Error(
            'Unable to check platform session.',
        )
    }

    return data.user as PlatformUser
}

export async function platformLogout() {
    await apiRequest<{
        authenticated: false
    }>(
        '/platform/auth/logout',
        {
            method: 'POST',
        },
    )
}

/* -------------------------------------------------------
   PLATFORM MANAGEMENT
------------------------------------------------------- */

export type OrganizationStatus =
    | 'active'
    | 'suspended'
    | 'archived'

export type UserAccountStatus =
    | 'pending'
    | 'active'
    | 'disabled'
    | 'locked'
    | 'archived'

export interface PlatformOrganization {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    timezone: string

    status:
    OrganizationStatus

    archivedAt:
    string | null

    createdAt:
    string

    updatedAt:
    string
}

export interface PlatformOrganizationUser {
    id: string
    email: string

    accountStatus:
    UserAccountStatus

    archivedAt:
    string | null

    employeeId:
    string | null

    employeeName:
    string | null

    lastLoginAt:
    string | null

    passwordChangedAt:
    string | null

    createdAt:
    string

    updatedAt:
    string
}

export interface PlatformUserAccount
    extends PlatformOrganizationUser {
    organizationId:
    string

    organizationName:
    string
}

export interface CreatePlatformOrganizationPayload {
    name: string
    slug: string
    timezone: string

    logoUrl?:
    string | null
}

export interface UpdatePlatformOrganizationPayload {
    name?: string
    slug?: string
    timezone?: string

    logoUrl?:
    string | null
}

export interface CreatePlatformOrganizationUserPayload {
    email: string

    employeeId?:
    string | null

    password?:
    string
}

export interface UpdatePlatformOrganizationUserPayload {
    email?: string

    employeeId?:
    string | null
}

export async function getPlatformOrganizations() {
    return apiRequest<{
        organizations:
        PlatformOrganization[]
    }>(
        '/platform/organizations',
    )
}

export async function getPlatformOrganization(
    organizationId: string,
) {
    return apiRequest<{
        organization:
        PlatformOrganization
    }>(
        `/platform/organizations/${organizationId}`,
    )
}

export async function createPlatformOrganization(
    payload:
        CreatePlatformOrganizationPayload,
) {
    return apiRequest<{
        message: string

        organization:
        PlatformOrganization
    }>(
        '/platform/organizations',
        {
            method: 'POST',

            body:
                JSON.stringify(
                    payload,
                ),
        },
    )
}

export async function updatePlatformOrganization(
    organizationId: string,
    payload:
        UpdatePlatformOrganizationPayload,
) {
    return apiRequest<{
        message: string

        organization:
        PlatformOrganization
    }>(
        `/platform/organizations/${organizationId}`,
        {
            method: 'PATCH',

            body:
                JSON.stringify(
                    payload,
                ),
        },
    )
}

export async function updatePlatformOrganizationStatus(
    organizationId: string,
    status:
        | 'active'
        | 'suspended',
) {
    return apiRequest<{
        message: string

        organization:
        PlatformOrganization
    }>(
        `/platform/organizations/${organizationId}/status`,
        {
            method: 'PATCH',

            body:
                JSON.stringify({
                    status,
                }),
        },
    )
}

export async function archivePlatformOrganization(
    organizationId: string,
) {
    return apiRequest<{
        message: string

        organization:
        PlatformOrganization
    }>(
        `/platform/organizations/${organizationId}`,
        {
            method: 'DELETE',
        },
    )
}

/* -------------------------------------------------------
   ORGANIZATION USER MANAGEMENT
------------------------------------------------------- */

export async function getPlatformOrganizationUsers(
    organizationId: string,
) {
    return apiRequest<{
        organization:
        PlatformOrganization

        users:
        PlatformOrganizationUser[]
    }>(
        `/platform/organizations/${organizationId}/users`,
    )
}

export async function getPlatformUser(
    userId: string,
) {
    return apiRequest<{
        user:
        PlatformUserAccount
    }>(
        `/platform/users/${userId}`,
    )
}

export async function createPlatformOrganizationUser(
    organizationId: string,
    payload:
        CreatePlatformOrganizationUserPayload,
) {
    return apiRequest<{
        message: string

        user:
        PlatformUserAccount
    }>(
        `/platform/organizations/${organizationId}/users`,
        {
            method: 'POST',

            body:
                JSON.stringify(
                    payload,
                ),
        },
    )
}

export async function updatePlatformUser(
    userId: string,
    payload:
        UpdatePlatformOrganizationUserPayload,
) {
    return apiRequest<{
        message: string

        user:
        PlatformUserAccount
    }>(
        `/platform/users/${userId}`,
        {
            method: 'PATCH',

            body:
                JSON.stringify(
                    payload,
                ),
        },
    )
}

export async function updatePlatformUserStatus(
    userId: string,
    status:
        | 'active'
        | 'disabled',
) {
    return apiRequest<{
        message: string

        user:
        PlatformUserAccount
    }>(
        `/platform/users/${userId}/status`,
        {
            method: 'PATCH',

            body:
                JSON.stringify({
                    status,
                }),
        },
    )
}

export async function archivePlatformUser(
    userId: string,
) {
    return apiRequest<{
        message: string

        user:
        PlatformUserAccount
    }>(
        `/platform/users/${userId}`,
        {
            method: 'DELETE',
        },
    )
}

export async function restorePlatformUser(
    userId: string,
) {
    return apiRequest<{
        message: string

        user:
        PlatformUserAccount
    }>(
        `/platform/users/${userId}/restore`,
        {
            method: 'POST',
        },
    )
}

export async function setPlatformUserPassword(
    userId: string,
    password: string,
) {
    return apiRequest<{
        message: string

        user:
        PlatformUserAccount
    }>(
        `/platform/users/${userId}/password`,
        {
            method: 'POST',

            body:
                JSON.stringify({
                    password,
                }),
        },
    )
}

/* -------------------------------------------------------
   ORGANIZATION HIERARCHY
------------------------------------------------------- */

export interface HierarchyLevel {
    id: string
    name: string

    description:
    string | null

    position: number

    isGovernance: boolean
    isActive: boolean

    createdAt: string
    updatedAt: string
}

export interface CreateHierarchyLevelPayload {
    name: string

    description?:
    string | null

    isGovernance?:
    boolean
}

export interface UpdateHierarchyLevelPayload {
    name?: string

    description?:
    string | null

    isGovernance?:
    boolean

    isActive?:
    boolean
}

export async function getHierarchyLevels() {
    return apiRequest<{
        levels:
        HierarchyLevel[]
    }>(
        '/organization/hierarchy-levels',
    )
}

export async function createHierarchyLevel(
    payload:
        CreateHierarchyLevelPayload,
) {
    return apiRequest<{
        level:
        HierarchyLevel
    }>(
        '/organization/hierarchy-levels',
        {
            method: 'POST',

            body:
                JSON.stringify(
                    payload,
                ),
        },
    )
}

export async function updateHierarchyLevel(
    levelId: string,
    payload:
        UpdateHierarchyLevelPayload,
) {
    return apiRequest<{
        level:
        HierarchyLevel
    }>(
        `/organization/hierarchy-levels/${levelId}`,
        {
            method: 'PATCH',

            body:
                JSON.stringify(
                    payload,
                ),
        },
    )
}

export async function reorderHierarchyLevels(
    levelIds: string[],
) {
    return apiRequest<{
        levels:
        HierarchyLevel[]
    }>(
        '/organization/hierarchy-levels/order',
        {
            method: 'PUT',

            body:
                JSON.stringify({
                    levelIds,
                }),
        },
    )
}