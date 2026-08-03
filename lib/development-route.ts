import { notFound } from "next/navigation";

/**
 * Keep visual studies available during local development without publishing
 * them as part of the beta site.
 */
export function requireDevelopmentRoute() {
  if (process.env.NODE_ENV === "production") notFound();
}
