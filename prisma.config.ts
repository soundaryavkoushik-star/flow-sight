import { config } from "dotenv"
import { defineConfig } from "prisma/config"

config({ path: ".env.local" })
config()

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
})
