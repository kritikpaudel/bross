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

export const employmentTypes = pgTable(
    'employment_types',
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
            'employment_types_org_name_unique',
        ).on(
            table.organizationId,
            table.name,
        ),

        uniqueIndex(
            'employment_types_org_code_unique',
        ).on(
            table.organizationId,
            table.code,
        ),

        index(
            'employment_types_organization_idx',
        ).on(
            table.organizationId,
        ),
    ],
)