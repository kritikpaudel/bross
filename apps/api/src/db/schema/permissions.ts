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

export const permissions = pgTable(
    'permissions',
    {
        id: uuid('id')
            .defaultRandom()
            .primaryKey(),

        /*
         * Stable machine-readable capability.
         *
         * Examples later:
         * employee.view
         * employee.create
         * employee.edit
         * task.assign
         */
        code: varchar('code', {
            length: 120,
        }).notNull(),

        name: varchar('name', {
            length: 140,
        }).notNull(),

        description: text('description'),

        /*
         * Used for organizing permissions in
         * the admin UI later.
         *
         * Example:
         * people
         * projects
         * tasks
         * administration
         */
        category: varchar('category', {
            length: 80,
        }).notNull(),

        /*
         * Some permissions are meaningful with
         * scopes while others are simply yes/no.
         *
         * Example:
         * employee.view → scoped
         * organization.settings.manage → not scoped
         */
        supportsScope: boolean('supports_scope')
            .default(false)
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
            'permissions_code_unique',
        ).on(
            table.code,
        ),

        index(
            'permissions_category_idx',
        ).on(
            table.category,
        ),
    ],
)