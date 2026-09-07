import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir } from 'node:fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sourceLogo = path.resolve(
    __dirname,
    '../public/branding/bross-logo.jpg',
)

const outputDirectory = path.resolve(
    __dirname,
    '../public/icons',
)

async function createIcon({
    size,
    logoSize,
    filename,
}) {
    const resizedLogo = await sharp(sourceLogo)
        .resize({
            width: logoSize,
            height: logoSize,
            fit: 'contain',
            background: {
                r: 255,
                g: 255,
                b: 255,
                alpha: 1,
            },
        })
        .png()
        .toBuffer()

    await sharp({
        create: {
            width: size,
            height: size,
            channels: 4,
            background: {
                r: 255,
                g: 255,
                b: 255,
                alpha: 1,
            },
        },
    })
        .composite([
            {
                input: resizedLogo,
                gravity: 'center',
            },
        ])
        .png()
        .toFile(path.join(outputDirectory, filename))
}

async function generateIcons() {
    await mkdir(outputDirectory, {
        recursive: true,
    })

    await createIcon({
        size: 192,
        logoSize: 170,
        filename: 'icon-192.png',
    })

    await createIcon({
        size: 512,
        logoSize: 452,
        filename: 'icon-512.png',
    })

    /*
     * Maskable icons need more empty space.
     * Android may crop the icon into a circle,
     * squircle or rounded square.
     */
    await createIcon({
        size: 512,
        logoSize: 340,
        filename: 'icon-512-maskable.png',
    })

    await createIcon({
        size: 180,
        logoSize: 156,
        filename: 'apple-touch-icon.png',
    })

    await createIcon({
        size: 32,
        logoSize: 30,
        filename: 'favicon-32.png',
    })

    console.log('')
    console.log('Bross Work OS icons generated successfully.')
    console.log('')
    console.log('Created:')
    console.log('  icon-192.png')
    console.log('  icon-512.png')
    console.log('  icon-512-maskable.png')
    console.log('  apple-touch-icon.png')
    console.log('  favicon-32.png')
    console.log('')
}

generateIcons().catch((error) => {
    console.error('Failed to generate icons.')
    console.error(error)
    process.exit(1)
})