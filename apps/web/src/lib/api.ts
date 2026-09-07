const API_URL =
    import.meta.env.VITE_API_URL ??
    'http://localhost:3000/api'

export async function getSetupStatus() {
    const response = await fetch(
        `${API_URL}/setup/status`,
    )

    if (!response.ok) {
        throw new Error(
            'Unable to check setup status.',
        )
    }

    return response.json() as Promise<{
        configured: boolean
    }>
}

export interface SetupPayload {
    organizationName: string
    organizationSlug: string
    timezone: string
    email: string
    password: string
}

export async function createInitialSetup(
    payload: SetupPayload,
) {
    const response = await fetch(
        `${API_URL}/setup`,
        {
            method: 'POST',

            headers: {
                'Content-Type':
                    'application/json',
            },

            body: JSON.stringify(payload),
        },
    )

    const data = await response.json()

    if (!response.ok) {
        throw new Error(
            data.error ??
            'Setup failed.',
        )
    }

    return data
}