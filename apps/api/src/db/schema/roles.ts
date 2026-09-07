import {
    boolean,
    index,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core'

import { organizations } from './organizations.js'

export const roles = pgTable(
    'roles',
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

        name: varchar('name', {
            length: 100,
        }).notNull(),

        /*
         * Internal code.
         *
         * Example later:
         * owner
         * administrator
         * supervisor
         *
         * Nothing is inserted automatically yet.
         */
        code: varchar('code', {
            length: 60,
        }).notNull(),

        description: text('description'),

        /*
         * System roles may later be protected from
         * accidental deletion while still allowing
         * us to edit their permissions.
         */
        isSystem: boolean('is_system')
            .default(false)
            .notNull(),

        isActive: boolean('is_active')
            .default(true)
            .notNull(),

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
            'roles_org_name_unique',
        ).on(
            table.organizationId,
            table.name,
        ),

        uniqueIndex(
            'roles_org_code_unique',
        ).on(
            table.organizationId,
            table.code,
        ),

        index(
            'roles_organization_idx',
        ).on(
            table.organizationId,
        ),
    ],
)