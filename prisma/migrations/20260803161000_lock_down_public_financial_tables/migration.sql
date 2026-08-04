-- FlowSight accesses financial data through server-side Prisma. Browser-facing
-- Supabase roles must not be able to bypass that authorization boundary via
-- PostgREST or another direct database API.

ALTER TABLE public."UserProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CreditCardSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ForecastSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RecurringSuggestionDecision" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ActualBalanceObservation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TransactionTransfer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CategoryRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RecurringSeries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RecurringException" ENABLE ROW LEVEL SECURITY;

-- No client policies are created intentionally. With RLS enabled, access is
-- denied by default. Prisma connects with the privileged database role and
-- remains the only application data-access path.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- Keep future Prisma-managed tables private unless a later migration grants a
-- deliberately scoped client policy.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL PRIVILEGES ON SEQUENCES FROM anon, authenticated;

-- Prisma's migration history must never be exposed through Supabase APIs.
REVOKE ALL PRIVILEGES ON TABLE public."_prisma_migrations" FROM anon, authenticated;
