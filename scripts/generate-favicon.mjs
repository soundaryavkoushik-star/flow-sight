import { readFile, writeFile } from "node:fs/promises"
import sharp from "sharp"

const source = await readFile(new URL("../app/icon.svg", import.meta.url))
const png = await sharp(source).resize(32, 32).png().toBuffer()

const directory = Buffer.alloc(22)
directory.writeUInt16LE(0, 0)
directory.writeUInt16LE(1, 2)
directory.writeUInt16LE(1, 4)
directory.writeUInt8(32, 6)
directory.writeUInt8(32, 7)
directory.writeUInt8(0, 8)
directory.writeUInt8(0, 9)
directory.writeUInt16LE(1, 10)
directory.writeUInt16LE(32, 12)
directory.writeUInt32LE(png.length, 14)
directory.writeUInt32LE(directory.length, 18)

await writeFile(new URL("../app/favicon.ico", import.meta.url), Buffer.concat([directory, png]))
