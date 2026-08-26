import { prisma } from "@/lib/data/prisma"

export type RateLimitPolicy = {
  action: string
  limit: number
  windowSeconds: number
}

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number }

export const RATE_LIMITS = {
  csvImport: { action: "csv-import", limit: 10, windowSeconds: 60 * 60 },
  dataExport: { action: "data-export", limit: 5, windowSeconds: 60 * 60 },
  dataDeletion: { action: "data-deletion", limit: 3, windowSeconds: 24 * 60 * 60 },
  dataCreation: { action: "data-creation", limit: 120, windowSeconds: 60 * 60 },
  recurringMutation: { action: "recurring-mutation", limit: 120, windowSeconds: 10 * 60 },
  onboarding: { action: "onboarding", limit: 10, windowSeconds: 60 * 60 },
} as const satisfies Record<string, RateLimitPolicy>

export function rateLimitMessage(result: Extract<RateLimitResult, { allowed: false }>) {
  const minutes = Math.max(1, Math.ceil(result.retryAfterSeconds / 60))
  return `You’ve made several changes in a short time. Please try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`
}

export async function checkRateLimit(
  userId: string,
  policy: RateLimitPolicy,
  now = new Date(),
): Promise<RateLimitResult> {
  const windowMs = policy.windowSeconds * 1000
  const windowStartMs = Math.floor(now.getTime() / windowMs) * windowMs
  const windowStart = new Date(windowStartMs)
  const expiresAt = new Date(windowStartMs + windowMs * 2)

  const bucket = await prisma.rateLimitBucket.upsert({
    where: {
      userId_action_windowStart: {
        userId,
        action: policy.action,
        windowStart,
      },
    },
    update: { count: { increment: 1 }, expiresAt },
    create: { userId, action: policy.action, windowStart, count: 1, expiresAt },
    select: { count: true },
  })

  // Opportunistic cleanup keeps the table bounded without adding a scheduled job.
  if (bucket.count === 1) {
    void prisma.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: now } } }).catch(() => undefined)
  }

  if (bucket.count <= policy.limit) {
    return { allowed: true, remaining: policy.limit - bucket.count }
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((windowStartMs + windowMs - now.getTime()) / 1000)),
  }
}
