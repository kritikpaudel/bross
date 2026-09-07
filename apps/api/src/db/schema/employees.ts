import {
    index,
    pgTable,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core'

import { organizations } from './organizations.js'

export const employees = pgTable(
    'employees',
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
         * Bross-controlled employee identifier.
         *
         * Nothing is generated automatically yet.
         * You will enter/create this through the UI.
         */
        employeeNumber: varchar('employee_number', {
            length: 50,
        }).notNull(),

        /*
         * We keep the identity model flexible.
         * Job title/designation does NOT belong here.
         */
        fullName: varchar('full_name', {
            length: 180,
        }).notNull(),

        preferredName: varchar('preferred_name', {
            length: 120,
        }),

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
            'employees_org_employee_number_unique',
        ).on(
            table.organizationId,
            table.employeeNumber,
        ),

        index(
            'employees_organization_idx',
        ).on(
            table.organizationId,
        ),

        index(
            'employees_full_name_idx',
        ).on(
            table.fullName,
        ),
    ],
)