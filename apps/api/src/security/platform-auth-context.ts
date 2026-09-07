import {
    and,
    eq,
    gt,
    isNull,
} from 'drizzle-orm'

import {
    db,
} from '../db/index.js'

import {
    platformAdmins,
    platformSessions,
} from '../db/schema/index.js'

import {
    hashSessionToken,
} from './session.js'

export interface PlatformAuthenticatedUser {
    id: string
    fullName: string
    email: string
}

export interface PlatformAuthContext {
    sessionId: string

    user:
    PlatformAuthenticatedUser
}

export async function resolvePlatformAuthContext(
    token: string,
): Promise<
    PlatformAuthContext | null
> {
    const tokenHash =
        hashSessionToken(
            token,
        )

    const [result] =
        await db
            .select({
                sessionId:
                    platformSessions.id,

                adminId:
                    platformAdmins.id,

                fullName:
                    platformAdmins.fullName,

                email:
                    platformAdmins.email,

                accountStatus:
                    platformAdmins.accountStatus,
            })
            .from(
                platformSessions,
            )
            .innerJoin(
                platformAdmins,
                eq(
                    platformSessions.platformAdminId,
                    platformAdmins.id,
                ),
            )
            .where(
                and(
                    eq(
                        platformSessions.tokenHash,
                        tokenHash,
                    ),

                    isNull(
                        platformSessions.revokedAt,
                    ),

                    gt(
                        platformSessions.expiresAt,
                        new Date(),
                    ),
                ),
            )
            .limit(1)

    if (
        !result ||
        result.accountStatus !==
        'active'
    ) {
        return null
    }

    return {
        sessionId:
            result.sessionId,

        user: {
            id:
                result.adminId,

            fullName:
                result.fullName,

            email:
                result.email,
        },
    }
}