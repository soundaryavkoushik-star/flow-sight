import { config } from "dotenv"
import pg from "pg"

config({ path: ".env.local", quiet: true })

const client = new pg.Client({ connectionString: process.env.DIRECT_URL })
await client.connect()

try {
  const { rows } = await client.query(`
    select table_name, column_name, data_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('UserProfile', 'Account', 'Transaction', 'RecurringSeries')
    order by table_name, ordinal_position
  `)
  const { rows: counts } = await client.query(`
    select relname as table_name, n_live_tup::bigint as estimated_rows
    from pg_stat_user_tables
    where relname in ('UserProfile', 'Account', 'Transaction', 'RecurringSeries')
    order by relname
  `)
  console.log(JSON.stringify({ columns: rows, estimatedRows: counts }, null, 2))
} finally {
  await client.end()
}
