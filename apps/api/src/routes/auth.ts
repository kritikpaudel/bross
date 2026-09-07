import {
    and,
    eq,
    isNull,
} from 'drizzle-orm'

import type {
    FastifyInstance,
} from 'fastify'

import { z } from 'zod'

import {
    db,
} from '../db/index.js'

import {
    sessions,
    users,
} from '../db/schema/index.js'

import {
    resolveAuthContext,
} from '../security/auth-context.js'

import {
    verifyPassword,
} from '../security/password.js'

import {
    createSessionExpiry,
    createSessionToken,
    hashSessionToken,
    SESSION_COOKIE_NAME,
    SESSION_DURATION_MS,
} from '../security/session.js'

const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .email()
        .max(254),

    password: z
        .string()
        .min(1)
        .max(128),
})

function getSessionCookieOptions() {
    return {
        httpOnly: true,

        secure:
            process.env.COOKIE_SECURE ===
            'true',

        sameSite:
            'strict' as const,

        path: '/',

        maxAge:
            Math.floor(
                SESSION_DURATION_MS /
                1000,
            ),
    }
}

export async function authRoutes(
    app: FastifyInstance,
) {
    /*
     * -----------------------------------------------------
     * LOGIN
     * -----------------------------------------------------
     */
    app.post(
        '/auth/login',
        async (
            request,
            reply,
        ) => {
            const parsed =
                loginSchema.safeParse(
                    request.body,
                )

            if (!parsed.success) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Invalid login information.',
                    })
            }

            const normalizedEmail =
                parsed.data.email
                    .trim()
                    .toLowerCase()

            const [user] =
                await db
                    .select({
                        id:
                            users.id,

                        passwordHash:
                            users.passwordHash,

                        accountStatus:
                            users.accountStatus,
                    })
                    .from(users)
                    .where(
                        eq(
                            users.normalizedEmail,
                            normalizedEmail,
                        ),
                    )
                    .limit(1)

            /*
             * Use the same response for:
             *
             * - unknown email
             * - missing password
             * - incorrect password
             * - disabled account
             * - locked account
             *
             * This avoids exposing whether a specific
             * email address has an account.
             */
            if (
                !user ||
                !user.passwordHash ||
                user.accountStatus !==
                'active'
            ) {
                return reply
                    .code(401)
                    .send({
                        error:
                            'Invalid email or password.',
                    })
            }

            const passwordMatches =
                await verifyPassword(
                    parsed.data.password,
                    user.passwordHash,
                )

            if (!passwordMatches) {
                return reply
                    .code(401)
                    .send({
                        error:
                            'Invalid email or password.',
                    })
            }

            /*
             * Create a cryptographically random
             * session token.
             *
             * The raw token goes only into the
             * HTTP-only browser cookie.
             *
             * PostgreSQL stores only the SHA-256
             * hash of that token.
             */
            const sessionToken =
                createSessionToken()

            const tokenHash =
                hashSessionToken(
                    sessionToken,
                )

            const expiresAt =
                createSessionExpiry()

            await db
                .insert(sessions)
                .values({
                    userId:
                        user.id,

                    tokenHash,

                    expiresAt,

                    lastSeenAt:
                        new Date(),
                })

            await db
                .update(users)
                .set({
                    lastLoginAt:
                        new Date(),

                    updatedAt:
                        new Date(),
                })
                .where(
                    eq(
                        users.id,
                        user.id,
                    ),
                )

            reply.setCookie(
                SESSION_COOKIE_NAME,
                sessionToken,
                {
                    ...getSessionCookieOptions(),

                    expires:
                        expiresAt,
                },
            )

            /*
             * Resolve the full authenticated user
             * through our shared authentication
             * context.
             *
             * This avoids duplicating session/user/
             * organization/role lookup logic here.
             */
            const authContext =
                await resolveAuthContext(
                    sessionToken,
                )

            if (!authContext) {
                throw new Error(
                    'Failed to establish authenticated session.',
                )
            }

            return reply.send({
                authenticated: true,

                user:
                    authContext.user,
            })
        },
    )

    /*
     * -----------------------------------------------------
     * CURRENT AUTHENTICATED USER
     * -----------------------------------------------------
     */
    app.get(
        '/auth/me',
        async (
            request,
            reply,
        ) => {
            const token =
                request.cookies[
                SESSION_COOKIE_NAME
                ]

            if (!token) {
                return reply
                    .code(401)
                    .send({
                        authenticated:
                            false,
                    })
            }

            const authContext =
                await resolveAuthContext(
                    token,
                )

            if (!authContext) {
                reply.clearCookie(
                    SESSION_COOKIE_NAME,
                    {
                        path: '/',
                    },
                )

                return reply
                    .code(401)
                    .send({
                        authenticated:
                            false,
                    })
            }

            /*
             * Track session activity.
             */
            await db
                .update(sessions)
                .set({
                    lastSeenAt:
                        new Date(),
                })
                .where(
                    eq(
                        sessions.id,
                        authContext.sessionId,
                    ),
                )

            return reply.send({
                authenticated: true,

                user:
                    authContext.user,
            })
        },
    )

    /*
     * -----------------------------------------------------
     * LOGOUT
     * -----------------------------------------------------
     */
    app.post(
        '/auth/logout',
        async (
            request,
            reply,
        ) => {
            const token =
                request.cookies[
                SESSION_COOKIE_NAME
                ]

            if (token) {
                const tokenHash =
                    hashSessionToken(
                        token,
                    )

                /*
                 * Revoke the server-side session.
                 *
                 * We do not simply delete the browser
                 * cookie and leave the database session
                 * valid.
                 */
                await db
                    .update(sessions)
                    .set({
                        revokedAt:
                            new Date(),
                    })
                    .where(
                        and(
                            eq(
                                sessions.tokenHash,
                                tokenHash,
                            ),

                            isNull(
                                sessions.revokedAt,
                            ),
                        ),
                    )
            }

            reply.clearCookie(
                SESSION_COOKIE_NAME,
                {
                    path: '/',
                },
            )

            return reply.send({
                authenticated:
                    false,
            })
        },
    )
}