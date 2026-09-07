import {
    index,
    pgTable,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core'

import { users } from './users.js'

export const sessions = pgTable(
    'sessions',
    {
        id: uuid('id')
            .defaultRandom()
            .primaryKey(),

        userId: uuid('user_id')
            .notNull()
            .references(
                () => users.id,
                {
                    onDelete: 'cascade',
                },
            ),

        /*
         * We never store the raw session token.
         * Only its SHA-256 hash is stored.
         */
        tokenHash: varchar('token_hash', {
            length: 64,
        }).notNull(),

        expiresAt: timestamp('expires_at', {
            withTimezone: true,
        }).notNull(),

        lastSeenAt: timestamp('last_seen_at', {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),

        revokedAt: timestamp('revoked_at', {
            withTimezone: true,
        }),

        createdAt: timestamp('created_at', {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },

    (table) => [
        uniqueIndex(
            'sessions_token_hash_unique',
        ).on(
            table.tokenHash,
        ),

        index(
            'sessions_user_idx',
        ).on(
            table.userId,
        ),

        index(
            'sessions_expires_at_idx',
        ).on(
            table.expiresAt,
        ),

        index(
            'sessions_revoked_at_idx',
        ).on(
            table.revokedAt,
        ),
    ],
)