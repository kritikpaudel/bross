import {
    pgEnum,
    pgTable,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core'

export const organizationStatusEnum =
    pgEnum(
        'organization_status',
        [
            'active',
            'suspended',
            'archived',
        ],
    )

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

        logoUrl: varchar('logo_url', {
            length: 500,
        }),

        timezone: varchar('timezone', {
            length: 80,
        }).notNull(),

        status:
            organizationStatusEnum(
                'status',
            )
                .default('active')
                .notNull(),

        archivedAt: timestamp(
            'archived_at',
            {
                withTimezone: true,
            },
        ),

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