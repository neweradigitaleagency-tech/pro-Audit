"use server"

import { createServiceClient } from "@/lib/supabase/server"

export async function getProfileRole(userId: string) {
  const svc = createServiceClient()
  const { data } = await svc
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()
  return data?.role ?? null
}

export async function getFinalAudits(userId: string, isManagerOrAdmin: boolean) {
  const svc = createServiceClient()
  let query = svc
    .from("audits")
    .select("id, magasin_name, date, results, status")
    .eq("status", "final")
    .order("date", { ascending: false })

  if (!isManagerOrAdmin) {
    query = query.eq("user_id", userId)
  }

  const { data } = await query
  return data ?? []
}

export async function resolveAction(auditId: string, itemId: string) {
  const svc = createServiceClient()
  const { data: audit } = await svc
    .from("audits")
    .select("results")
    .eq("id", auditId)
    .single()

  if (!audit) return

  const results = JSON.parse(JSON.stringify(audit.results))
  if (results[itemId]) {
    results[itemId] = { ...results[itemId], resolved: true }
  }

  await svc
    .from("audits")
    .update({ results })
    .eq("id", auditId)
}
