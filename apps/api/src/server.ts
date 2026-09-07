import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'

import {
    authRoutes,
} from './routes/auth.js'

import {
    platformAuthRoutes,
} from './routes/platform-auth.js'

import {
    platformManagementRoutes,
} from './routes/platform-management.js'

import {
    databaseRoutes,
} from './routes/database.js'

import {
    healthRoutes,
} from './routes/health.js'

import {
    hierarchyLevelRoutes,
} from './routes/hierarchy-levels.js'

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
    authRoutes,
    {
        prefix: '/api',
    },
)

await app.register(
    platformAuthRoutes,
    {
        prefix: '/api',
    },
)

await app.register(
    platformManagementRoutes,
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
    Number(
        process.env.PORT ??
        3000,
    )

async function start() {
    try {
        await app.listen({
            host,
            port,
        })

        console.log(
            `API running on port ${port}`,
        )
    } catch (error) {
        app.log.error(
            error,
        )

        process.exit(1)
    }
}

void start()