import {
    index,
    pgTable,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core'

import {
    userAccountStatusEnum,
} from './users.js'

export const platformAdmins =
    pgTable(
        'platform_admins',
        {
            id: uuid('id')
                .defaultRandom()
                .primaryKey(),

            fullName: varchar(
                'full_name',
                {
                    length: 180,
                },
            ).notNull(),

            email: varchar(
                'email',
                {
                    length: 254,
                },
            ).notNull(),

            normalizedEmail: varchar(
                'normalized_email',
                {
                    length: 254,
                },
            ).notNull(),

            passwordHash: varchar(
                'password_hash',
                {
                    length: 255,
                },
            ).notNull(),

            accountStatus:
                userAccountStatusEnum(
                    'account_status',
                )
                    .default('active')
                    .notNull(),

            lastLoginAt: timestamp(
                'last_login_at',
                {
                    withTimezone: true,
                },
            ),

            passwordChangedAt:
                timestamp(
                    'password_changed_at',
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

            updatedAt: timestamp(
                'updated_at',
                {
                    withTimezone: true,
                },
            )
                .defaultNow()
                .notNull(),
        },

        (table) => [
            uniqueIndex(
                'platform_admins_email_unique',
            ).on(
                table.normalizedEmail,
            ),

            index(
                'platform_admins_status_idx',
            ).on(
                table.accountStatus,
            ),
        ],
    )