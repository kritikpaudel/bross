import 'fastify'

import type {
    AuthenticatedUser,
} from '../security/auth-context.js'

declare module 'fastify' {
    interface FastifyRequest {
        authUser:
        AuthenticatedUser | null
    }
}