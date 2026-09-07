import {
    index,
    pgTable,
    timestamp,
    uniqueIndex,
    uuid,
} from 'drizzle-orm/pg-core'

import { roles } from './roles.js'
import { users } from './users.js'

export const userRoles = pgTable(
    'user_roles',
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

        roleId: uuid('role_id')
            .notNull()
            .references(
                () => roles.id,
                {
                    onDelete: 'cascade',
                },
            ),

        assignedAt: timestamp('assigned_at', {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },

    (table) => [
        uniqueIndex(
            'user_roles_unique',
        ).on(
            table.userId,
            table.roleId,
        ),

        index(
            'user_roles_user_idx',
        ).on(
            table.userId,
        ),

        index(
            'user_roles_role_idx',
        ).on(
            table.roleId,
        ),
    ],
)