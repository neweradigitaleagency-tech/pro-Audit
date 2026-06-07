import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { ZONES, STATUTS, scoreOf, scoreColor, computeCounts } from "@/lib/audit/zones"
import type { ResultItem } from "@/lib/audit/zones"
import { ArrowLeft, LayoutDashboard } from "lucide-react"
import { DownloadPdfButton } from "@/components/audit/DownloadPdfButton"

function interprétation(score: number): string {
  if (score >= 90) return "Excellent"
  if (score >= 80) return "Très bon"
  if (score >= 70) return "Bon"
  if (score >= 60) return "Moyen"
  if (score >= 40) return "Insuffisant"
  return "Critique"
}

function résuméScore(score: number): string {
  if (score >= 80) return "Niveau de conformité satisfaisant sur l'ensemble des critères."
  if (score >= 60) return "Points d'amélioration notables. Des écarts nécessitent une attention particulière."
  return "Défaillances significatives dans plusieurs zones. Des actions correctives immédiates sont indispensables."
}

export default async function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const svc = createServiceClient()
  const { data: profile } = await svc
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single()

  const role = profile?.role || "auditeur"
  const isManagerOrAdmin = role === "manager" || role === "admin"

  let query = svc
    .from("audits")
    .select("id, user_id, magasin_name, superviseur, responsable, date, heure, results, custom_items, counts, score, status, created_at")
    .eq("id", id)
    .single()

  const { data: audit } = await query
  if (!audit) notFound()
  if (!isManagerOrAdmin && audit.user_id !== session.user.id) redirect("/audits")

  const results = (audit.results || {}) as Record<string, ResultItem>
  const customItems = (audit.custom_items || {}) as Record<string, { id: string; cat: string; label: string }[]>
  const score = audit.score ?? scoreOf(results)
  const counts = audit.counts || computeCounts(results)
  const total = Object.keys(results).length

  const zonesWithItems = ZONES.map(z => ({
    ...z,
    items: z.id === "custom"
      ? (customItems["custom"] || [])
      : [...z.items, ...(customItems[z.id] || [])]
  }))

  const zonesActives = zonesWithItems.filter(z => z.items.length > 0 && z.items.some(it => results[it.id]?.statut))
  const itemsWithAction = Object.entries(results).filter(([, r]) => r?.action || r?.statut === "M" || r?.statut === "NS")

  function itemResult(id: string) { return results[id] }

  const totalS = counts.S || 0
  const totalM = counts.M || 0
  const totalNS = counts.NS || 0
  const totalNA = counts.NA || 0
  const barTotal = totalS + totalM + totalNS + totalNA || 1
  const pctS = (totalS / barTotal) * 100
  const pctM = (totalM / barTotal) * 100
  const pctNS = (totalNS / barTotal) * 100
  const pctNA = (totalNA / barTotal) * 100

  return (
    <div style={{ maxWidth:800, margin:"0 auto", padding:"1.5rem 1rem" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Link href="/audits" style={{ display:"flex", color:"#111", textDecoration:"none" }} aria-label="Retour">
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ fontSize:18, fontWeight:600, color:"#111", margin:0 }}>Rapport d&apos;audit</h1>
        </div>
        <DownloadPdfButton />
      </div>

      <div id="report-content" style={{ fontFamily:"system-ui, sans-serif", color:"#111", padding:"0 4px" }}>

        {/* En-tête compact */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", paddingBottom:10, borderBottom:"2px solid #ED7D31", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:11, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1 }}>Prosuma</div>
            <div style={{ fontSize:18, fontWeight:700 }}>Rapport d&apos;Audit</div>
          </div>
          <div style={{ textAlign:"right", fontSize:13, color:"#6b7280", lineHeight:1.6 }}>
            <div><strong>{audit.magasin_name}</strong></div>
            <div>{audit.date}{audit.heure ? ` · ${audit.heure}` : ""}</div>
            <div>{audit.superviseur}{audit.responsable ? ` · Resp. ${audit.responsable}` : ""}</div>
          </div>
        </div>

        {/* Score + barre colorée */}
        <div style={{ display:"flex", gap:20, marginBottom:20, alignItems:"center" }}>
          <div style={{ textAlign:"center", flexShrink:0 }}>
            <div style={{ fontSize:40, fontWeight:700, color: scoreColor(score), lineHeight:1 }}>{score}%</div>
            <div style={{ fontSize:13, fontWeight:600, color: scoreColor(score), marginTop:2 }}>{interprétation(score)}</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ height:20, borderRadius:10, overflow:"hidden", display:"flex", background:"#f3f4f6", marginBottom:6 }}>
              {pctS > 0 && <div style={{ width:`${pctS}%`, background:"#16a34a", minWidth: pctS > 0 ? 4 : 0 }} />}
              {pctM > 0 && <div style={{ width:`${pctM}%`, background:"#d97706", minWidth: pctM > 0 ? 4 : 0 }} />}
              {pctNS > 0 && <div style={{ width:`${pctNS}%`, background:"#dc2626", minWidth: pctNS > 0 ? 4 : 0 }} />}
              {pctNA > 0 && <div style={{ width:`${pctNA}%`, background:"#d1d5db", minWidth: pctNA > 0 ? 4 : 0 }} />}
            </div>
            <div style={{ display:"flex", gap:12, fontSize:12, color:"#6b7280" }}>
              <span>✅ Satisfaisant <strong>{totalS}</strong></span>
              <span>⚠️ Moyen <strong>{totalM}</strong></span>
              <span>❌ Non satisfaisant <strong>{totalNS}</strong></span>
              <span>— N/A <strong>{totalNA}</strong></span>
            </div>
            <div style={{ fontSize:12, color:"#9ca3af", marginTop:4 }}>{résuméScore(score)}</div>
          </div>
        </div>

        {/* Résumé exécutif - une phrase */}
        <div style={{ marginBottom:16, padding:"10px 14px", background:"#f9fafb", borderRadius:8, fontSize:13, color:"#374151", lineHeight:1.6 }}>
          Sur <strong>{total}</strong> critères évalués : <strong>{totalS}</strong> satisfaisants, <strong>{totalM}</strong> moyens, <strong>{totalNS}</strong> non satisfaisants, <strong>{totalNA}</strong> non applicables.
          {itemsWithAction.length > 0 && ` ${itemsWithAction.length} point${itemsWithAction.length > 1 ? "s" : ""} nécessite${itemsWithAction.length > 1 ? "nt" : ""} un plan d'action.`}
        </div>

        {/* Synthèse par zone - ligne unique */}
        <h3 style={{ fontSize:14, fontWeight:600, margin:"0 0 8px", color:"#111" }}>Synthèse par zone</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:20 }}>
          {zonesActives.map(zone => {
            const zoneItems = zone.items.filter(it => results[it.id]?.statut)
            const zoneS = zoneItems.filter(it => results[it.id]?.statut === "S").length
            const zoneM = zoneItems.filter(it => results[it.id]?.statut === "M").length
            const zoneNS = zoneItems.filter(it => results[it.id]?.statut === "NS").length
            const zoneDone = zoneItems.length
            const zoneTotal = zone.items.length
            const hasIssues = zoneM > 0 || zoneNS > 0
            return (
              <div key={zone.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", background: hasIssues ? "#fef2f2" : "#f9fafb", borderRadius:6 }}>
                <span style={{ fontSize:16, width:24, textAlign:"center", flexShrink:0 }}>{zone.icon}</span>
                <span style={{ flex:1, fontSize:13, fontWeight: hasIssues ? 600 : 400 }}>{zone.label}</span>
                <span style={{ fontSize:12, color:"#16a34a" }}>✅ {zoneS}</span>
                {zoneM > 0 && <span style={{ fontSize:12, color:"#d97706", fontWeight:600 }}>⚠️ {zoneM}</span>}
                {zoneNS > 0 && <span style={{ fontSize:12, color:"#dc2626", fontWeight:600 }}>❌ {zoneNS}</span>}
                <span style={{ fontSize:11, color:"#9ca3af" }}>{zoneDone}/{zoneTotal}</span>
              </div>
            )
          })}
        </div>

        {/* Items non conformes avec actions */}
        {itemsWithAction.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <h3 style={{ fontSize:14, fontWeight:600, margin:"0 0 8px", color:"#111" }}>Actions correctives</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              {zonesActives.flatMap(zone =>
                zone.items.map(item => {
                  const r = itemResult(item.id)
                  if (!r?.statut || r.statut === "S" || r.statut === "NA") return null
                  const st = STATUTS.find(s => s.val === r.statut)
                  return (
                    <div key={item.id} style={{ padding:"8px 12px", background:"#fff", borderRadius:6, border:"1px solid #f3f4f6", fontSize:13 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span>{st?.short}</span>
                        <span style={{ color:"#6b7280", fontSize:11 }}>{zone.label}</span>
                        <span style={{ flex:1 }}>{item.label}</span>
                        {r.deadlineType && <span style={{ fontSize:11, whiteSpace:"nowrap", color:"#6b7280" }}>{r.deadlineType === "immediat" ? "🔴 Immédiat" : r.deadlineType === "continu" ? "🔄 Continu" : `📅 ${r.deadline || ""}`}</span>}
                      </div>
                      {r.action && <div style={{ marginTop:3, color:"#ED7D31", fontSize:12 }}>Action : {r.action}</div>}
                      {r.comment && <div style={{ marginTop:2, color:"#6b7280", fontSize:12, fontStyle:"italic" }}>{r.comment}</div>}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Recommandations */}
        <div style={{ marginBottom:16, padding:"12px 16px", background:"#fff", borderRadius:8, border:"1px solid #e5e7eb" }}>
          <h3 style={{ fontSize:14, fontWeight:600, margin:"0 0 8px", color:"#111" }}>Recommandations</h3>
          <ol style={{ margin:0, paddingLeft:18, fontSize:13, color:"#374151", lineHeight:1.8 }}>
            {(() => {
              const recs: string[] = []
              const nsZones = zonesWithItems.filter(z => z.items.some(it => results[it.id]?.statut === "NS"))
              const mZones = zonesWithItems.filter(z => z.items.some(it => results[it.id]?.statut === "M"))
              if (nsZones.length) recs.push(`Intervenir en priorité sur : ${nsZones.map(z => z.label).join(", ")}.`)
              if (mZones.length) recs.push(`Renforcer les contrôles sur : ${mZones.map(z => z.label).join(", ")}.`)
              if (Object.values(results).filter(r => r?.statut === "NS").length > 5) recs.push("Organiser une réunion de sensibilisation du personnel.")
              if (itemsWithAction.length) recs.push("Assurer un suivi régulier des actions correctives engagées.")
              recs.push("Planifier un audit de suivi sous 30 à 60 jours.")
              return recs
            })().map((r, i) => <li key={i}>{r}</li>)}
          </ol>
        </div>

        {/* Pied */}
        <div style={{ paddingTop:10, borderTop:"1px solid #e5e7eb", fontSize:11, color:"#9ca3af", display:"flex", justifyContent:"space-between" }}>
          <span>Rapport généré le {new Date().toLocaleDateString("fr-FR")}</span>
          <span>Prosuma — ProAudit</span>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, marginTop:20 }}>
        {audit.status === "draft" && (
          <Link href={`/audit/nouveau?draft=${audit.id}`}
            style={{ padding:"10px 18px", borderRadius:8, background:"#ED7D31", color:"#fff", fontSize:14, textDecoration:"none", fontWeight:500 }}>
            Reprendre le brouillon
          </Link>
        )}
        <Link href="/dashboard"
          style={{ padding:"10px 18px", borderRadius:8, background:"#fff", color:"#111", fontSize:14, textDecoration:"none", border:"0.5px solid #e5e7eb", display:"flex", alignItems:"center", gap:6, fontWeight:500 }}>
          <LayoutDashboard size={16} /> Retour dashboard
        </Link>
      </div>
    </div>
  )
}
