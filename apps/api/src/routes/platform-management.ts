import {
    and,
    asc,
    eq,
    inArray,
    isNull,
} from 'drizzle-orm'

import type {
    FastifyInstance,
    FastifyReply,
    FastifyRequest,
} from 'fastify'

import { z } from 'zod'

import {
    db,
} from '../db/index.js'

import {
    employees,
    organizations,
    sessions,
    users,
} from '../db/schema/index.js'

import {
    resolvePlatformAuthContext,
} from '../security/platform-auth-context.js'

import {
    PLATFORM_SESSION_COOKIE_NAME,
} from '../security/platform-session.js'

/* -------------------------------------------------------
   AUTHENTICATION
------------------------------------------------------- */

async function requirePlatformAdmin(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    const token =
        request.cookies[
        PLATFORM_SESSION_COOKIE_NAME
        ]

    if (!token) {
        await reply
            .code(401)
            .send({
                error:
                    'Authentication required.',
            })

        return null
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

        await reply
            .code(401)
            .send({
                error:
                    'Authentication required.',
            })

        return null
    }

    return authContext
}

/* -------------------------------------------------------
   VALIDATION
------------------------------------------------------- */

const organizationParamsSchema =
    z.object({
        organizationId:
            z.string().uuid(),
    })

const userParamsSchema =
    z.object({
        userId:
            z.string().uuid(),
    })

const createOrganizationSchema =
    z.object({
        name:
            z.string()
                .trim()
                .min(
                    2,
                    'Organization name is required.',
                )
                .max(160),

        slug:
            z.string()
                .trim()
                .toLowerCase()
                .min(
                    2,
                    'Organization slug is required.',
                )
                .max(80)
                .regex(
                    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    'Slug may contain lowercase letters, numbers, and hyphens only.',
                ),

        timezone:
            z.string()
                .trim()
                .min(
                    1,
                    'Timezone is required.',
                )
                .max(80),

        logoUrl:
            z.string()
                .trim()
                .max(500)
                .nullable()
                .optional(),
    })

const updateOrganizationSchema =
    z.object({
        name:
            z.string()
                .trim()
                .min(2)
                .max(160)
                .optional(),

        slug:
            z.string()
                .trim()
                .toLowerCase()
                .min(2)
                .max(80)
                .regex(
                    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    'Slug may contain lowercase letters, numbers, and hyphens only.',
                )
                .optional(),

        timezone:
            z.string()
                .trim()
                .min(1)
                .max(80)
                .optional(),

        logoUrl:
            z.string()
                .trim()
                .max(500)
                .nullable()
                .optional(),
    })
        .refine(
            (value) =>
                Object.keys(value).length >
                0,
            {
                message:
                    'No organization changes were provided.',
            },
        )

const organizationStatusSchema =
    z.object({
        status:
            z.enum([
                'active',
                'suspended',
            ]),
    })

const updateUserStatusSchema =
    z.object({
        status:
            z.enum([
                'active',
                'disabled',
            ]),
    })

function isValidTimezone(
    timezone: string,
) {
    try {
        new Intl.DateTimeFormat(
            'en-US',
            {
                timeZone:
                    timezone,
            },
        )

        return true
    } catch {
        return false
    }
}

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

async function findOrganization(
    organizationId: string,
) {
    const [
        organization,
    ] =
        await db
            .select({
                id:
                    organizations.id,

                name:
                    organizations.name,

                slug:
                    organizations.slug,

                logoUrl:
                    organizations.logoUrl,

                timezone:
                    organizations.timezone,

                status:
                    organizations.status,

                archivedAt:
                    organizations.archivedAt,

                createdAt:
                    organizations.createdAt,

                updatedAt:
                    organizations.updatedAt,
            })
            .from(
                organizations,
            )
            .where(
                eq(
                    organizations.id,
                    organizationId,
                ),
            )
            .limit(1)

    return (
        organization ??
        null
    )
}

async function revokeOrganizationSessions(
    organizationId: string,
) {
    const organizationUsers =
        await db
            .select({
                id:
                    users.id,
            })
            .from(
                users,
            )
            .where(
                eq(
                    users.organizationId,
                    organizationId,
                ),
            )

    const userIds =
        organizationUsers.map(
            (user) =>
                user.id,
        )

    if (
        userIds.length ===
        0
    ) {
        return
    }

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
                inArray(
                    sessions.userId,
                    userIds,
                ),

                isNull(
                    sessions.revokedAt,
                ),
            ),
        )
}

/* -------------------------------------------------------
   ROUTES
------------------------------------------------------- */

export async function platformManagementRoutes(
    app: FastifyInstance,
) {
    /*
     * -----------------------------------------------------
     * LIST ORGANIZATIONS
     * -----------------------------------------------------
     */
    app.get(
        '/platform/organizations',
        async (
            request,
            reply,
        ) => {
            const authContext =
                await requirePlatformAdmin(
                    request,
                    reply,
                )

            if (!authContext) {
                return
            }

            const organizationList =
                await db
                    .select({
                        id:
                            organizations.id,

                        name:
                            organizations.name,

                        slug:
                            organizations.slug,

                        logoUrl:
                            organizations.logoUrl,

                        timezone:
                            organizations.timezone,

                        status:
                            organizations.status,

                        archivedAt:
                            organizations.archivedAt,

                        createdAt:
                            organizations.createdAt,

                        updatedAt:
                            organizations.updatedAt,
                    })
                    .from(
                        organizations,
                    )
                    .orderBy(
                        asc(
                            organizations.name,
                        ),
                    )

            return reply.send({
                organizations:
                    organizationList,
            })
        },
    )

    /*
     * -----------------------------------------------------
     * GET ORGANIZATION
     * -----------------------------------------------------
     */
    app.get(
        '/platform/organizations/:organizationId',
        async (
            request,
            reply,
        ) => {
            const authContext =
                await requirePlatformAdmin(
                    request,
                    reply,
                )

            if (!authContext) {
                return
            }

            const parsedParams =
                organizationParamsSchema.safeParse(
                    request.params,
                )

            if (!parsedParams.success) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Invalid organization.',
                    })
            }

            const organization =
                await findOrganization(
                    parsedParams
                        .data
                        .organizationId,
                )

            if (!organization) {
                return reply
                    .code(404)
                    .send({
                        error:
                            'Organization not found.',
                    })
            }

            return reply.send({
                organization,
            })
        },
    )

    /*
     * -----------------------------------------------------
     * CREATE ORGANIZATION
     * -----------------------------------------------------
     */
    app.post(
        '/platform/organizations',
        async (
            request,
            reply,
        ) => {
            const authContext =
                await requirePlatformAdmin(
                    request,
                    reply,
                )

            if (!authContext) {
                return
            }

            const parsed =
                createOrganizationSchema.safeParse(
                    request.body,
                )

            if (!parsed.success) {
                return reply
                    .code(400)
                    .send({
                        error:
                            parsed.error
                                .issues[0]
                                ?.message ??
                            'Invalid organization information.',
                    })
            }

            if (
                !isValidTimezone(
                    parsed.data.timezone,
                )
            ) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Enter a valid timezone.',
                    })
            }

            const [
                existingSlug,
            ] =
                await db
                    .select({
                        id:
                            organizations.id,
                    })
                    .from(
                        organizations,
                    )
                    .where(
                        eq(
                            organizations.slug,
                            parsed.data.slug,
                        ),
                    )
                    .limit(1)

            if (existingSlug) {
                return reply
                    .code(409)
                    .send({
                        error:
                            'An organization with this slug already exists.',
                    })
            }

            const [
                organization,
            ] =
                await db
                    .insert(
                        organizations,
                    )
                    .values({
                        name:
                            parsed.data.name,

                        slug:
                            parsed.data.slug,

                        timezone:
                            parsed.data.timezone,

                        logoUrl:
                            parsed.data.logoUrl ??
                            null,

                        status:
                            'active',
                    })
                    .returning({
                        id:
                            organizations.id,

                        name:
                            organizations.name,

                        slug:
                            organizations.slug,

                        logoUrl:
                            organizations.logoUrl,

                        timezone:
                            organizations.timezone,

                        status:
                            organizations.status,

                        archivedAt:
                            organizations.archivedAt,

                        createdAt:
                            organizations.createdAt,

                        updatedAt:
                            organizations.updatedAt,
                    })

            return reply
                .code(201)
                .send({
                    message:
                        'Organization created successfully.',

                    organization,
                })
        },
    )

    /*
     * -----------------------------------------------------
     * UPDATE ORGANIZATION
     * -----------------------------------------------------
     */
    app.patch(
        '/platform/organizations/:organizationId',
        async (
            request,
            reply,
        ) => {
            const authContext =
                await requirePlatformAdmin(
                    request,
                    reply,
                )

            if (!authContext) {
                return
            }

            const parsedParams =
                organizationParamsSchema.safeParse(
                    request.params,
                )

            const parsedBody =
                updateOrganizationSchema.safeParse(
                    request.body,
                )

            if (
                !parsedParams.success
            ) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Invalid organization.',
                    })
            }

            if (
                !parsedBody.success
            ) {
                return reply
                    .code(400)
                    .send({
                        error:
                            parsedBody.error
                                .issues[0]
                                ?.message ??
                            'Invalid organization information.',
                    })
            }

            const organization =
                await findOrganization(
                    parsedParams
                        .data
                        .organizationId,
                )

            if (!organization) {
                return reply
                    .code(404)
                    .send({
                        error:
                            'Organization not found.',
                    })
            }

            if (
                organization.status ===
                'archived'
            ) {
                return reply
                    .code(409)
                    .send({
                        error:
                            'Restore the organization before editing it.',
                    })
            }

            if (
                parsedBody.data.timezone &&
                !isValidTimezone(
                    parsedBody.data.timezone,
                )
            ) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Enter a valid timezone.',
                    })
            }

            if (
                parsedBody.data.slug &&
                parsedBody.data.slug !==
                organization.slug
            ) {
                const [
                    duplicateSlug,
                ] =
                    await db
                        .select({
                            id:
                                organizations.id,
                        })
                        .from(
                            organizations,
                        )
                        .where(
                            eq(
                                organizations.slug,
                                parsedBody.data.slug,
                            ),
                        )
                        .limit(1)

                if (duplicateSlug) {
                    return reply
                        .code(409)
                        .send({
                            error:
                                'An organization with this slug already exists.',
                        })
                }
            }

            const [
                updatedOrganization,
            ] =
                await db
                    .update(
                        organizations,
                    )
                    .set({
                        ...parsedBody.data,

                        updatedAt:
                            new Date(),
                    })
                    .where(
                        eq(
                            organizations.id,
                            organization.id,
                        ),
                    )
                    .returning({
                        id:
                            organizations.id,

                        name:
                            organizations.name,

                        slug:
                            organizations.slug,

                        logoUrl:
                            organizations.logoUrl,

                        timezone:
                            organizations.timezone,

                        status:
                            organizations.status,

                        archivedAt:
                            organizations.archivedAt,

                        createdAt:
                            organizations.createdAt,

                        updatedAt:
                            organizations.updatedAt,
                    })

            return reply.send({
                message:
                    'Organization updated successfully.',

                organization:
                    updatedOrganization,
            })
        },
    )

    /*
     * -----------------------------------------------------
     * SUSPEND / RESTORE ORGANIZATION
     * -----------------------------------------------------
     */
    app.patch(
        '/platform/organizations/:organizationId/status',
        async (
            request,
            reply,
        ) => {
            const authContext =
                await requirePlatformAdmin(
                    request,
                    reply,
                )

            if (!authContext) {
                return
            }

            const parsedParams =
                organizationParamsSchema.safeParse(
                    request.params,
                )

            const parsedBody =
                organizationStatusSchema.safeParse(
                    request.body,
                )

            if (
                !parsedParams.success ||
                !parsedBody.success
            ) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Invalid organization status request.',
                    })
            }

            const organization =
                await findOrganization(
                    parsedParams
                        .data
                        .organizationId,
                )

            if (!organization) {
                return reply
                    .code(404)
                    .send({
                        error:
                            'Organization not found.',
                    })
            }

            const nextStatus =
                parsedBody.data.status

            await db
                .update(
                    organizations,
                )
                .set({
                    status:
                        nextStatus,

                    archivedAt:
                        nextStatus ===
                            'active'
                            ? null
                            : organization.archivedAt,

                    updatedAt:
                        new Date(),
                })
                .where(
                    eq(
                        organizations.id,
                        organization.id,
                    ),
                )

            if (
                nextStatus ===
                'suspended'
            ) {
                await revokeOrganizationSessions(
                    organization.id,
                )
            }

            const updatedOrganization =
                await findOrganization(
                    organization.id,
                )

            return reply.send({
                message:
                    nextStatus ===
                        'active'
                        ? 'Organization restored successfully.'
                        : 'Organization suspended successfully.',

                organization:
                    updatedOrganization,
            })
        },
    )

    /*
     * -----------------------------------------------------
     * ARCHIVE / DELETE ORGANIZATION
     * -----------------------------------------------------
     *
     * This is intentionally history-safe.
     * We do not physically destroy employee, project,
     * task, assignment, or audit history here.
     */
    app.delete(
        '/platform/organizations/:organizationId',
        async (
            request,
            reply,
        ) => {
            const authContext =
                await requirePlatformAdmin(
                    request,
                    reply,
                )

            if (!authContext) {
                return
            }

            const parsedParams =
                organizationParamsSchema.safeParse(
                    request.params,
                )

            if (!parsedParams.success) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Invalid organization.',
                    })
            }

            const organization =
                await findOrganization(
                    parsedParams
                        .data
                        .organizationId,
                )

            if (!organization) {
                return reply
                    .code(404)
                    .send({
                        error:
                            'Organization not found.',
                    })
            }

            if (
                organization.status ===
                'archived'
            ) {
                return reply
                    .code(409)
                    .send({
                        error:
                            'Organization is already archived.',
                    })
            }

            const now =
                new Date()

            await db
                .update(
                    organizations,
                )
                .set({
                    status:
                        'archived',

                    archivedAt:
                        now,

                    updatedAt:
                        now,
                })
                .where(
                    eq(
                        organizations.id,
                        organization.id,
                    ),
                )

            await revokeOrganizationSessions(
                organization.id,
            )

            const archivedOrganization =
                await findOrganization(
                    organization.id,
                )

            return reply.send({
                message:
                    'Organization deleted successfully. Its history has been preserved.',

                organization:
                    archivedOrganization,
            })
        },
    )

    /*
     * -----------------------------------------------------
     * LIST ORGANIZATION USERS
     * -----------------------------------------------------
     */
    app.get(
        '/platform/organizations/:organizationId/users',
        async (
            request,
            reply,
        ) => {
            const authContext =
                await requirePlatformAdmin(
                    request,
                    reply,
                )

            if (!authContext) {
                return
            }

            const parsedParams =
                organizationParamsSchema.safeParse(
                    request.params,
                )

            if (!parsedParams.success) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Invalid organization.',
                    })
            }

            const organization =
                await findOrganization(
                    parsedParams
                        .data
                        .organizationId,
                )

            if (!organization) {
                return reply
                    .code(404)
                    .send({
                        error:
                            'Organization not found.',
                    })
            }

            const accountList =
                await db
                    .select({
                        id:
                            users.id,

                        email:
                            users.email,

                        accountStatus:
                            users.accountStatus,

                        employeeId:
                            users.employeeId,

                        employeeName:
                            employees.fullName,

                        lastLoginAt:
                            users.lastLoginAt,

                        createdAt:
                            users.createdAt,

                        updatedAt:
                            users.updatedAt,
                    })
                    .from(
                        users,
                    )
                    .leftJoin(
                        employees,
                        eq(
                            users.employeeId,
                            employees.id,
                        ),
                    )
                    .where(
                        eq(
                            users.organizationId,
                            organization.id,
                        ),
                    )
                    .orderBy(
                        asc(
                            users.email,
                        ),
                    )

            return reply.send({
                organization,

                users:
                    accountList,
            })
        },
    )

    /*
     * -----------------------------------------------------
     * ENABLE / DISABLE ORGANIZATION USER
     * -----------------------------------------------------
     */
    app.patch(
        '/platform/users/:userId/status',
        async (
            request,
            reply,
        ) => {
            const authContext =
                await requirePlatformAdmin(
                    request,
                    reply,
                )

            if (!authContext) {
                return
            }

            const parsedParams =
                userParamsSchema.safeParse(
                    request.params,
                )

            const parsedBody =
                updateUserStatusSchema.safeParse(
                    request.body,
                )

            if (
                !parsedParams.success ||
                !parsedBody.success
            ) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Invalid account status request.',
                    })
            }

            const [
                existingUser,
            ] =
                await db
                    .select({
                        id:
                            users.id,

                        accountStatus:
                            users.accountStatus,
                    })
                    .from(
                        users,
                    )
                    .where(
                        eq(
                            users.id,
                            parsedParams.data.userId,
                        ),
                    )
                    .limit(1)

            if (!existingUser) {
                return reply
                    .code(404)
                    .send({
                        error:
                            'User account not found.',
                    })
            }

            if (
                existingUser.accountStatus !==
                'active' &&
                existingUser.accountStatus !==
                'disabled'
            ) {
                return reply
                    .code(409)
                    .send({
                        error:
                            'This account cannot be enabled or disabled from its current state.',
                    })
            }

            await db
                .update(
                    users,
                )
                .set({
                    accountStatus:
                        parsedBody.data.status,

                    updatedAt:
                        new Date(),
                })
                .where(
                    eq(
                        users.id,
                        existingUser.id,
                    ),
                )

            if (
                parsedBody.data.status ===
                'disabled'
            ) {
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
                                sessions.userId,
                                existingUser.id,
                            ),

                            isNull(
                                sessions.revokedAt,
                            ),
                        ),
                    )
            }

            const [
                updatedUser,
            ] =
                await db
                    .select({
                        id:
                            users.id,

                        email:
                            users.email,

                        accountStatus:
                            users.accountStatus,
                    })
                    .from(
                        users,
                    )
                    .where(
                        eq(
                            users.id,
                            existingUser.id,
                        ),
                    )
                    .limit(1)

            return reply.send({
                message:
                    parsedBody.data.status ===
                        'active'
                        ? 'Account enabled successfully.'
                        : 'Account disabled successfully.',

                user:
                    updatedUser,
            })
        },
    )
}