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
    platformAdmins,
    platformSessions,
} from '../db/schema/index.js'

import {
    resolvePlatformAuthContext,
} from '../security/platform-auth-context.js'

import {
    PLATFORM_SESSION_COOKIE_NAME,
} from '../security/platform-session.js'

import {
    verifyPassword,
} from '../security/password.js'

import {
    createSessionExpiry,
    createSessionToken,
    hashSessionToken,
    SESSION_DURATION_MS,
} from '../security/session.js'

const loginSchema =
    z.object({
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

function getCookieOptions() {
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

export async function platformAuthRoutes(
    app: FastifyInstance,
) {
    /*
     * -----------------------------------------------------
     * PLATFORM LOGIN
     * -----------------------------------------------------
     */
    app.post(
        '/platform/auth/login',
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

            const [admin] =
                await db
                    .select({
                        id:
                            platformAdmins.id,

                        passwordHash:
                            platformAdmins.passwordHash,

                        accountStatus:
                            platformAdmins.accountStatus,
                    })
                    .from(
                        platformAdmins,
                    )
                    .where(
                        eq(
                            platformAdmins.normalizedEmail,
                            normalizedEmail,
                        ),
                    )
                    .limit(1)

            /*
             * Same response for:
             * - unknown email
             * - wrong password
             * - disabled account
             * - locked account
             */
            if (
                !admin ||
                admin.accountStatus !==
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
                    admin.passwordHash,
                )

            if (!passwordMatches) {
                return reply
                    .code(401)
                    .send({
                        error:
                            'Invalid email or password.',
                    })
            }

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
                    platformSessions,
                )
                .values({
                    platformAdminId:
                        admin.id,

                    tokenHash,

                    expiresAt,

                    lastSeenAt:
                        new Date(),
                })

            await db
                .update(
                    platformAdmins,
                )
                .set({
                    lastLoginAt:
                        new Date(),

                    updatedAt:
                        new Date(),
                })
                .where(
                    eq(
                        platformAdmins.id,
                        admin.id,
                    ),
                )

            reply.setCookie(
                PLATFORM_SESSION_COOKIE_NAME,
                sessionToken,
                {
                    ...getCookieOptions(),

                    expires:
                        expiresAt,
                },
            )

            const authContext =
                await resolvePlatformAuthContext(
                    sessionToken,
                )

            if (!authContext) {
                throw new Error(
                    'Failed to establish platform session.',
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
     * CURRENT PLATFORM ADMIN
     * -----------------------------------------------------
     */
    app.get(
        '/platform/auth/me',
        async (
            request,
            reply,
        ) => {
            const token =
                request.cookies[
                PLATFORM_SESSION_COOKIE_NAME
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
                await resolvePlatformAuthContext(
                    token,
                )

            if (!authContext) {
                reply.clearCookie(
                    PLATFORM_SESSION_COOKIE_NAME,
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

            await db
                .update(
                    platformSessions,
                )
                .set({
                    lastSeenAt:
                        new Date(),
                })
                .where(
                    eq(
                        platformSessions.id,
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
     * PLATFORM LOGOUT
     * -----------------------------------------------------
     */
    app.post(
        '/platform/auth/logout',
        async (
            request,
            reply,
        ) => {
            const token =
                request.cookies[
                PLATFORM_SESSION_COOKIE_NAME
                ]

            if (token) {
                const tokenHash =
                    hashSessionToken(
                        token,
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
                                tokenHash,
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

            return reply.send({
                authenticated:
                    false,
            })
        },
    )
}