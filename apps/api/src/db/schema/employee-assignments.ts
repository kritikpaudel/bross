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

import { departments } from './departments.js'
import { designations } from './designations.js'
import { employees } from './employees.js'
import { employmentTypes } from './employment-types.js'
import { hierarchyLevels } from './hierarchy-levels.js'
import { teams } from './teams.js'

export const employeeAssignments = pgTable(
    'employee_assignments',
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
         * Nullable intentionally.
         *
         * Executives or governance members may
         * not belong to a normal department.
         */
        departmentId: uuid('department_id')
            .references(
                () => departments.id,
                {
                    onDelete: 'set null',
                },
            ),

        teamId: uuid('team_id')
            .references(
                () => teams.id,
                {
                    onDelete: 'set null',
                },
            ),

        designationId: uuid('designation_id')
            .references(
                () => designations.id,
                {
                    onDelete: 'set null',
                },
            ),

        hierarchyLevelId: uuid(
            'hierarchy_level_id',
        )
            .references(
                () => hierarchyLevels.id,
                {
                    onDelete: 'set null',
                },
            ),

        employmentTypeId: uuid(
            'employment_type_id',
        )
            .references(
                () => employmentTypes.id,
                {
                    onDelete: 'set null',
                },
            ),

        /*
         * Direct organizational reporting line.
         *
         * Project reporting will be handled
         * separately later.
         */
        reportsToEmployeeId: uuid(
            'reports_to_employee_id',
        )
            .references(
                () => employees.id,
                {
                    onDelete: 'set null',
                },
            ),

        /*
         * Assignment becomes valid from this date.
         */
        effectiveFrom: date('effective_from', {
            mode: 'date',
        }).notNull(),

        /*
         * Null = latest/open assignment.
         *
         * When someone transfers/promotes,
         * this assignment gets an end date
         * and a new assignment is created.
         */
        effectiveUntil: date(
            'effective_until',
            {
                mode: 'date',
            },
        ),

        changeNote: text('change_note'),

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
            'employee_assignments_employee_idx',
        ).on(
            table.employeeId,
        ),

        index(
            'employee_assignments_department_idx',
        ).on(
            table.departmentId,
        ),

        index(
            'employee_assignments_team_idx',
        ).on(
            table.teamId,
        ),

        index(
            'employee_assignments_designation_idx',
        ).on(
            table.designationId,
        ),

        index(
            'employee_assignments_hierarchy_idx',
        ).on(
            table.hierarchyLevelId,
        ),

        index(
            'employee_assignments_manager_idx',
        ).on(
            table.reportsToEmployeeId,
        ),

        index(
            'employee_assignments_effective_from_idx',
        ).on(
            table.effectiveFrom,
        ),

        /*
         * An employee can have only one assignment
         * without an ending date.
         *
         * Historical assignments remain intact.
         */
        uniqueIndex(
            'employee_assignments_one_open_assignment',
        )
            .on(
                table.employeeId,
            )
            .where(
                sql`${table.effectiveUntil} IS NULL`,
            ),
    ],
)