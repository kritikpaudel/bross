import {
    index,
    pgEnum,
    pgTable,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core'

import { employees } from './employees.js'
import { organizations } from './organizations.js'

/*
 * These are security/account states,
 * not HR employment states.
 *
 * These are intentionally system-defined.
 */
export const userAccountStatusEnum = pgEnum(
    'user_account_status',
    [
        'pending',
        'active',
        'disabled',
        'locked',
    ],
)

export const users = pgTable(
    'users',
    {
        id: uuid('id')
            .defaultRandom()
            .primaryKey(),

        organizationId: uuid('organization_id')
            .notNull()
            .references(
                () => organizations.id,
                {
                    onDelete: 'cascade',
                },
            ),

        /*
         * Nullable because a system account may
         * be created before it is attached to an
         * employee profile.
         *
         * Once linked, one employee gets at most
         * one user account.
         */
        employeeId: uuid('employee_id')
            .references(
                () => employees.id,
                {
                    onDelete: 'set null',
                },
            ),

        email: varchar('email', {
            length: 254,
        }).notNull(),

        /*
         * Always store a normalized version for
         * login comparison and uniqueness.
         *
         * Example:
         * USER@BROSS.COM
         * becomes
         * user@bross.com
         *
         * The API will normalize this later.
         */
        normalizedEmail: varchar(
            'normalized_email',
            {
                length: 254,
            },
        ).notNull(),

        /*
         * Nullable while an invited account has
         * not created a password yet.
         *
         * We will never store plain passwords.
         */
        passwordHash: varchar('password_hash', {
            length: 255,
        }),

        accountStatus: userAccountStatusEnum(
            'account_status',
        )
            .default('pending')
            .notNull(),

        lastLoginAt: timestamp('last_login_at', {
            withTimezone: true,
        }),

        passwordChangedAt: timestamp(
            'password_changed_at',
            {
                withTimezone: true,
            },
        ),

        createdAt: timestamp('created_at', {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp('updated_at', {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },

    (table) => [
        uniqueIndex(
            'users_org_email_unique',
        ).on(
            table.organizationId,
            table.normalizedEmail,
        ),

        uniqueIndex(
            'users_employee_unique',
        ).on(
            table.employeeId,
        ),

        index(
            'users_organization_idx',
        ).on(
            table.organizationId,
        ),

        index(
            'users_account_status_idx',
        ).on(
            table.accountStatus,
        ),
    ],
)