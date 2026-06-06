"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getProfileRole, getFinalAudits, resolveAction } from "./server-actions"
import { ZONES, STATUTS, getDeadlineBadge } from "@/lib/audit/zones"
import type { ResultItem } from "@/lib/audit/zones"
import { ArrowLeft, Filter } from "lucide-react"

interface ActionItem {
  auditId: string
  auditDate: string
  magasin: string
  zone: string
  zoneIcon: string
  itemLabel: string
  itemCat: string
  statut: string
  comment?: string
  action?: string
  deadlineType?: string
  deadline?: string
  itemId: string
  resolved?: boolean
}

export default function ActionsPage() {
  const [actions, setActions] = useState<ActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [magasinFilter, setMagasinFilter] = useState<string>("all")
  const [magasins, setMagasins] = useState<string[]>([])

  useEffect(() => {
    loadActions()
  }, [])

  async function loadActions() {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const role = await getProfileRole(session.user.id)
      const isManagerOrAdmin = role === "manager" || role === "admin"

      const audits = await getFinalAudits(session.user.id, isManagerOrAdmin)
      if (!audits) { setLoading(false); return }

      const mags = new Set<string>()
      const allActions: ActionItem[] = []

      audits.forEach(a => {
        if (a.magasin_name) mags.add(a.magasin_name)
        const results = (a.results || {}) as Record<string, ResultItem>

        Object.entries(results).forEach(([itemId, r]) => {
          if (!r.statut || r.statut === "S" || r.statut === "NA") return
          if (r.resolved) return

          let zone = "", zoneIcon = "", itemLabel = "", itemCat = ""
          for (const z of ZONES) {
            const found = z.items.find(i => i.id === itemId)
            if (found) { zone = z.label; zoneIcon = z.icon; itemLabel = found.label; itemCat = found.cat; break }
          }

          allActions.push({
            auditId: a.id,
            auditDate: a.date,
            magasin: a.magasin_name,
            zone, zoneIcon, itemLabel, itemCat,
            statut: r.statut,
            comment: r.comment,
            action: r.action,
            deadlineType: r.deadlineType,
            deadline: r.deadline,
            itemId, resolved: r.resolved,
          })
        })
      })

      setActions(allActions)
      setMagasins(Array.from(mags).sort())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function markResolved(auditId: string, itemId: string) {
    try {
      await resolveAction(auditId, itemId)

      setActions(prev => prev.map(a =>
        a.auditId === auditId && a.itemId === itemId
          ? { ...a, resolved: true }
          : a
      ))
    } catch (e) { console.error(e) }
  }

  const filtered = actions.filter(a => {
    if (statusFilter !== "all" && a.statut !== statusFilter) return false
    if (magasinFilter !== "all" && a.magasin !== magasinFilter) return false
    return true
  })

  const pendingCount = actions.filter(a => !a.resolved).length

  return (
    <div style={{ maxWidth:560, margin:"0 auto", padding:"1.5rem 1rem" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Link href="/dashboard" style={{ display:"flex", color:"#111", textDecoration:"none" }} aria-label="Retour">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize:20, fontWeight:600, color:"#111", margin:0 }}>Actions correctives</h1>
            <p style={{ fontSize:13, color:"#6b7280", margin:"2px 0 0" }}>
              {pendingCount} en attente{actions.length > 0 ? ` · ${actions.length} totale` : ""}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16, overflowX:"auto", paddingBottom:4 }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding:"8px 12px", borderRadius:8, border:"0.5px solid #e5e7eb",
            fontSize:12, background:"#fff", fontFamily:"inherit"
          }}>
          <option value="all">Tous les statuts</option>
          {STATUTS.filter(s => s.val !== "S" && s.val !== "NA").map(s => (
            <option key={s.val} value={s.val}>{s.short} {s.label}</option>
          ))}
        </select>
        <select value={magasinFilter} onChange={e => setMagasinFilter(e.target.value)}
          style={{
            padding:"8px 12px", borderRadius:8, border:"0.5px solid #e5e7eb",
            fontSize:12, background:"#fff", fontFamily:"inherit"
          }}>
          <option value="all">Tous les magasins</option>
          {magasins.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:40, color:"#9ca3af" }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:40, color:"#9ca3af" }}>
          Aucune action corrective
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {filtered.map((a, i) => {
            const badge = getDeadlineBadge({
              statut: a.statut as "S" | "M" | "NS" | "NA",
              deadlineType: a.deadlineType as "immediat" | "continu" | "date" | undefined,
              deadline: a.deadline,
            })
            const st = STATUTS.find(s => s.val === a.statut)
            return (
              <div key={`${a.auditId}-${a.itemId}-${i}`} style={{
                background:"#fff", borderRadius:10, border:"0.5px solid #e5e7eb", padding:"12px 14px"
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <Link href={`/audits/${a.auditId}`} style={{ fontSize:12, color:"#ED7D31", textDecoration:"none" }}>
                    {a.magasin} · {a.auditDate}
                  </Link>
                  <span style={{
                    fontSize:11, padding:"1px 6px", borderRadius:4,
                    background: st?.bg || "#f3f4f6", color: st?.color || "#6b7280"
                  }}>
                    {st?.short} {st?.label}
                  </span>
                </div>
                <div style={{ fontSize:13, color:"#6b7280", marginBottom:4 }}>
                  {a.zoneIcon} {a.zone} · {a.itemCat}
                </div>
                <div style={{ fontSize:14, color:"#111", marginBottom:4 }}>{a.itemLabel}</div>
                {a.action && (
                  <div style={{ fontSize:13, color:"#ED7D31", marginBottom:4 }}>
                    Action: {a.action}
                  </div>
                )}
                {a.comment && (
                  <div style={{ fontSize:12, color:"#6b7280", marginBottom:4 }}>
                    {a.comment}
                  </div>
                )}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6 }}>
                  {badge && (
                    <span style={{
                      fontSize:11, padding:"1px 6px", borderRadius:4,
                      color: badge.color, background: badge.bg
                    }}>
                      {badge.text}
                    </span>
                  )}
                  {!a.resolved && (
                    <button onClick={() => markResolved(a.auditId, a.itemId)}
                      style={{
                        padding:"6px 12px", borderRadius:6, border:"0.5px solid #16a34a",
                        background:"#f0fdf4", color:"#16a34a", fontSize:12, cursor:"pointer"
                      }}>
                      Résoudre
                    </button>
                  )}
                  {a.resolved && (
                    <span style={{ fontSize:12, color:"#16a34a" }}>✅ Résolue</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
