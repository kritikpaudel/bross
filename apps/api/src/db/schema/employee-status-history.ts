import { sql } from 'drizzle-orm'

import {
    date,
    index,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from 'drizzle-orm/pg-core'

import { employmentPeriods } from './employment-periods.js'
import { employmentStatuses } from './employment-statuses.js'

export const employeeStatusHistory = pgTable(
    'employee_status_history',
    {
        id: uuid('id')
            .defaultRandom()
            .primaryKey(),

        employmentPeriodId: uuid(
            'employment_period_id',
        )
            .notNull()
            .references(
                () => employmentPeriods.id,
                {
                    onDelete: 'cascade',
                },
            ),

        statusId: uuid('status_id')
            .notNull()
            .references(
                () => employmentStatuses.id,
                {
                    onDelete: 'restrict',
                },
            ),

        effectiveFrom: date('effective_from', {
            mode: 'date',
        }).notNull(),

        /*
         * Null means this is the employee's
         * current status for this employment period.
         */
        effectiveUntil: date(
            'effective_until',
            {
                mode: 'date',
            },
        ),

        note: text('note'),

        createdAt: timestamp('created_at', {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },

    (table) => [
        index(
            'employee_status_history_period_idx',
        ).on(
            table.employmentPeriodId,
        ),

        index(
            'employee_status_history_status_idx',
        ).on(
            table.statusId,
        ),

        index(
            'employee_status_history_effective_from_idx',
        ).on(
            table.effectiveFrom,
        ),

        /*
         * Only one status may remain open for
         * an employment period at a time.
         */
        uniqueIndex(
            'employee_status_history_one_open_status',
        )
            .on(
                table.employmentPeriodId,
            )
            .where(
                sql`${table.effectiveUntil} IS NULL`,
            ),
    ],
)