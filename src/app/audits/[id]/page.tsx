import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { ZONES, STATUTS, scoreOf, scoreColor, computeCounts } from "@/lib/audit/zones"
import type { ResultItem } from "@/lib/audit/zones"
import { ArrowLeft, LayoutDashboard } from "lucide-react"
import { DownloadPdfButton } from "@/components/audit/DownloadPdfButton"
import { DownloadExcelButton } from "@/components/audit/DownloadExcelButton"

function interprétation(score: number): string {
  if (score >= 90) return "Excellent"
  if (score >= 80) return "Très bon"
  if (score >= 70) return "Bon"
  if (score >= 60) return "Moyen"
  if (score >= 40) return "Insuffisant"
  return "CRITIQUE"
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
  if (!session) redirect("/auth/login")

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
    .select("id, user_id, magasin_name, superviseur, responsable, date, heure, results, custom_items, counts, score, status, ref, created_at")
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
    <div style={{ maxWidth:680, margin:"0 auto", padding:"1.5rem 1rem" }}>

      {/* Top bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Link href="/audits" style={{ display:"flex", color:"#111", textDecoration:"none" }} aria-label="Retour">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize:16, fontWeight:600, color:"#111", margin:0 }}>Rapport d&apos;audit</h1>
            {audit.ref && <span style={{ fontSize:11, color:"#9ca3af" }}>Réf. {audit.ref}</span>}
          </div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <DownloadExcelButton
            magasinName={audit.magasin_name}
            date={audit.date}
            superviseur={audit.superviseur}
            score={score}
            results={results}
            customItems={customItems}
          />
          <DownloadPdfButton
            magasinName={audit.magasin_name}
            date={audit.date}
            heure={audit.heure || ""}
            superviseur={audit.superviseur}
            responsable={audit.responsable || ""}
            score={score}
            counts={counts}
            total={total}
            zonesActives={zonesActives}
            results={results}
            itemsWithAction={itemsWithAction}
            zonesWithItems={zonesWithItems}
            auditRef={audit.ref}
          />
        </div>
      </div>

      <div id="report-content">

        {/* ===== HEADER ===== */}
        <div style={{ borderBottom:"2px solid #ED7D31", paddingBottom:12, marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:500, color:"#9ca3af", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>
            Prosuma — ProAudit
          </div>
          <div style={{ fontSize:20, fontWeight:500, color:"#111", marginBottom:10 }}>
            Rapport d&apos;Audit de Supervision
          </div>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
            {[
              ["Magasin", audit.magasin_name],
              ["Date", `${audit.date}${audit.heure ? ` · ${audit.heure}` : ""}`],
              ["Superviseur", audit.superviseur],
              ...(audit.responsable ? [["Responsable", audit.responsable]] : []),
            ].map(([label, value]) => (
              <div key={label} style={{ fontSize:13, color:"#6b7280" }}>
                <strong style={{ color:"#111", fontWeight:500 }}>{label} :</strong> {value}
              </div>
            ))}
          </div>
        </div>

        {/* ===== ALERT BANNER ===== */}
        {score < 60 && (
          <div style={{ background:"#fff7ed", border:"0.5px solid #fed7aa", borderRadius:8, padding:"10px 14px", marginBottom:20, fontSize:12, color:"#9a3412", lineHeight:1.6 }}>
            <strong>Attention :</strong> {résuméScore(score)}
          </div>
        )}

        {/* ===== SCORE BANNER ===== */}
        <div style={{
          display:"grid", gridTemplateColumns:"auto 1fr", gap:16, alignItems:"center",
          background:"#f9fafb", borderRadius:10, padding:"14px 18px", marginBottom:20,
          border:"0.5px solid #e5e7eb",
        }}>
          <div style={{
            width:72, height:72, borderRadius:"50%", border:`3px solid ${scoreColor(score)}`,
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          }}>
            <div style={{ fontSize:22, fontWeight:500, color: scoreColor(score), lineHeight:1 }}>{score}%</div>
            <div style={{ fontSize:9, color: scoreColor(score), marginTop:1 }}>{score < 60 ? "CRITIQUE" : interprétation(score).toUpperCase()}</div>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:500, color:"#111", marginBottom:4 }}>
              Score de conformité globale — Niveau {interprétation(score)}
            </div>
            <div style={{ fontSize:12, color:"#6b7280", lineHeight:1.5, marginBottom:8 }}>
              Sur {total} critère{total > 1 ? "s" : ""} évalués, {totalS} satisfaisant{totalS > 1 ? "s" : ""}.
              {itemsWithAction.length > 0 && ` ${itemsWithAction.length} point${itemsWithAction.length > 1 ? "s" : ""} nécessite${itemsWithAction.length > 1 ? "nt" : ""} un plan d'action correctif.`}
            </div>
            {/* Progress bar */}
            <div style={{ height:6, borderRadius:3, background:"#e5e7eb", overflow:"hidden", marginBottom:8 }}>
              <div style={{ height:"100%", borderRadius:3, width:`${score}%`, background: score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626" }} />
            </div>
            {/* Stats row */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
              {[
                { n: totalS, l: "Satisfaisant", cls:"#dcfce7", tc:"#16a34a" },
                { n: totalM, l: "Moyen", cls:"#fef3c7", tc:"#d97706" },
                { n: totalNS, l: "Non satisf.", cls:"#fee2e2", tc:"#dc2626" },
                { n: totalNA, l: "N/A", cls:"#f3f4f6", tc:"#6b7280" },
              ].map(s => (
                <div key={s.l} style={{ padding:"6px 0", borderRadius:6, textAlign:"center", background: s.cls }}>
                  <div style={{ fontSize:16, fontWeight:500, lineHeight:1, color: s.tc }}>{s.n}</div>
                  <div style={{ fontSize:10, color: s.tc, marginTop:2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== SYNTHÈSE PAR ZONE ===== */}
        <div style={{ fontSize:13, fontWeight:500, color:"#6b7280", textTransform:"uppercase", letterSpacing:1, marginBottom:10, display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
          Synthèse par zone
          <span style={{ flex:1, height:"0.5px", background:"#e5e7eb" }} />
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:20 }}>
          {zonesActives.map(zone => {
            const zoneItems = zone.items.filter(it => results[it.id]?.statut)
            const zoneS = zoneItems.filter(it => results[it.id]?.statut === "S").length
            const zoneM = zoneItems.filter(it => results[it.id]?.statut === "M").length
            const zoneNS = zoneItems.filter(it => results[it.id]?.statut === "NS").length
            const zoneDone = zoneItems.length
            const zoneTotal = zone.items.length
            const hasIssues = zoneM > 0 || zoneNS > 0
            return (
              <div key={zone.id} style={{
                display:"flex", alignItems:"center", gap:8, padding:"10px 12px",
                background:"#fff", borderRadius:8, border: hasIssues ? "0.5px solid #fca5a5" : "0.5px solid #e5e7eb",
              }}>
                <span style={{ fontSize:14, width:22, textAlign:"center", flexShrink:0 }}>{zone.icon}</span>
                <span style={{ fontSize:13, fontWeight:500, color:"#111", flex:1 }}>{zone.label}</span>
                <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                  <span style={{ fontSize:11, padding:"2px 6px", borderRadius:4, background:"#dcfce7", color:"#166534", fontWeight:500 }}>✓ {zoneS}</span>
                  {zoneM > 0 && <span style={{ fontSize:11, padding:"2px 6px", borderRadius:4, background:"#fef3c7", color:"#92400e", fontWeight:500 }}>⚠ {zoneM}</span>}
                  {zoneNS > 0 && <span style={{ fontSize:11, padding:"2px 6px", borderRadius:4, background:"#fee2e2", color:"#991b1b", fontWeight:500 }}>✗ {zoneNS}</span>}
                </div>
                <span style={{ fontSize:11, color:"#9ca3af" }}>{zoneDone}/{zoneTotal}</span>
              </div>
            )
          })}
        </div>

        {/* ===== ACTIONS CORRECTIVES ===== */}
        {itemsWithAction.length > 0 && (
          <>
            <div style={{ fontSize:13, fontWeight:500, color:"#6b7280", textTransform:"uppercase", letterSpacing:1, marginBottom:10, display:"flex", alignItems:"center", gap:8 }}>
              Actions correctives ({itemsWithAction.length} point{itemsWithAction.length > 1 ? "s" : ""})
              <span style={{ flex:1, height:"0.5px", background:"#e5e7eb" }} />
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:20 }}>
              {zonesActives.flatMap(zone =>
                zone.items.map(item => {
                  const r = results[item.id]
                  if (!r?.statut || r.statut === "S" || r.statut === "NA") return null
                  const st = STATUTS.find(s => s.val === r.statut)
                  const isBad = r.statut === "NS"
                  return (
                    <div key={item.id} style={{
                      display:"flex", alignItems:"flex-start", gap:8, padding:"10px 12px",
                      borderRadius:8, border: isBad ? "0.5px solid #fecaca" : "0.5px solid #fde68a",
                      background: isBad ? "#fff5f5" : "#fffbeb",
                    }}>
                      <span style={{ fontSize:13, flexShrink:0, marginTop:1 }}>{isBad ? "✗" : "⚠️"}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11, color:"#6b7280", marginBottom:2 }}>{zone.label}</div>
                        <div style={{ fontSize:13, color:"#111", lineHeight:1.4 }}>{item.label}</div>
                        {r.action && <div style={{ fontSize:12, color:"#ED7D31", marginTop:2 }}>Action : {r.action}</div>}
                        {r.comment && <div style={{ fontSize:11, color:"#6b7280", fontStyle:"italic", marginTop:2 }}>{r.comment}</div>}
                      </div>
                      {r.deadlineType && (
                        <span style={{ fontSize:11, whiteSpace:"nowrap", color:"#6b7280", flexShrink:0 }}>
                          {r.deadlineType === "immediat" ? "🔴 Immédiat" : r.deadlineType === "continu" ? "🔄 Continu" : `📅 ${r.deadline || ""}`}
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}

        {/* ===== RECOMMANDATIONS ===== */}
        <div style={{ background:"#f9fafb", border:"0.5px solid #e5e7eb", borderRadius:10, padding:"14px 18px", marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:500, color:"#111", marginBottom:10 }}>Recommandations</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {(() => {
              const recs: string[] = []
              const nsZones = zonesWithItems.filter(z => z.items.some(it => results[it.id]?.statut === "NS"))
              const mZones = zonesWithItems.filter(z => z.items.some(it => results[it.id]?.statut === "M"))
              if (nsZones.length) recs.push(`Intervenir en priorité sur : <strong>${nsZones.map(z => z.label).join("</strong>, <strong>")}</strong> — zones les plus défaillantes.`)
              if (mZones.length) recs.push(`Renforcer les contrôles sur : <strong>${mZones.map(z => z.label).join("</strong>, <strong>")}</strong>.`)
              if (Object.values(results).filter(r => r?.statut === "NS").length > 5) recs.push("Organiser une réunion de sensibilisation du personnel.")
              if (itemsWithAction.length) recs.push("Assurer un suivi régulier des actions correctives engagées.")
              recs.push("Planifier un audit de suivi sous <strong>30 à 60 jours</strong>.")
              return recs
            })().map((r, i) => (
              <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", fontSize:13, color:"#111" }}>
                <div style={{
                  minWidth:20, height:20, borderRadius:"50%", background:"#ED7D31", color:"#fff",
                  fontSize:11, fontWeight:500, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1,
                }}>
                  {i + 1}
                </div>
                <span dangerouslySetInnerHTML={{ __html: r }} />
              </div>
            ))}
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div style={{ paddingTop:12, borderTop:"0.5px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6 }}>
          <span style={{ fontSize:11, color:"#9ca3af" }}>Rapport généré le {(() => { const d = new Date(); return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}` })()}</span>
          <span style={{ fontSize:11, color:"#9ca3af" }}>Prosuma — ProAudit</span>
        </div>
      </div>

      {/* ===== BOTTOM BUTTONS ===== */}
      <div style={{ display:"flex", gap:8, marginTop:20 }}>
        {audit.status === "draft" && (
          <Link href={`/audit/nouveau?draft=${audit.id}`}
            style={{ padding:"10px 18px", borderRadius:8, background:"#ED7D31", color:"#fff", fontSize:13, textDecoration:"none", fontWeight:500 }}>
            Reprendre le brouillon
          </Link>
        )}
        <Link href="/dashboard"
          style={{ padding:"10px 18px", borderRadius:8, background:"#fff", color:"#111", fontSize:13, textDecoration:"none", border:"0.5px solid #e5e7eb", display:"flex", alignItems:"center", gap:6, fontWeight:500 }}>
          <LayoutDashboard size={16} /> Retour dashboard
        </Link>
      </div>
    </div>
  )
}
