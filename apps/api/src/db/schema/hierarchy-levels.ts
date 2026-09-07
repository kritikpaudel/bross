import {
    boolean,
    index,
    integer,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core'

import { organizations } from './organizations.js'

export const hierarchyLevels = pgTable(
    'hierarchy_levels',
    {
        id: uuid('id')
            .defaultRandom()
            .primaryKey(),

        organizationId: uuid(
            'organization_id',
        )
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

        /*
         * Smaller number = higher level.
         *
         * Example:
         * 10 Board
         * 20 CEO
         * 30 DCEO
         *
         * We use gaps instead of 1,2,3 so that
         * levels can later be inserted between them.
         */
        position: integer(
            'position',
        ).notNull(),

        description: text(
            'description',
        ),

        /*
         * Governance positions such as Board
         * Directors may sit above operational
         * management without automatically
         * receiving operational permissions.
         */
        isGovernance: boolean(
            'is_governance',
        )
            .default(false)
            .notNull(),

        isActive: boolean(
            'is_active',
        )
            .default(true)
            .notNull(),

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
            'hierarchy_levels_org_position_unique',
        ).on(
            table.organizationId,
            table.position,
        ),

        uniqueIndex(
            'hierarchy_levels_org_name_unique',
        ).on(
            table.organizationId,
            table.name,
        ),

        index(
            'hierarchy_levels_organization_idx',
        ).on(
            table.organizationId,
        ),
    ],
)