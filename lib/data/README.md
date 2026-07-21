# Data access boundary

Keep database access in this directory. Server code should authenticate the user from the Supabase session, then scope every query by that authenticated `user.id`.

Rules:
- Never accept a browser-supplied `userId` as authorization.
- Prefer Prisma for application CRUD; use Supabase for authentication.
- Map Prisma/database records into forecast-domain types before calling `lib/forecast`.
- CSV and future Plaid imports should also normalize into `FinancialEvent` objects before forecasting.
