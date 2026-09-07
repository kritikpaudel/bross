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
    organizations,
    platformSessions,
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
    PLATFORM_SESSION_COOKIE_NAME,
} from '../security/platform-session.js'

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
    }
}

export async function authRoutes(
    app: FastifyInstance,
) {
    /*
     * -----------------------------------------------------
     * ORGANIZATION LOGIN
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
                            'Enter a valid email address and password.',
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

                        organizationStatus:
                            organizations.status,
                    })
                    .from(
                        users,
                    )
                    .innerJoin(
                        organizations,
                        eq(
                            users.organizationId,
                            organizations.id,
                        ),
                    )
                    .where(
                        eq(
                            users.normalizedEmail,
                            normalizedEmail,
                        ),
                    )
                    .limit(1)

            /*
             * -------------------------------------------------
             * EMAIL VALIDATION
             * -------------------------------------------------
             */
            if (!user) {
                return reply
                    .code(401)
                    .send({
                        error:
                            'Invalid email.',
                    })
            }

            /*
             * An invited/pending account may not have
             * created a password yet.
             */
            if (!user.passwordHash) {
                return reply
                    .code(403)
                    .send({
                        error:
                            'Your account has not been activated yet.',
                    })
            }

            /*
             * -------------------------------------------------
             * PASSWORD VALIDATION
             * -------------------------------------------------
             */
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
                            'Invalid password.',
                    })
            }

            /*
             * -------------------------------------------------
             * ACCOUNT STATUS
             * -------------------------------------------------
             *
             * Password is verified first before exposing
             * disabled/locked/pending account state.
             */
            if (
                user.accountStatus ===
                'disabled'
            ) {
                return reply
                    .code(403)
                    .send({
                        error:
                            'Your account has been disabled. Contact your administrator.',
                    })
            }

            if (
                user.accountStatus ===
                'locked'
            ) {
                return reply
                    .code(403)
                    .send({
                        error:
                            'Your account is locked. Contact your administrator.',
                    })
            }

            if (
                user.organizationStatus ===
                'suspended'
            ) {
                return reply
                    .code(403)
                    .send({
                        error:
                            'Your organization has been suspended. Contact your administrator.',
                    })
            }

            if (
                user.organizationStatus ===
                'archived'
            ) {
                return reply
                    .code(403)
                    .send({
                        error:
                            'Your organization is no longer active. Contact your administrator.',
                    })
            }

            /*
             * -------------------------------------------------
             * CLEAR EXISTING PLATFORM SESSION
             * -------------------------------------------------
             *
             * Organization and Platform authentication
             * are mutually exclusive in the same browser.
             */
            const existingPlatformToken =
                request.cookies[
                PLATFORM_SESSION_COOKIE_NAME
                ]

            if (
                existingPlatformToken
            ) {
                const existingPlatformTokenHash =
                    hashSessionToken(
                        existingPlatformToken,
                    )

                await db
                    .update(
                        platformSessions,
                    )
                    .set({
                        revokedAt:
                            new Date(),
                    })
                    .where(
                        and(
                            eq(
                                platformSessions.tokenHash,
                                existingPlatformTokenHash,
                            ),

                            isNull(
                                platformSessions.revokedAt,
                            ),
                        ),
                    )
            }

            reply.clearCookie(
                PLATFORM_SESSION_COOKIE_NAME,
                {
                    path: '/',
                },
            )

            /*
             * -------------------------------------------------
             * CREATE ORGANIZATION SESSION
             * -------------------------------------------------
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
                .insert(
                    sessions,
                )
                .values({
                    userId:
                        user.id,

                    tokenHash,

                    expiresAt,

                    lastSeenAt:
                        new Date(),
                })

            await db
                .update(
                    users,
                )
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
                getSessionCookieOptions(),
            )

            /*
             * Resolve the complete authenticated user,
             * including organization and role information.
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
                authenticated:
                    true,

                user:
                    authContext.user,
            })
        },
    )

    /*
     * -----------------------------------------------------
     * CURRENT AUTHENTICATED ORGANIZATION USER
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
             * Track current session activity.
             */
            await db
                .update(
                    sessions,
                )
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
                authenticated:
                    true,

                user:
                    authContext.user,
            })
        },
    )

    /*
     * -----------------------------------------------------
     * ORGANIZATION LOGOUT
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
                 * Revoke the server-side session,
                 * not only the browser cookie.
                 */
                await db
                    .update(
                        sessions,
                    )
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