import {
    randomBytes,
    scrypt as scryptCallback,
    timingSafeEqual,
} from 'node:crypto'

import { promisify } from 'node:util'

const scrypt = promisify(
    scryptCallback,
)

const HASH_LENGTH = 64

export async function hashPassword(
    password: string,
) {
    const salt = randomBytes(32)

    const derivedKey = (await scrypt(
        password,
        salt,
        HASH_LENGTH,
    )) as Buffer

    return [
        'scrypt',
        salt.toString('base64'),
        derivedKey.toString('base64'),
    ].join('$')
}

export async function verifyPassword(
    password: string,
    storedHash: string,
) {
    const parts =
        storedHash.split('$')

    if (parts.length !== 3) {
        return false
    }

    const [
        algorithm,
        saltBase64,
        hashBase64,
    ] = parts

    if (
        algorithm !== 'scrypt' ||
        !saltBase64 ||
        !hashBase64
    ) {
        return false
    }

    let salt: Buffer
    let storedKey: Buffer

    try {
        salt = Buffer.from(
            saltBase64,
            'base64',
        )

        storedKey = Buffer.from(
            hashBase64,
            'base64',
        )
    } catch {
        return false
    }

    if (
        storedKey.length !==
        HASH_LENGTH
    ) {
        return false
    }

    const derivedKey =
        (await scrypt(
            password,
            salt,
            HASH_LENGTH,
        )) as Buffer

    return timingSafeEqual(
        storedKey,
        derivedKey,
    )
}