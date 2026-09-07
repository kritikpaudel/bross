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

export const employmentStatuses = pgTable(
    'employment_statuses',
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
            length: 40,
        }).notNull(),

        description: text('description'),

        /*
         * Example:
         * Active employees normally allow work assignment.
         * Resigned employees normally do not.
         *
         * Nothing is pre-created.
         */
        allowsWorkAssignment: boolean(
            'allows_work_assignment',
        )
            .default(true)
            .notNull(),

        /*
         * A terminal status normally means that
         * particular employment period has ended.
         *
         * Examples could later include:
         * resigned, terminated, retired.
         */
        isTerminal: boolean('is_terminal')
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
            'employment_statuses_org_name_unique',
        ).on(
            table.organizationId,
            table.name,
        ),

        uniqueIndex(
            'employment_statuses_org_code_unique',
        ).on(
            table.organizationId,
            table.code,
        ),

        index(
            'employment_statuses_organization_idx',
        ).on(
            table.organizationId,
        ),
    ],
)