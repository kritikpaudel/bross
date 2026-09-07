import type {
    FastifyInstance,
} from 'fastify'

import { sql } from 'drizzle-orm'

import {
    db,
} from '../db/index.js'

import {
    requireAuthentication,
    requirePermission,
} from '../security/guards.js'

export async function databaseRoutes(
    app: FastifyInstance,
) {
    app.get(
        '/database',
        {
            preHandler: [
                requireAuthentication,

                requirePermission(
                    'system.full_access',
                ),
            ],
        },
        async () => {
            const result =
                await db.execute(
                    sql`
            SELECT
              current_database(),
              current_user
          `,
                )

            const row =
                result.rows[0]

            return {
                connected: true,

                database:
                    row?.current_database,

                user:
                    row?.current_user,
            }
        },
    )
}