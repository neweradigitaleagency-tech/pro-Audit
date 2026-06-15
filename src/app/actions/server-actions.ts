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
    .limit(200)

  if (!isManagerOrAdmin) {
    query = query.eq("user_id", userId)
  }

  const { data } = await query
  return data ?? []
}

export async function resolveAction(auditId: string, itemId: string) {
  const svc = createServiceClient()
  
  // Atomic update — no read-modify-write race condition
  await svc.rpc("resolve_audit_item", {
    p_audit_id: auditId,
    p_item_id: itemId,
  })
}
