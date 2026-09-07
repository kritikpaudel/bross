import {
    pgTable,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core'

export const organizations = pgTable(
    'organizations',
    {
        id: uuid('id')
            .defaultRandom()
            .primaryKey(),

        name: varchar('name', {
            length: 160,
        }).notNull(),

        slug: varchar('slug', {
            length: 80,
        }).notNull(),

        timezone: varchar('timezone', {
            length: 80,
        }).notNull(),

        createdAt: timestamp(
            'created_at',
            {
                withTimezone: true,
            },
        )
            .defaultNow()
            .notNull(),

        updatedAt: timestamp(
            'updated_at',
            {
                withTimezone: true,
            },
        )
            .defaultNow()
            .notNull(),
    },
    (table) => [
        uniqueIndex(
            'organizations_slug_unique',
        ).on(table.slug),
    ],
)