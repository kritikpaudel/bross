import { sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { db } from '../db/index.js'

import {
    organizations,
    permissions,
    rolePermissions,
    roles,
    userRoles,
    users,
} from '../db/schema/index.js'

import { hashPassword } from '../security/password.js'

const setupSchema = z.object({
    organizationName: z
        .string()
        .trim()
        .min(2)
        .max(160),

    organizationSlug: z
        .string()
        .trim()
        .min(2)
        .max(80)
        .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            'Slug must contain only lowercase letters, numbers and hyphens.',
        ),

    timezone: z
        .string()
        .trim()
        .min(1)
        .max(80),

    email: z
        .string()
        .trim()
        .email()
        .max(254),

    password: z
        .string()
        .min(12)
        .max(128),
})

function isValidTimezone(
    timezone: string,
) {
    try {
        new Intl.DateTimeFormat(
            'en-US',
            {
                timeZone: timezone,
            },
        ).format()

        return true
    } catch {
        return false
    }
}

export async function setupRoutes(
    app: FastifyInstance,
) {
    /*
     * Used by the frontend to decide whether
     * first-run setup should be displayed.
     */
    app.get(
        '/setup/status',
        async () => {
            const existingOrganization =
                await db
                    .select({
                        id: organizations.id,
                    })
                    .from(organizations)
                    .limit(1)

            return {
                configured:
                    existingOrganization.length > 0,
            }
        },
    )

    /*
     * This endpoint is valid only once:
     * when no organization exists.
     */
    app.post(
        '/setup',
        async (
            request,
            reply,
        ) => {
            const parsed =
                setupSchema.safeParse(
                    request.body,
                )

            if (!parsed.success) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Invalid setup information.',

                        issues:
                            parsed.error.issues.map(
                                (issue) => ({
                                    path:
                                        issue.path.join('.'),

                                    message:
                                        issue.message,
                                }),
                            ),
                    })
            }

            const input = parsed.data

            if (
                !isValidTimezone(
                    input.timezone,
                )
            ) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Invalid timezone.',
                    })
            }

            const normalizedEmail =
                input.email.toLowerCase()

            const passwordHash =
                await hashPassword(
                    input.password,
                )

            const result =
                await db.transaction(
                    async (tx) => {
                        /*
                         * Prevent two simultaneous setup
                         * requests from creating two first
                         * organizations.
                         */
                        await tx.execute(
                            sql`
                SELECT pg_advisory_xact_lock(
                  730921001
                )
              `,
                        )

                        const existingOrganization =
                            await tx
                                .select({
                                    id: organizations.id,
                                })
                                .from(
                                    organizations,
                                )
                                .limit(1)

                        if (
                            existingOrganization.length >
                            0
                        ) {
                            return {
                                alreadyConfigured: true,
                            } as const
                        }

                        const [
                            organization,
                        ] = await tx
                            .insert(
                                organizations,
                            )
                            .values({
                                name:
                                    input.organizationName,

                                slug:
                                    input.organizationSlug,

                                timezone:
                                    input.timezone,
                            })
                            .returning({
                                id: organizations.id,
                                name: organizations.name,
                            })

                        if (!organization) {
                            throw new Error(
                                'Failed to create organization.',
                            )
                        }

                        /*
                         * This is system/reference data,
                         * not demo business data.
                         *
                         * The permission represents complete
                         * initial-instance authority.
                         */
                        const [
                            fullAccessPermission,
                        ] = await tx
                            .insert(
                                permissions,
                            )
                            .values({
                                code:
                                    'system.full_access',

                                name:
                                    'Full system access',

                                description:
                                    'Allows unrestricted access to the organization.',

                                category:
                                    'administration',

                                supportsScope:
                                    false,
                            })
                            .onConflictDoUpdate({
                                target:
                                    permissions.code,

                                set: {
                                    name:
                                        'Full system access',

                                    description:
                                        'Allows unrestricted access to the organization.',

                                    category:
                                        'administration',

                                    supportsScope:
                                        false,
                                },
                            })
                            .returning({
                                id: permissions.id,
                            })

                        if (
                            !fullAccessPermission
                        ) {
                            throw new Error(
                                'Failed to create system permission.',
                            )
                        }

                        const [
                            ownerRole,
                        ] = await tx
                            .insert(
                                roles,
                            )
                            .values({
                                organizationId:
                                    organization.id,

                                name:
                                    'Owner',

                                code:
                                    'owner',

                                description:
                                    'Primary organization owner.',

                                isSystem:
                                    true,

                                isActive:
                                    true,
                            })
                            .returning({
                                id: roles.id,
                            })

                        if (!ownerRole) {
                            throw new Error(
                                'Failed to create owner role.',
                            )
                        }

                        await tx.insert(
                            rolePermissions,
                        ).values({
                            roleId:
                                ownerRole.id,

                            permissionId:
                                fullAccessPermission.id,

                            scope: null,
                        })

                        const [
                            user,
                        ] = await tx
                            .insert(
                                users,
                            )
                            .values({
                                organizationId:
                                    organization.id,

                                email:
                                    input.email,

                                normalizedEmail,

                                passwordHash,

                                accountStatus:
                                    'active',

                                passwordChangedAt:
                                    new Date(),
                            })
                            .returning({
                                id: users.id,
                                email: users.email,
                            })

                        if (!user) {
                            throw new Error(
                                'Failed to create administrator.',
                            )
                        }

                        await tx.insert(
                            userRoles,
                        ).values({
                            userId:
                                user.id,

                            roleId:
                                ownerRole.id,
                        })

                        return {
                            alreadyConfigured:
                                false,

                            organization,

                            user,
                        } as const
                    },
                )

            if (
                result.alreadyConfigured
            ) {
                return reply
                    .code(409)
                    .send({
                        error:
                            'Bross Work OS has already been configured.',
                    })
            }

            return reply
                .code(201)
                .send({
                    configured: true,

                    organization:
                        result.organization,

                    administrator: {
                        id:
                            result.user.id,

                        email:
                            result.user.email,
                    },
                })
        },
    )
}