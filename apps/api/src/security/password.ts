import {
    randomBytes,
    scrypt as scryptCallback,
} from 'node:crypto'

import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)

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