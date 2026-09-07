import type {
    FastifyReply,
    FastifyRequest,
} from 'fastify'

import {
    resolveAuthContext,
    userHasPermission,
} from './auth-context.js'

import {
    SESSION_COOKIE_NAME,
} from './session.js'

export async function requireAuthentication(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    const token =
        request.cookies[
        SESSION_COOKIE_NAME
        ]

    if (!token) {
        return reply
            .code(401)
            .send({
                error:
                    'Authentication required.',
            })
    }

    const context =
        await resolveAuthContext(
            token,
        )

    if (!context) {
        reply.clearCookie(
            SESSION_COOKIE_NAME,
            {
                path: '/',
            },
        )

        return reply
            .code(401)
            .send({
                error:
                    'Authentication required.',
            })
    }

    request.authUser =
        context.user
}

export function requirePermission(
    permissionCode: string,
) {
    return async function permissionGuard(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        if (!request.authUser) {
            return reply
                .code(401)
                .send({
                    error:
                        'Authentication required.',
                })
        }

        const allowed =
            await userHasPermission(
                request.authUser.id,
                permissionCode,
            )

        if (!allowed) {
            return reply
                .code(403)
                .send({
                    error:
                        'You do not have permission to perform this action.',
                })
        }
    }
}