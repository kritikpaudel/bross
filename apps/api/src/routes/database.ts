import type { FastifyInstance } from 'fastify'

import { pool } from '../db/index.js'

export async function databaseRoutes(
    app: FastifyInstance,
) {
    app.get('/database', async () => {
        const result = await pool.query(
            'SELECT current_database(), current_user',
        )

        return {
            status: 'connected',
            database: result.rows[0]?.current_database,
            user: result.rows[0]?.current_user,
        }
    })
}