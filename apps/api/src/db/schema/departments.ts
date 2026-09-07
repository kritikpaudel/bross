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

export const departments = pgTable(
    'departments',
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
            length: 120,
        }).notNull(),

        code: varchar('code', {
            length: 30,
        }),

        description: text('description'),

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
            'departments_org_name_unique',
        ).on(
            table.organizationId,
            table.name,
        ),

        uniqueIndex(
            'departments_org_code_unique',
        ).on(
            table.organizationId,
            table.code,
        ),

        index(
            'departments_organization_idx',
        ).on(
            table.organizationId,
        ),
    ],
)