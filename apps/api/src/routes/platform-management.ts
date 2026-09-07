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

import {
    hashPassword,
} from '../security/password.js'

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

const createUserSchema =
    z.object({
        email:
            z.string()
                .trim()
                .email(
                    'Enter a valid email address.',
                )
                .max(254),

        employeeId:
            z.string()
                .uuid(
                    'Invalid employee.',
                )
                .nullable()
                .optional(),

        password:
            z.string()
                .min(
                    8,
                    'Password must be at least 8 characters.',
                )
                .max(
                    128,
                    'Password is too long.',
                )
                .optional(),
    })

const updateUserSchema =
    z.object({
        email:
            z.string()
                .trim()
                .email(
                    'Enter a valid email address.',
                )
                .max(254)
                .optional(),

        employeeId:
            z.string()
                .uuid(
                    'Invalid employee.',
                )
                .nullable()
                .optional(),
    })
        .refine(
            (value) =>
                Object.keys(value).length >
                0,
            {
                message:
                    'No account changes were provided.',
            },
        )

const updateUserStatusSchema =
    z.object({
        status:
            z.enum([
                'active',
                'disabled',
            ]),
    })

const updateUserPasswordSchema =
    z.object({
        password:
            z.string()
                .min(
                    8,
                    'Password must be at least 8 characters.',
                )
                .max(
                    128,
                    'Password is too long.',
                ),
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

function normalizeEmail(
    email: string,
) {
    return email
        .trim()
        .toLowerCase()
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

async function findUserAccount(
    userId: string,
) {
    const [
        account,
    ] =
        await db
            .select({
                id:
                    users.id,

                organizationId:
                    users.organizationId,

                organizationName:
                    organizations.name,

                employeeId:
                    users.employeeId,

                employeeName:
                    employees.fullName,

                email:
                    users.email,

                accountStatus:
                    users.accountStatus,

                archivedAt:
                    users.archivedAt,

                lastLoginAt:
                    users.lastLoginAt,

                passwordChangedAt:
                    users.passwordChangedAt,

                createdAt:
                    users.createdAt,

                updatedAt:
                    users.updatedAt,
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
            .leftJoin(
                employees,
                eq(
                    users.employeeId,
                    employees.id,
                ),
            )
            .where(
                eq(
                    users.id,
                    userId,
                ),
            )
            .limit(1)

    return account ?? null
}

async function findUserSecurityRecord(
    userId: string,
) {
    const [
        account,
    ] =
        await db
            .select({
                id:
                    users.id,

                organizationId:
                    users.organizationId,

                employeeId:
                    users.employeeId,

                email:
                    users.email,

                normalizedEmail:
                    users.normalizedEmail,

                passwordHash:
                    users.passwordHash,

                accountStatus:
                    users.accountStatus,

                archivedAt:
                    users.archivedAt,
            })
            .from(
                users,
            )
            .where(
                eq(
                    users.id,
                    userId,
                ),
            )
            .limit(1)

    return account ?? null
}

async function revokeUserSessions(
    userId: string,
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
                    userId,
                ),

                isNull(
                    sessions.revokedAt,
                ),
            ),
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

async function validateEmployeeForOrganization(
    employeeId: string,
    organizationId: string,
    currentUserId?: string,
) {
    const [
        employee,
    ] =
        await db
            .select({
                id:
                    employees.id,

                organizationId:
                    employees.organizationId,
            })
            .from(
                employees,
            )
            .where(
                eq(
                    employees.id,
                    employeeId,
                ),
            )
            .limit(1)

    if (
        !employee ||
        employee.organizationId !==
        organizationId
    ) {
        return {
            valid: false as const,
            error:
                'Employee does not belong to this organization.',
        }
    }

    const [
        linkedAccount,
    ] =
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
                    users.employeeId,
                    employeeId,
                ),
            )
            .limit(1)

    if (
        linkedAccount &&
        linkedAccount.id !==
        currentUserId
    ) {
        return {
            valid: false as const,
            error:
                'This employee already has a user account.',
        }
    }

    return {
        valid: true as const,
    }
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

                        archivedAt:
                            users.archivedAt,

                        employeeId:
                            users.employeeId,

                        employeeName:
                            employees.fullName,

                        lastLoginAt:
                            users.lastLoginAt,

                        passwordChangedAt:
                            users.passwordChangedAt,

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
     * GET ORGANIZATION USER
     * -----------------------------------------------------
     */
    app.get(
        '/platform/users/:userId',
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

            if (!parsedParams.success) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Invalid user account.',
                    })
            }

            const account =
                await findUserAccount(
                    parsedParams.data.userId,
                )

            if (!account) {
                return reply
                    .code(404)
                    .send({
                        error:
                            'User account not found.',
                    })
            }

            return reply.send({
                user:
                    account,
            })
        },
    )

    /*
     * -----------------------------------------------------
     * CREATE ORGANIZATION USER
     * -----------------------------------------------------
     */
    app.post(
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

            const parsedBody =
                createUserSchema.safeParse(
                    request.body,
                )

            if (!parsedParams.success) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Invalid organization.',
                    })
            }

            if (!parsedBody.success) {
                return reply
                    .code(400)
                    .send({
                        error:
                            parsedBody.error
                                .issues[0]
                                ?.message ??
                            'Invalid user account information.',
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
                            'Restore the organization before creating user accounts.',
                    })
            }

            const email =
                parsedBody.data.email.trim()

            const normalizedEmail =
                normalizeEmail(
                    email,
                )

            const [
                duplicateEmail,
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
                            users.normalizedEmail,
                            normalizedEmail,
                        ),
                    )
                    .limit(1)

            if (duplicateEmail) {
                return reply
                    .code(409)
                    .send({
                        error:
                            duplicateEmail.accountStatus ===
                                'archived'
                                ? 'An archived account with this email already exists. Restore or edit that account instead.'
                                : 'A user account with this email already exists.',
                    })
            }

            if (
                parsedBody.data.employeeId
            ) {
                const employeeValidation =
                    await validateEmployeeForOrganization(
                        parsedBody.data.employeeId,
                        organization.id,
                    )

                if (
                    !employeeValidation.valid
                ) {
                    return reply
                        .code(409)
                        .send({
                            error:
                                employeeValidation.error,
                        })
                }
            }

            let passwordHash:
                string | null =
                null

            let passwordChangedAt:
                Date | null =
                null

            if (
                parsedBody.data.password
            ) {
                passwordHash =
                    await hashPassword(
                        parsedBody.data.password,
                    )

                passwordChangedAt =
                    new Date()
            }

            const createdUsers =
                await db
                    .insert(
                        users,
                    )
                    .values({
                        organizationId:
                            organization.id,

                        employeeId:
                            parsedBody.data.employeeId ??
                            null,

                        email,

                        normalizedEmail,

                        passwordHash,

                        accountStatus:
                            passwordHash
                                ? 'active'
                                : 'pending',

                        passwordChangedAt,
                    })
                    .returning({
                        id:
                            users.id,
                    })

            const createdUser =
                createdUsers[0]

            if (!createdUser) {
                return reply
                    .code(500)
                    .send({
                        error:
                            'User account could not be created.',
                    })
            }

            const account =
                await findUserAccount(
                    createdUser.id,
                )

            return reply
                .code(201)
                .send({
                    message:
                        passwordHash
                            ? 'User account created successfully.'
                            : 'User account created successfully. Set a password before the account can sign in.',

                    user:
                        account,
                })
        },
    )

    /*
     * -----------------------------------------------------
     * UPDATE ORGANIZATION USER
     * -----------------------------------------------------
     */
    app.patch(
        '/platform/users/:userId',
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
                updateUserSchema.safeParse(
                    request.body,
                )

            if (!parsedParams.success) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Invalid user account.',
                    })
            }

            if (!parsedBody.success) {
                return reply
                    .code(400)
                    .send({
                        error:
                            parsedBody.error
                                .issues[0]
                                ?.message ??
                            'Invalid user account information.',
                    })
            }

            const existingUser =
                await findUserSecurityRecord(
                    parsedParams.data.userId,
                )

            if (!existingUser) {
                return reply
                    .code(404)
                    .send({
                        error:
                            'User account not found.',
                    })
            }

            if (
                existingUser.accountStatus ===
                'archived'
            ) {
                return reply
                    .code(409)
                    .send({
                        error:
                            'Restore the account before editing it.',
                    })
            }

            let nextEmail:
                string | undefined

            let nextNormalizedEmail:
                string | undefined

            if (
                parsedBody.data.email !==
                undefined
            ) {
                nextEmail =
                    parsedBody.data.email.trim()

                nextNormalizedEmail =
                    normalizeEmail(
                        nextEmail,
                    )

                if (
                    nextNormalizedEmail !==
                    existingUser.normalizedEmail
                ) {
                    const [
                        duplicateEmail,
                    ] =
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
                                    users.normalizedEmail,
                                    nextNormalizedEmail,
                                ),
                            )
                            .limit(1)

                    if (
                        duplicateEmail &&
                        duplicateEmail.id !==
                        existingUser.id
                    ) {
                        return reply
                            .code(409)
                            .send({
                                error:
                                    'A user account with this email already exists.',
                            })
                    }
                }
            }

            if (
                parsedBody.data.employeeId
            ) {
                const employeeValidation =
                    await validateEmployeeForOrganization(
                        parsedBody.data.employeeId,
                        existingUser.organizationId,
                        existingUser.id,
                    )

                if (
                    !employeeValidation.valid
                ) {
                    return reply
                        .code(409)
                        .send({
                            error:
                                employeeValidation.error,
                        })
                }
            }

            const emailChanged =
                nextNormalizedEmail !==
                undefined &&
                nextNormalizedEmail !==
                existingUser.normalizedEmail

            const employeeChanged =
                parsedBody.data.employeeId !==
                undefined &&
                parsedBody.data.employeeId !==
                existingUser.employeeId

            await db
                .update(
                    users,
                )
                .set({
                    email:
                        nextEmail,

                    normalizedEmail:
                        nextNormalizedEmail,

                    employeeId:
                        parsedBody.data.employeeId,

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
                emailChanged ||
                employeeChanged
            ) {
                await revokeUserSessions(
                    existingUser.id,
                )
            }

            const updatedUser =
                await findUserAccount(
                    existingUser.id,
                )

            return reply.send({
                message:
                    'User account updated successfully.',

                user:
                    updatedUser,
            })
        },
    )

    /*
     * -----------------------------------------------------
     * ENABLE / DISABLE / UNLOCK ORGANIZATION USER
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

            const existingUser =
                await findUserSecurityRecord(
                    parsedParams.data.userId,
                )

            if (!existingUser) {
                return reply
                    .code(404)
                    .send({
                        error:
                            'User account not found.',
                    })
            }

            if (
                existingUser.accountStatus ===
                'archived'
            ) {
                return reply
                    .code(409)
                    .send({
                        error:
                            'Restore the account before changing its access.',
                    })
            }

            if (
                parsedBody.data.status ===
                'active' &&
                !existingUser.passwordHash
            ) {
                return reply
                    .code(409)
                    .send({
                        error:
                            'Set a password before enabling this account.',
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
                await revokeUserSessions(
                    existingUser.id,
                )
            }

            const updatedUser =
                await findUserAccount(
                    existingUser.id,
                )

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

    /*
     * -----------------------------------------------------
     * ARCHIVE / DELETE ORGANIZATION USER
     * -----------------------------------------------------
     *
     * This intentionally preserves employee and
     * historical organization data.
     */
    app.delete(
        '/platform/users/:userId',
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

            if (!parsedParams.success) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Invalid user account.',
                    })
            }

            const existingUser =
                await findUserSecurityRecord(
                    parsedParams.data.userId,
                )

            if (!existingUser) {
                return reply
                    .code(404)
                    .send({
                        error:
                            'User account not found.',
                    })
            }

            if (
                existingUser.accountStatus ===
                'archived'
            ) {
                return reply
                    .code(409)
                    .send({
                        error:
                            'User account is already archived.',
                    })
            }

            const now =
                new Date()

            await db
                .update(
                    users,
                )
                .set({
                    accountStatus:
                        'archived',

                    archivedAt:
                        now,

                    updatedAt:
                        now,
                })
                .where(
                    eq(
                        users.id,
                        existingUser.id,
                    ),
                )

            await revokeUserSessions(
                existingUser.id,
            )

            const archivedUser =
                await findUserAccount(
                    existingUser.id,
                )

            return reply.send({
                message:
                    'User account deleted successfully. Its history has been preserved.',

                user:
                    archivedUser,
            })
        },
    )

    /*
     * -----------------------------------------------------
     * RESTORE ORGANIZATION USER
     * -----------------------------------------------------
     *
     * Restored accounts return disabled.
     * The administrator must explicitly enable
     * access afterward.
     */
    app.post(
        '/platform/users/:userId/restore',
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

            if (!parsedParams.success) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Invalid user account.',
                    })
            }

            const existingUser =
                await findUserSecurityRecord(
                    parsedParams.data.userId,
                )

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
                'archived'
            ) {
                return reply
                    .code(409)
                    .send({
                        error:
                            'User account is not archived.',
                    })
            }

            await db
                .update(
                    users,
                )
                .set({
                    accountStatus:
                        'disabled',

                    archivedAt:
                        null,

                    updatedAt:
                        new Date(),
                })
                .where(
                    eq(
                        users.id,
                        existingUser.id,
                    ),
                )

            const restoredUser =
                await findUserAccount(
                    existingUser.id,
                )

            return reply.send({
                message:
                    'User account restored successfully. Access remains disabled until you enable it.',

                user:
                    restoredUser,
            })
        },
    )

    /*
     * -----------------------------------------------------
     * SET / RESET ORGANIZATION USER PASSWORD
     * -----------------------------------------------------
     */
    app.post(
        '/platform/users/:userId/password',
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
                updateUserPasswordSchema.safeParse(
                    request.body,
                )

            if (!parsedParams.success) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Invalid user account.',
                    })
            }

            if (!parsedBody.success) {
                return reply
                    .code(400)
                    .send({
                        error:
                            parsedBody.error
                                .issues[0]
                                ?.message ??
                            'Invalid password.',
                    })
            }

            const existingUser =
                await findUserSecurityRecord(
                    parsedParams.data.userId,
                )

            if (!existingUser) {
                return reply
                    .code(404)
                    .send({
                        error:
                            'User account not found.',
                    })
            }

            if (
                existingUser.accountStatus ===
                'archived'
            ) {
                return reply
                    .code(409)
                    .send({
                        error:
                            'Restore the account before changing its password.',
                    })
            }

            const passwordHash =
                await hashPassword(
                    parsedBody.data.password,
                )

            const now =
                new Date()

            const nextStatus =
                existingUser.accountStatus ===
                    'pending'
                    ? 'active'
                    : existingUser.accountStatus

            await db
                .update(
                    users,
                )
                .set({
                    passwordHash,

                    passwordChangedAt:
                        now,

                    accountStatus:
                        nextStatus,

                    updatedAt:
                        now,
                })
                .where(
                    eq(
                        users.id,
                        existingUser.id,
                    ),
                )

            await revokeUserSessions(
                existingUser.id,
            )

            const updatedUser =
                await findUserAccount(
                    existingUser.id,
                )

            return reply.send({
                message:
                    existingUser.accountStatus ===
                        'pending'
                        ? 'Password set successfully. The account is now active.'
                        : 'Password reset successfully. Existing sessions have been signed out.',

                user:
                    updatedUser,
            })
        },
    )
}