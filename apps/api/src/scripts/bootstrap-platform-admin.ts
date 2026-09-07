import 'dotenv/config'

import {
    eq,
} from 'drizzle-orm'

import {
    db,
} from '../db/index.js'

import {
    platformAdmins,
} from '../db/schema/index.js'

import {
    hashPassword,
} from '../security/password.js'

function requireEnvironmentValue(
    name: string,
) {
    const value =
        process.env[name]
            ?.trim()

    if (!value) {
        throw new Error(
            `${name} is missing.`,
        )
    }

    return value
}

function normalizeEmail(
    email: string,
) {
    return email
        .trim()
        .toLowerCase()
}

function isValidEmail(
    email: string,
) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email)
}

async function main() {
    const fullName =
        requireEnvironmentValue(
            'PLATFORM_ADMIN_NAME',
        )

    const email =
        requireEnvironmentValue(
            'PLATFORM_ADMIN_EMAIL',
        )

    const password =
        requireEnvironmentValue(
            'PLATFORM_ADMIN_PASSWORD',
        )

    if (
        fullName.length < 2 ||
        fullName.length > 180
    ) {
        throw new Error(
            'Platform admin name must be between 2 and 180 characters.',
        )
    }

    const normalizedEmail =
        normalizeEmail(
            email,
        )

    if (
        !isValidEmail(
            normalizedEmail,
        ) ||
        normalizedEmail.length >
        254
    ) {
        throw new Error(
            'Platform admin email is invalid.',
        )
    }

    if (
        password.length < 12 ||
        password.length > 128
    ) {
        throw new Error(
            'Platform admin password must be between 12 and 128 characters.',
        )
    }

    /*
     * Platform administrator emails must be
     * unique among platform administrators.
     *
     * It is allowed for the same human/email
     * to also have an organization account.
     */
    const [
        existingPlatformAdmin,
    ] =
        await db
            .select({
                id:
                    platformAdmins.id,
            })
            .from(
                platformAdmins,
            )
            .where(
                eq(
                    platformAdmins.normalizedEmail,
                    normalizedEmail,
                ),
            )
            .limit(1)

    if (existingPlatformAdmin) {
        throw new Error(
            'A platform administrator with this email already exists.',
        )
    }

    const passwordHash =
        await hashPassword(
            password,
        )

    const [admin] =
        await db
            .insert(
                platformAdmins,
            )
            .values({
                fullName,

                email:
                    email.trim(),

                normalizedEmail,

                passwordHash,

                accountStatus:
                    'active',

                passwordChangedAt:
                    new Date(),
            })
            .returning({
                id:
                    platformAdmins.id,

                fullName:
                    platformAdmins.fullName,

                email:
                    platformAdmins.email,
            })

    if (!admin) {
        throw new Error(
            'Failed to create platform administrator.',
        )
    }

    console.log('')

    console.log(
        'Platform administrator created successfully.',
    )

    console.log(
        `Name: ${admin.fullName}`,
    )

    console.log(
        `Email: ${admin.email}`,
    )

    console.log('')

    console.log(
        'Remove PLATFORM_ADMIN_NAME, PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD from the environment now.',
    )
}

main()
    .then(() => {
        process.exit(0)
    })
    .catch(
        (error: unknown) => {
            console.error('')

            console.error(
                error instanceof Error
                    ? error.message
                    : 'Platform administrator creation failed.',
            )

            console.error('')

            process.exit(1)
        },
    )