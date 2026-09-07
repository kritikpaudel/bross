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
    const response =
        await fetch(
            `${API_URL}${path}`,
            {
                ...options,

                credentials:
                    'include',

                headers: {
                    'Content-Type':
                        'application/json',

                    ...options.headers,
                },
            },
        )

    const data =
        await readJson(response)

    if (!response.ok) {
        throw new Error(
            data?.error ??
            'Request failed.',
        )
    }

    return data as T
}

/* -------------------------------------------------------
   SETUP
------------------------------------------------------- */

export interface SetupPayload {
    organizationName: string
    organizationSlug: string
    timezone: string
    email: string
    password: string
}

export async function getSetupStatus() {
    return apiRequest<{
        configured: boolean
    }>(
        '/setup/status',
    )
}

export async function createInitialSetup(
    payload: SetupPayload,
) {
    return apiRequest<{
        configured: true
    }>(
        '/setup',
        {
            method: 'POST',

            body:
                JSON.stringify(
                    payload,
                ),
        },
    )
}

/* -------------------------------------------------------
   AUTHENTICATION
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