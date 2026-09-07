import type {
    FastifyReply,
    FastifyRequest,
} from 'fastify'

const MUTATING_METHODS =
    new Set([
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
    ])

function normalizeOrigin(
    value: string,
) {
    try {
        return new URL(value).origin
    } catch {
        throw new Error(
            `Invalid origin configured: ${value}`,
        )
    }
}

export function getAllowedOrigins() {
    const configured =
        process.env.APP_ORIGINS ??
        'http://localhost:5173'

    const origins =
        configured
            .split(',')
            .map(
                (origin) =>
                    origin.trim(),
            )
            .filter(Boolean)
            .map(normalizeOrigin)

    if (origins.length === 0) {
        throw new Error(
            'APP_ORIGINS must contain at least one trusted origin.',
        )
    }

    if (origins.includes('*')) {
        throw new Error(
            'Wildcard origins are not allowed.',
        )
    }

    return [
        ...new Set(origins),
    ]
}

export function createTrustedOriginGuard(
    allowedOrigins: string[],
) {
    const trustedOrigins =
        new Set(
            allowedOrigins,
        )

    return async function trustedOriginGuard(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        if (
            !MUTATING_METHODS.has(
                request.method,
            )
        ) {
            return
        }

        const origin =
            request.headers.origin

        /*
         * All browser mutations in Bross Work OS
         * must carry a trusted Origin header.
         *
         * This prevents another website from
         * using the user's authenticated browser
         * session to perform actions against
         * the API.
         */
        if (!origin) {
            return reply
                .code(403)
                .send({
                    error:
                        'Request origin is required.',
                })
        }

        let normalizedOrigin:
            string

        try {
            normalizedOrigin =
                new URL(
                    origin,
                ).origin
        } catch {
            return reply
                .code(403)
                .send({
                    error:
                        'Invalid request origin.',
                })
        }

        if (
            !trustedOrigins.has(
                normalizedOrigin,
            )
        ) {
            return reply
                .code(403)
                .send({
                    error:
                        'Untrusted request origin.',
                })
        }
    }
}