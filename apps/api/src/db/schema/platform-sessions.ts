import {
    index,
    pgTable,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core'

import {
    platformAdmins,
} from './platform-admins.js'

export const platformSessions =
    pgTable(
        'platform_sessions',
        {
            id: uuid('id')
                .defaultRandom()
                .primaryKey(),

            platformAdminId: uuid(
                'platform_admin_id',
            )
                .notNull()
                .references(
                    () =>
                        platformAdmins.id,
                    {
                        onDelete:
                            'cascade',
                    },
                ),

            tokenHash: varchar(
                'token_hash',
                {
                    length: 64,
                },
            ).notNull(),

            expiresAt: timestamp(
                'expires_at',
                {
                    withTimezone: true,
                },
            ).notNull(),

            lastSeenAt: timestamp(
                'last_seen_at',
                {
                    withTimezone: true,
                },
            )
                .defaultNow()
                .notNull(),

            revokedAt: timestamp(
                'revoked_at',
                {
                    withTimezone: true,
                },
            ),

            createdAt: timestamp(
                'created_at',
                {
                    withTimezone: true,
                },
            )
                .defaultNow()
                .notNull(),
        },

        (table) => [
            uniqueIndex(
                'platform_sessions_token_hash_unique',
            ).on(
                table.tokenHash,
            ),

            index(
                'platform_sessions_admin_idx',
            ).on(
                table.platformAdminId,
            ),

            index(
                'platform_sessions_expires_at_idx',
            ).on(
                table.expiresAt,
            ),

            index(
                'platform_sessions_revoked_at_idx',
            ).on(
                table.revokedAt,
            ),
        ],
    )