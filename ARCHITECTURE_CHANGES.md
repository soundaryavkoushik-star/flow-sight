# FlowSight MVP Architecture — Foundation Pass

## Design source of truth
- Figma Make remains the visual/UX source of truth.
- Architecture changes should not silently redesign screens.
- The product remains dark, calm, precise, and forecast-first.

## Changes made
1. Added a pure forecast domain under `lib/forecast/`.
   - Integer-cent money representation.
   - Daily deterministic simulation.
   - Recurring event generation.
   - Lowest-balance and Safe-to-Spend metrics.
   - Risk detection and low-point explanations.
   - Scenario comparison reusing the same engine.
2. Added thin application service boundaries under `lib/services/`.
3. Added a documented data-access boundary under `lib/data/`.
4. Simplified the Prisma MVP schema around:
   - UserProfile
   - Account
   - Transaction
   - RecurringRule
   - Scenario
5. Replaced floating-point money fields with integer cents.
6. Added `/app/dashboard` as the primary authenticated home while reusing the existing Figma-derived dashboard UI.
7. Updated navigation hierarchy and added an Alerts route placeholder.
8. Replaced the obsolete Plaid-first onboarding with a Figma-aligned manual/CSV-first flow; bank connection is visibly deferred.
9. Added Vitest and deterministic forecast-engine tests.

## Verification
- `npm test`: passing (4 tests).
- `npx tsc --noEmit`: passing.
- `prisma validate`: not executed successfully because Prisma attempted to download a schema engine and the execution environment could not resolve `binaries.prisma.sh`.

## Next milestone
Wire onboarding persistence and dashboard data through authenticated server-side data access into `FinancialEvent[]`, then render real `calculateForecast()` output instead of demo constants.
