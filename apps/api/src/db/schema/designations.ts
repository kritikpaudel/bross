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

export const designations = pgTable(
    'designations',
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
         * Optional.
         *
         * If null, the designation can be used
         * across the organization.
         *
         * If set, it belongs to a specific
         * department.
         */
        departmentId: uuid('department_id')
            .references(
                () => departments.id,
                {
                    onDelete: 'set null',
                },
            ),

        name: varchar('name', {
            length: 120,
        }).notNull(),

        /*
         * Short internal identifier.
         *
         * Example later:
         * UIUX
         * DEV
         * OPS-MGR
         *
         * Nothing is pre-created.
         */
        code: varchar('code', {
            length: 40,
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
            'designations_org_code_unique',
        ).on(
            table.organizationId,
            table.code,
        ),

        index(
            'designations_organization_idx',
        ).on(
            table.organizationId,
        ),

        index(
            'designations_department_idx',
        ).on(
            table.departmentId,
        ),

        index(
            'designations_name_idx',
        ).on(
            table.name,
        ),
    ],
)