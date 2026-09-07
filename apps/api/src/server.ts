import Fastify from 'fastify'
import cors from '@fastify/cors'

import { databaseRoutes } from './routes/database.js'
import { healthRoutes } from './routes/health.js'
import { setupRoutes } from './routes/setup.js'

const app = Fastify({
    logger: true,
})

await app.register(cors, {
    origin: true,
    credentials: true,
})

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

const host = '0.0.0.0'
const port = 3000

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
        app.log.error(error)

        process.exit(1)
    }
}

void start()