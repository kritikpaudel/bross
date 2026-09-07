import {
    and,
    asc,
    eq,
    max,
    ne,
    sql,
} from 'drizzle-orm'

import type {
    FastifyInstance,
} from 'fastify'

import { z } from 'zod'

import {
    db,
} from '../db/index.js'

import {
    hierarchyLevels,
} from '../db/schema/index.js'

import {
    requireAuthentication,
    requirePermission,
} from '../security/guards.js'

const createHierarchyLevelSchema =
    z.object({
        name: z
            .string()
            .trim()
            .min(2)
            .max(120),

        description: z
            .string()
            .trim()
            .max(1000)
            .nullable()
            .optional(),

        isGovernance: z
            .boolean()
            .optional(),
    })

const updateHierarchyLevelSchema =
    z
        .object({
            name: z
                .string()
                .trim()
                .min(2)
                .max(120)
                .optional(),

            description: z
                .string()
                .trim()
                .max(1000)
                .nullable()
                .optional(),

            isGovernance: z
                .boolean()
                .optional(),

            isActive: z
                .boolean()
                .optional(),
        })
        .refine(
            (value) =>
                Object.keys(value).length >
                0,
            {
                message:
                    'At least one field must be provided.',
            },
        )

const hierarchyLevelParamsSchema =
    z.object({
        id: z.string().uuid(),
    })

const reorderHierarchyLevelsSchema =
    z.object({
        levelIds: z
            .array(
                z.string().uuid(),
            )
            .min(1),
    })

export async function hierarchyLevelRoutes(
    app: FastifyInstance,
) {
    /*
     * -----------------------------------------------------
     * LIST
     * -----------------------------------------------------
     */
    app.get(
        '/organization/hierarchy-levels',
        {
            preHandler: [
                requireAuthentication,

                requirePermission(
                    'organization.structure.manage',
                ),
            ],
        },
        async (
            request,
            reply,
        ) => {
            if (!request.authUser) {
                return reply
                    .code(401)
                    .send({
                        error:
                            'Authentication required.',
                    })
            }

            const organizationId =
                request.authUser
                    .organization.id

            const levels =
                await db
                    .select({
                        id:
                            hierarchyLevels.id,

                        name:
                            hierarchyLevels.name,

                        description:
                            hierarchyLevels.description,

                        position:
                            hierarchyLevels.position,

                        isGovernance:
                            hierarchyLevels.isGovernance,

                        isActive:
                            hierarchyLevels.isActive,

                        createdAt:
                            hierarchyLevels.createdAt,

                        updatedAt:
                            hierarchyLevels.updatedAt,
                    })
                    .from(
                        hierarchyLevels,
                    )
                    .where(
                        eq(
                            hierarchyLevels.organizationId,
                            organizationId,
                        ),
                    )
                    .orderBy(
                        asc(
                            hierarchyLevels.position,
                        ),
                    )

            return {
                levels,
            }
        },
    )

    /*
     * -----------------------------------------------------
     * CREATE
     * -----------------------------------------------------
     */
    app.post(
        '/organization/hierarchy-levels',
        {
            preHandler: [
                requireAuthentication,

                requirePermission(
                    'organization.structure.manage',
                ),
            ],
        },
        async (
            request,
            reply,
        ) => {
            if (!request.authUser) {
                return reply
                    .code(401)
                    .send({
                        error:
                            'Authentication required.',
                    })
            }

            const parsed =
                createHierarchyLevelSchema
                    .safeParse(
                        request.body,
                    )

            if (!parsed.success) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Invalid hierarchy level information.',

                        issues:
                            parsed.error.issues.map(
                                (issue) => ({
                                    path:
                                        issue.path.join(
                                            '.',
                                        ),

                                    message:
                                        issue.message,
                                }),
                            ),
                    })
            }

            const organizationId =
                request.authUser
                    .organization.id

            const input =
                parsed.data

            /*
             * Keep names unique regardless of case.
             *
             * This prevents both:
             *
             * Employee
             * employee
             *
             * from being created as separate levels.
             */
            const [
                existingName,
            ] =
                await db
                    .select({
                        id:
                            hierarchyLevels.id,
                    })
                    .from(
                        hierarchyLevels,
                    )
                    .where(
                        and(
                            eq(
                                hierarchyLevels.organizationId,
                                organizationId,
                            ),

                            sql`
                lower(
                  ${hierarchyLevels.name}
                )
                =
                lower(
                  ${input.name}
                )
              `,
                        ),
                    )
                    .limit(1)

            if (existingName) {
                return reply
                    .code(409)
                    .send({
                        error:
                            'A hierarchy level with this name already exists.',
                    })
            }

            const [
                positionResult,
            ] =
                await db
                    .select({
                        highestPosition:
                            max(
                                hierarchyLevels.position,
                            ),
                    })
                    .from(
                        hierarchyLevels,
                    )
                    .where(
                        eq(
                            hierarchyLevels.organizationId,
                            organizationId,
                        ),
                    )

            const nextPosition =
                (
                    positionResult
                        ?.highestPosition ??
                    0
                ) + 10

            const [level] =
                await db
                    .insert(
                        hierarchyLevels,
                    )
                    .values({
                        organizationId,

                        name:
                            input.name,

                        description:
                            input.description ??
                            null,

                        position:
                            nextPosition,

                        isGovernance:
                            input.isGovernance ??
                            false,

                        isActive:
                            true,
                    })
                    .returning({
                        id:
                            hierarchyLevels.id,

                        name:
                            hierarchyLevels.name,

                        description:
                            hierarchyLevels.description,

                        position:
                            hierarchyLevels.position,

                        isGovernance:
                            hierarchyLevels.isGovernance,

                        isActive:
                            hierarchyLevels.isActive,

                        createdAt:
                            hierarchyLevels.createdAt,

                        updatedAt:
                            hierarchyLevels.updatedAt,
                    })

            if (!level) {
                throw new Error(
                    'Failed to create hierarchy level.',
                )
            }

            return reply
                .code(201)
                .send({
                    level,
                })
        },
    )

    /*
     * -----------------------------------------------------
     * UPDATE
     * -----------------------------------------------------
     */
    app.patch(
        '/organization/hierarchy-levels/:id',
        {
            preHandler: [
                requireAuthentication,

                requirePermission(
                    'organization.structure.manage',
                ),
            ],
        },
        async (
            request,
            reply,
        ) => {
            if (!request.authUser) {
                return reply
                    .code(401)
                    .send({
                        error:
                            'Authentication required.',
                    })
            }

            const parsedParams =
                hierarchyLevelParamsSchema
                    .safeParse(
                        request.params,
                    )

            if (
                !parsedParams.success
            ) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Invalid hierarchy level ID.',
                    })
            }

            const parsedBody =
                updateHierarchyLevelSchema
                    .safeParse(
                        request.body,
                    )

            if (
                !parsedBody.success
            ) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Invalid hierarchy level information.',

                        issues:
                            parsedBody.error
                                .issues.map(
                                    (issue) => ({
                                        path:
                                            issue.path.join(
                                                '.',
                                            ),

                                        message:
                                            issue.message,
                                    }),
                                ),
                    })
            }

            const organizationId =
                request.authUser
                    .organization.id

            const levelId =
                parsedParams.data.id

            const input =
                parsedBody.data

            const [
                existingLevel,
            ] =
                await db
                    .select({
                        id:
                            hierarchyLevels.id,
                    })
                    .from(
                        hierarchyLevels,
                    )
                    .where(
                        and(
                            eq(
                                hierarchyLevels.id,
                                levelId,
                            ),

                            eq(
                                hierarchyLevels.organizationId,
                                organizationId,
                            ),
                        ),
                    )
                    .limit(1)

            if (!existingLevel) {
                return reply
                    .code(404)
                    .send({
                        error:
                            'Hierarchy level not found.',
                    })
            }

            if (input.name) {
                const [
                    duplicateName,
                ] =
                    await db
                        .select({
                            id:
                                hierarchyLevels.id,
                        })
                        .from(
                            hierarchyLevels,
                        )
                        .where(
                            and(
                                eq(
                                    hierarchyLevels.organizationId,
                                    organizationId,
                                ),

                                ne(
                                    hierarchyLevels.id,
                                    levelId,
                                ),

                                sql`
                  lower(
                    ${hierarchyLevels.name}
                  )
                  =
                  lower(
                    ${input.name}
                  )
                `,
                            ),
                        )
                        .limit(1)

                if (duplicateName) {
                    return reply
                        .code(409)
                        .send({
                            error:
                                'A hierarchy level with this name already exists.',
                        })
                }
            }

            const updateValues: {
                name?: string
                description?: string | null
                isGovernance?: boolean
                isActive?: boolean
                updatedAt: Date
            } = {
                updatedAt:
                    new Date(),
            }

            if (
                input.name !==
                undefined
            ) {
                updateValues.name =
                    input.name
            }

            if (
                input.description !==
                undefined
            ) {
                updateValues.description =
                    input.description
            }

            if (
                input.isGovernance !==
                undefined
            ) {
                updateValues.isGovernance =
                    input.isGovernance
            }

            if (
                input.isActive !==
                undefined
            ) {
                updateValues.isActive =
                    input.isActive
            }

            const [updatedLevel] =
                await db
                    .update(
                        hierarchyLevels,
                    )
                    .set(
                        updateValues,
                    )
                    .where(
                        and(
                            eq(
                                hierarchyLevels.id,
                                levelId,
                            ),

                            eq(
                                hierarchyLevels.organizationId,
                                organizationId,
                            ),
                        ),
                    )
                    .returning({
                        id:
                            hierarchyLevels.id,

                        name:
                            hierarchyLevels.name,

                        description:
                            hierarchyLevels.description,

                        position:
                            hierarchyLevels.position,

                        isGovernance:
                            hierarchyLevels.isGovernance,

                        isActive:
                            hierarchyLevels.isActive,

                        createdAt:
                            hierarchyLevels.createdAt,

                        updatedAt:
                            hierarchyLevels.updatedAt,
                    })

            if (!updatedLevel) {
                throw new Error(
                    'Failed to update hierarchy level.',
                )
            }

            return {
                level:
                    updatedLevel,
            }
        },
    )

    /*
     * -----------------------------------------------------
     * REORDER
     * -----------------------------------------------------
     */
    app.put(
        '/organization/hierarchy-levels/order',
        {
            preHandler: [
                requireAuthentication,

                requirePermission(
                    'organization.structure.manage',
                ),
            ],
        },
        async (
            request,
            reply,
        ) => {
            if (!request.authUser) {
                return reply
                    .code(401)
                    .send({
                        error:
                            'Authentication required.',
                    })
            }

            const parsed =
                reorderHierarchyLevelsSchema
                    .safeParse(
                        request.body,
                    )

            if (!parsed.success) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Invalid hierarchy order.',
                    })
            }

            const organizationId =
                request.authUser
                    .organization.id

            const requestedIds =
                parsed.data.levelIds

            /*
             * Reject duplicate IDs.
             */
            const uniqueIds =
                new Set(
                    requestedIds,
                )

            if (
                uniqueIds.size !==
                requestedIds.length
            ) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Hierarchy order contains duplicate levels.',
                    })
            }

            const existingLevels =
                await db
                    .select({
                        id:
                            hierarchyLevels.id,

                        position:
                            hierarchyLevels.position,
                    })
                    .from(
                        hierarchyLevels,
                    )
                    .where(
                        eq(
                            hierarchyLevels.organizationId,
                            organizationId,
                        ),
                    )

            /*
             * Reordering must contain the complete
             * hierarchy. We don't silently lose or
             * append levels.
             */
            if (
                existingLevels.length !==
                requestedIds.length
            ) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Hierarchy order must contain every hierarchy level.',
                    })
            }

            const existingIds =
                new Set(
                    existingLevels.map(
                        (level) =>
                            level.id,
                    ),
                )

            const containsUnknownId =
                requestedIds.some(
                    (id) =>
                        !existingIds.has(
                            id,
                        ),
                )

            if (containsUnknownId) {
                return reply
                    .code(400)
                    .send({
                        error:
                            'Hierarchy order contains an unknown level.',
                    })
            }

            await db.transaction(
                async (tx) => {
                    /*
                     * Position has a unique constraint.
                     *
                     * First move every level to temporary
                     * negative positions so swapping two
                     * existing positions cannot violate
                     * uniqueness halfway through.
                     */
                    for (
                        let index = 0;
                        index <
                        requestedIds.length;
                        index += 1
                    ) {
                        const id =
                            requestedIds[
                            index
                            ]

                        if (!id) {
                            continue
                        }

                        await tx
                            .update(
                                hierarchyLevels,
                            )
                            .set({
                                position:
                                    -(
                                        index +
                                        1
                                    ),

                                updatedAt:
                                    new Date(),
                            })
                            .where(
                                and(
                                    eq(
                                        hierarchyLevels.id,
                                        id,
                                    ),

                                    eq(
                                        hierarchyLevels.organizationId,
                                        organizationId,
                                    ),
                                ),
                            )
                    }

                    /*
                     * Smaller number = higher authority.
                     *
                     * Use spacing of 10 so future ordering
                     * changes have room if we need it.
                     */
                    for (
                        let index = 0;
                        index <
                        requestedIds.length;
                        index += 1
                    ) {
                        const id =
                            requestedIds[
                            index
                            ]

                        if (!id) {
                            continue
                        }

                        await tx
                            .update(
                                hierarchyLevels,
                            )
                            .set({
                                position:
                                    (
                                        index +
                                        1
                                    ) *
                                    10,

                                updatedAt:
                                    new Date(),
                            })
                            .where(
                                and(
                                    eq(
                                        hierarchyLevels.id,
                                        id,
                                    ),

                                    eq(
                                        hierarchyLevels.organizationId,
                                        organizationId,
                                    ),
                                ),
                            )
                    }
                },
            )

            const levels =
                await db
                    .select({
                        id:
                            hierarchyLevels.id,

                        name:
                            hierarchyLevels.name,

                        description:
                            hierarchyLevels.description,

                        position:
                            hierarchyLevels.position,

                        isGovernance:
                            hierarchyLevels.isGovernance,

                        isActive:
                            hierarchyLevels.isActive,

                        createdAt:
                            hierarchyLevels.createdAt,

                        updatedAt:
                            hierarchyLevels.updatedAt,
                    })
                    .from(
                        hierarchyLevels,
                    )
                    .where(
                        eq(
                            hierarchyLevels.organizationId,
                            organizationId,
                        ),
                    )
                    .orderBy(
                        asc(
                            hierarchyLevels.position,
                        ),
                    )

            return {
                levels,
            }
        },
    )
}