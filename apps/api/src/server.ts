import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'

import {
    hierarchyLevelRoutes,
} from './routes/hierarchy-levels.js'

import {
    authRoutes,
} from './routes/auth.js'

import {
    databaseRoutes,
} from './routes/database.js'

import {
    healthRoutes,
} from './routes/health.js'

import {
    setupRoutes,
} from './routes/setup.js'

import {
    createTrustedOriginGuard,
    getAllowedOrigins,
} from './security/origin.js'

const app = Fastify({
    logger: true,
})

app.decorateRequest(
    'authUser',
    null,
)

/*
 * Only these frontend origins may communicate
 * with authenticated browser endpoints.
 */
const allowedOrigins =
    getAllowedOrigins()

await app.register(
    cors,
    {
        origin:
            allowedOrigins,

        credentials:
            true,

        methods: [
            'GET',
            'POST',
            'PUT',
            'PATCH',
            'DELETE',
            'OPTIONS',
        ],

        allowedHeaders: [
            'Content-Type',
        ],
    },
)

await app.register(
    cookie,
)

/*
 * CORS controls which frontend JavaScript may
 * read responses.
 *
 * This guard separately protects mutations
 * against cross-site request forgery.
 */
app.addHook(
    'onRequest',
    createTrustedOriginGuard(
        allowedOrigins,
    ),
)

await app.register(
    healthRoutes,
    {
        prefix: '/api',
    },
)

await app.register(
    databaseRoutes,
    {
        prefix: '/api',
    },
)

await app.register(
    setupRoutes,
    {
        prefix: '/api',
    },
)

await app.register(
    authRoutes,
    {
        prefix: '/api',
    },
)

await app.register(
    hierarchyLevelRoutes,
    {
        prefix: '/api',
    },
)

const host =
    '0.0.0.0'

const port =
    3000

async function start() {
    try {
        await app.listen({
            host,
            port,
        })

        console.log(
            `Bross Work OS API running at http://localhost:${port}`,
        )
    } catch (error) {
        app.log.error(
            error,
        )

        process.exit(1)
    }
}

void start()