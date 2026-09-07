import {
    index,
    pgEnum,
    pgTable,
    timestamp,
    uniqueIndex,
    uuid,
} from 'drizzle-orm/pg-core'

import { permissions } from './permissions.js'
import { roles } from './roles.js'

/*
 * Scope controls WHERE a permission applies.
 *
 * Example:
 *
 * task.assign + direct_reports
 *
 * means:
 * "Can assign tasks, but only to employees
 * who directly report to this user."
 */
export const permissionScopeEnum = pgEnum(
    'permission_scope',
    [
        'self',
        'direct_reports',
        'reporting_tree',
        'team',
        'department',
        'project',
        'organization',
    ],
)

export const rolePermissions = pgTable(
    'role_permissions',
    {
        id: uuid('id')
            .defaultRandom()
            .primaryKey(),

        roleId: uuid('role_id')
            .notNull()
            .references(
                () => roles.id,
                {
                    onDelete: 'cascade',
                },
            ),

        permissionId: uuid('permission_id')
            .notNull()
            .references(
                () => permissions.id,
                {
                    onDelete: 'cascade',
                },
            ),

        /*
         * Null means the permission itself
         * is not scope-sensitive.
         *
         * Example:
         * organization.settings.manage
         *
         * For scoped permissions this will hold
         * values such as team or department.
         */
        scope: permissionScopeEnum('scope'),

        createdAt: timestamp('created_at', {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },

    (table) => [
        uniqueIndex(
            'role_permissions_unique',
        ).on(
            table.roleId,
            table.permissionId,
            table.scope,
        ),

        index(
            'role_permissions_role_idx',
        ).on(
            table.roleId,
        ),

        index(
            'role_permissions_permission_idx',
        ).on(
            table.permissionId,
        ),
    ],
)