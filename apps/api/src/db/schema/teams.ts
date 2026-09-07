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

import { departments } from './departments.js'
import { organizations } from './organizations.js'

export const teams = pgTable(
    'teams',
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

        departmentId: uuid('department_id')
            .notNull()
            .references(
                () => departments.id,
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
            'teams_department_name_unique',
        ).on(
            table.departmentId,
            table.name,
        ),

        uniqueIndex(
            'teams_org_code_unique',
        ).on(
            table.organizationId,
            table.code,
        ),

        index(
            'teams_organization_idx',
        ).on(
            table.organizationId,
        ),

        index(
            'teams_department_idx',
        ).on(
            table.departmentId,
        ),
    ],
)