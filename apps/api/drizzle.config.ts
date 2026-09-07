/// <reference types="node" />

import 'dotenv/config'

import { defineConfig } from 'drizzle-kit'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
    throw new Error(
        'DATABASE_URL is missing. Check apps/api/.env',
    )
}

export default defineConfig({
    dialect: 'postgresql',

    schema: './src/db/schema/index.ts',

    out: './drizzle',

    dbCredentials: {
        url: databaseUrl,
    },

    verbose: true,
    strict: true,
})