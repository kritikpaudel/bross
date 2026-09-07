import {
    and,
    eq,
    gt,
    isNull,
} from 'drizzle-orm'

import { db } from '../db/index.js'

import {
    employees,
    organizations,
    permissions,
    rolePermissions,
    roles,
    sessions,
    userRoles,
    users,
} from '../db/schema/index.js'

import {
    hashSessionToken,
} from './session.js'

export interface AuthenticatedUser {
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

    roles: Array<{
        id: string
        name: string
        code: string
    }>
}

export interface AuthContext {
    sessionId: string
    user: AuthenticatedUser
}

export async function resolveAuthContext(
    token: string,
): Promise<AuthContext | null> {
    const tokenHash =
        hashSessionToken(token)

    const [result] =
        await db
            .select({
                sessionId:
                    sessions.id,

                userId:
                    users.id,

                email:
                    users.email,

                accountStatus:
                    users.accountStatus,

                employeeId:
                    users.employeeId,

                employeeName:
                    employees.fullName,

                organizationId:
                    organizations.id,

                organizationName:
                    organizations.name,

                organizationSlug:
                    organizations.slug,

                organizationStatus:
                    organizations.status,

                organizationLogoUrl:
                    organizations.logoUrl,
            })
            .from(sessions)
            .innerJoin(
                users,
                eq(
                    sessions.userId,
                    users.id,
                ),
            )
            .innerJoin(
                organizations,
                eq(
                    users.organizationId,
                    organizations.id,
                ),
            )
            .leftJoin(
                employees,
                eq(
                    users.employeeId,
                    employees.id,
                ),
            )
            .where(
                and(
                    eq(
                        sessions.tokenHash,
                        tokenHash,
                    ),

                    isNull(
                        sessions.revokedAt,
                    ),

                    gt(
                        sessions.expiresAt,
                        new Date(),
                    ),
                ),
            )
            .limit(1)

    if (
        !result ||
        result.accountStatus !==
        'active' ||
        result.organizationStatus !==
        'active'
    ) {
        return null
    }

    const assignedRoles =
        await db
            .select({
                id:
                    roles.id,

                name:
                    roles.name,

                code:
                    roles.code,
            })
            .from(userRoles)
            .innerJoin(
                roles,
                eq(
                    userRoles.roleId,
                    roles.id,
                ),
            )
            .where(
                and(
                    eq(
                        userRoles.userId,
                        result.userId,
                    ),

                    eq(
                        roles.isActive,
                        true,
                    ),
                ),
            )

    return {
        sessionId:
            result.sessionId,

        user: {
            id:
                result.userId,

            email:
                result.email,

            employee:
                result.employeeId
                    ? {
                        id:
                            result.employeeId,

                        name:
                            result.employeeName,
                    }
                    : null,

            organization: {
                id:
                    result.organizationId,

                name:
                    result.organizationName,

                slug:
                    result.organizationSlug,

                logoUrl:
                    result.organizationLogoUrl,
            },

            roles:
                assignedRoles,
        },
    }
}

export async function userHasPermission(
    userId: string,
    permissionCode: string,
) {
    /*
     * First check for full system access.
     */
    const fullAccess =
        await db
            .select({
                id:
                    rolePermissions.id,
            })
            .from(userRoles)
            .innerJoin(
                roles,
                eq(
                    userRoles.roleId,
                    roles.id,
                ),
            )
            .innerJoin(
                rolePermissions,
                eq(
                    roles.id,
                    rolePermissions.roleId,
                ),
            )
            .innerJoin(
                permissions,
                eq(
                    rolePermissions.permissionId,
                    permissions.id,
                ),
            )
            .where(
                and(
                    eq(
                        userRoles.userId,
                        userId,
                    ),

                    eq(
                        roles.isActive,
                        true,
                    ),

                    eq(
                        permissions.code,
                        'system.full_access',
                    ),
                ),
            )
            .limit(1)

    if (fullAccess.length > 0) {
        return true
    }

    const permission =
        await db
            .select({
                id:
                    rolePermissions.id,
            })
            .from(userRoles)
            .innerJoin(
                roles,
                eq(
                    userRoles.roleId,
                    roles.id,
                ),
            )
            .innerJoin(
                rolePermissions,
                eq(
                    roles.id,
                    rolePermissions.roleId,
                ),
            )
            .innerJoin(
                permissions,
                eq(
                    rolePermissions.permissionId,
                    permissions.id,
                ),
            )
            .where(
                and(
                    eq(
                        userRoles.userId,
                        userId,
                    ),

                    eq(
                        roles.isActive,
                        true,
                    ),

                    eq(
                        permissions.code,
                        permissionCode,
                    ),
                ),
            )
            .limit(1)

    return permission.length > 0
}