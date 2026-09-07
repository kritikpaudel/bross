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

import { employees } from './employees.js'

export const employmentPeriods = pgTable(
    'employment_periods',
    {
        id: uuid('id')
            .defaultRandom()
            .primaryKey(),

        employeeId: uuid('employee_id')
            .notNull()
            .references(
                () => employees.id,
                {
                    onDelete: 'cascade',
                },
            ),

        /*
         * Actual employment start date.
         *
         * A rehired employee receives another
         * employment period rather than another
         * unrelated employee identity.
         */
        startedOn: date('started_on', {
            mode: 'date',
        }).notNull(),

        /*
         * Null means this employment period
         * has not ended yet.
         */
        endedOn: date('ended_on', {
            mode: 'date',
        }),

        /*
         * Useful for resignation / notice period.
         */
        noticeSubmittedOn: date(
            'notice_submitted_on',
            {
                mode: 'date',
            },
        ),

        lastWorkingDay: date(
            'last_working_day',
            {
                mode: 'date',
            },
        ),

        notes: text('notes'),

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
        index(
            'employment_periods_employee_idx',
        ).on(
            table.employeeId,
        ),

        index(
            'employment_periods_started_on_idx',
        ).on(
            table.startedOn,
        ),

        /*
         * Only one employment period may remain
         * open for an employee at a time.
         */
        uniqueIndex(
            'employment_periods_one_open_period',
        )
            .on(
                table.employeeId,
            )
            .where(
                sql`${table.endedOn} IS NULL`,
            ),
    ],
)