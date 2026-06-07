import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { ZONES, STATUTS, scoreOf, scoreColor, computeCounts } from "@/lib/audit/zones"
import type { ResultItem } from "@/lib/audit/zones"
import { ArrowLeft, LayoutDashboard } from "lucide-react"
import { DownloadPdfButton } from "@/components/audit/DownloadPdfButton"

function interprétationScore(score: number): string {
  if (score >= 90) return "Excellent"
  if (score >= 80) return "Très bon"
  if (score >= 70) return "Bon"
  if (score >= 60) return "Moyen"
  if (score >= 40) return "Insuffisant"
  return "Critique"
}

function texteScore(score: number): string {
  if (score >= 80) return "Le magasin maintient un niveau de conformité satisfaisant sur l'ensemble des critères audités. Les pratiques en place sont globalement efficaces et répondent aux exigences."
  if (score >= 60) return "Le magasin présente des points d'amélioration notables. Bien que les fondamentaux soient en place, plusieurs écarts nécessitent une attention particulière pour éviter une dégradation."
  return "Le magasin montre des défaillances significatives dans plusieurs zones critiques. Des actions correctives immédiates et structurées sont indispensables pour remédier aux non-conformités identifiées."
}

function zonesProblématiques(zones: typeof ZONES, results: Record<string, ResultItem>): string {
  const problemZones = zones
    .filter(z => z.items.some(it => results[it.id]?.statut === "NS" || results[it.id]?.statut === "M"))
    .map(z => z.label.toLowerCase())
  if (problemZones.length === 0) return "aucune zone problématique détectée"
  if (problemZones.length === 1) return `la zone ${problemZones[0]}`
  if (problemZones.length === 2) return `les zones ${problemZones[0]} et ${problemZones[1]}`
  const last = problemZones.pop()
  return `les zones ${problemZones.join(", ")} et ${last}`
}

function genererRecommandations(zones: typeof ZONES, results: Record<string, ResultItem>): string[] {
  const recs: string[] = []
  const nsZones = zones.filter(z => z.items.some(it => results[it.id]?.statut === "NS"))
  const mZones = zones.filter(z => z.items.some(it => results[it.id]?.statut === "M"))

  if (nsZones.length > 0) {
    recs.push(`Intervenir en priorité sur les zones présentant des non-conformités (${nsZones.map(z => z.label).join(", ")}). Mettre en place un plan d'action correctif avec échéances précises.`)
  }
  if (mZones.length > 0) {
    recs.push(`Renforcer les contrôles dans les zones notées "Moyen" (${mZones.map(z => z.label).join(", ")}) pour éviter qu'elles ne basculent en non-conformité.`)
  }
  const totalNs = Object.values(results).filter(r => r?.statut === "NS").length
  if (totalNs > 5) {
    recs.push("Organiser une réunion de sensibilisation avec l'ensemble du personnel sur les points critiques identifiés.")
  }
  const itemsWithAction = Object.entries(results).filter(([, r]) => r?.action)
  if (itemsWithAction.length > 0) {
    recs.push("Assurer un suivi régulier des actions correctives engagées et vérifier leur efficacité dans le temps.")
  }
  recs.push("Planifier un audit de suivi dans un délai de 30 à 60 jours pour mesurer les progrès réalisés.")
  return recs
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

  if (!isManagerOrAdmin && audit.user_id !== session.user.id) {
    redirect("/audits")
  }

  const results = (audit.results || {}) as Record<string, ResultItem>
  const customItems = (audit.custom_items || {}) as Record<string, { id: string; cat: string; label: string }[]>
  const score = audit.score ?? scoreOf(results)
  const counts = audit.counts || computeCounts(results)

  const zonesWithItems = ZONES.map(z => ({
    ...z,
    items: z.id === "custom"
      ? (customItems["custom"] || [])
      : [...z.items, ...(customItems[z.id] || [])]
  }))

  const zonesActives = zonesWithItems.filter(z => z.items.length > 0 && z.items.some(it => results[it.id]?.statut))
  const itemsWithAction = Object.entries(results).filter(([, r]) => r?.action || (r?.statut === "M" || r?.statut === "NS"))
  const recommandations = genererRecommandations(zonesWithItems, results)

  function itemResult(itemId: string): ResultItem | undefined {
    return results[itemId]
  }

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

      <div id="report-content" style={{ fontFamily:"system-ui, sans-serif", color:"#111" }}>
        {/* En-tête */}
        <div style={{ textAlign:"center", padding:"24px 0 16px", borderBottom:"2px solid #ED7D31", marginBottom:20 }}>
          <div style={{ fontSize:11, color:"#9ca3af", textTransform:"uppercase", letterSpacing:2, marginBottom:4 }}>Prosuma</div>
          <h2 style={{ fontSize:22, fontWeight:700, margin:"0 0 4px", color:"#111" }}>Rapport d&apos;Audit Supermarché</h2>
          <div style={{ fontSize:13, color:"#6b7280" }}>Application ProAudit — Audit de supervision</div>
        </div>

        {/* Informations générales */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:24 }}>
          <div style={{ padding:"12px 16px", background:"#f9fafb", borderRadius:8 }}>
            <div style={{ fontSize:11, color:"#9ca3af", textTransform:"uppercase", marginBottom:2 }}>Magasin</div>
            <div style={{ fontSize:15, fontWeight:600 }}>{audit.magasin_name}</div>
          </div>
          <div style={{ padding:"12px 16px", background:"#f9fafb", borderRadius:8 }}>
            <div style={{ fontSize:11, color:"#9ca3af", textTransform:"uppercase", marginBottom:2 }}>Date</div>
            <div style={{ fontSize:15, fontWeight:600 }}>{audit.date} à {audit.heure || "N/A"}</div>
          </div>
          <div style={{ padding:"12px 16px", background:"#f9fafb", borderRadius:8 }}>
            <div style={{ fontSize:11, color:"#9ca3af", textTransform:"uppercase", marginBottom:2 }}>Superviseur</div>
            <div style={{ fontSize:15, fontWeight:600 }}>{audit.superviseur}</div>
          </div>
          <div style={{ padding:"12px 16px", background:"#f9fafb", borderRadius:8 }}>
            <div style={{ fontSize:11, color:"#9ca3af", textTransform:"uppercase", marginBottom:2 }}>Responsable magasin</div>
            <div style={{ fontSize:15, fontWeight:600 }}>{audit.responsable || "N/A"}</div>
          </div>
        </div>

        {/* Score */}
        <div style={{ textAlign:"center", padding:"20px", marginBottom:24, borderRadius:10, border:"1px solid", borderColor: scoreColor(score), background: score >= 60 ? "#f0fdf4" : "#fef2f2" }}>
          <div style={{ fontSize:11, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>Score global</div>
          <div style={{ fontSize:48, fontWeight:700, color: scoreColor(score), lineHeight:1 }}>{score}%</div>
          <div style={{ fontSize:16, fontWeight:600, color: scoreColor(score), marginTop:4 }}>{interprétationScore(score)}</div>
          <div style={{ maxWidth:480, margin:"10px auto 0", fontSize:13, color:"#6b7280", lineHeight:1.5 }}>
            {texteScore(score)}
          </div>
        </div>

        {/* Résumé exécutif */}
        <div style={{ marginBottom:24, padding:"16px 20px", background:"#fff", borderRadius:10, border:"1px solid #e5e7eb" }}>
          <h3 style={{ fontSize:15, fontWeight:600, margin:"0 0 8px", color:"#111", display:"flex", alignItems:"center", gap:6 }}>
            Résumé exécutif
          </h3>
          <p style={{ fontSize:13, color:"#374151", lineHeight:1.7, margin:0 }}>
            L&apos;audit du magasin <strong>{audit.magasin_name}</strong>, réalisé le <strong>{audit.date}</strong> par <strong>{audit.superviseur}</strong> en présence du responsable <strong>{audit.responsable || "N/A"}</strong>, fait apparaître un score global de <strong style={{ color: scoreColor(score) }}>{score}% ({interprétationScore(score)})</strong>.
          </p>
          <p style={{ fontSize:13, color:"#374151", lineHeight:1.7, margin:"8px 0 0" }}>
            Sur l&apos;ensemble des {Object.keys(results).length} critères évalués, <strong>{counts.S || 0}</strong> sont satisfaisants, <strong>{counts.M || 0}</strong> sont moyens, <strong>{counts.NS || 0}</strong> sont non satisfaisants et <strong>{counts.NA || 0}</strong> sont non applicables. Les principaux écarts concernent {zonesProblématiques(zonesWithItems, results)}.
          </p>
          {itemsWithAction.length > 0 && (
            <p style={{ fontSize:13, color:"#374151", lineHeight:1.7, margin:"8px 0 0" }}>
              <strong>{itemsWithAction.length} point{itemsWithAction.length > 1 ? "s" : ""}</strong> nécessitent un plan d&apos;action correctif. Les détails sont présentés dans la synthèse ci-dessous.
            </p>
          )}
        </div>

        {/* Répartition des statuts */}
        <div style={{ display:"flex", gap:12, justifyContent:"center", marginBottom:24, padding:"16px", background:"#fff", borderRadius:10, border:"1px solid #e5e7eb" }}>
          {STATUTS.map(s => (
            <div key={s.val} style={{ textAlign:"center", flex:1 }}>
              <div style={{ fontSize:24 }}>{s.short}</div>
              <div style={{ fontSize:22, fontWeight:700, color:"#111" }}>{counts[s.val] || 0}</div>
              <div style={{ fontSize:11, color:"#6b7280" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Détail par zone */}
        <h3 style={{ fontSize:16, fontWeight:600, margin:"0 0 12px", color:"#111", borderLeft:"3px solid #ED7D31", paddingLeft:10 }}>
          Détail des constats par zone
        </h3>

        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24 }}>
          {zonesActives.map(zone => {
            const zoneItems = zone.items.filter(it => results[it.id]?.statut)
            const zoneS = zoneItems.filter(it => results[it.id]?.statut === "S").length
            const zoneM = zoneItems.filter(it => results[it.id]?.statut === "M").length
            const zoneNS = zoneItems.filter(it => results[it.id]?.statut === "NS").length
            return (
              <div key={zone.id} style={{ background:"#fff", borderRadius:10, border:"1px solid #e5e7eb", overflow:"hidden" }}>
                <div style={{ padding:"12px 16px", borderBottom:"1px solid #e5e7eb", display:"flex", alignItems:"center", justifyContent:"space-between", background:"#fafafa" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:18 }}>{zone.icon}</span>
                    <span style={{ fontSize:14, fontWeight:600 }}>{zone.label}</span>
                  </div>
                  <div style={{ display:"flex", gap:8, fontSize:12 }}>
                    <span style={{ color:"#16a34a" }}>✅ {zoneS}</span>
                    <span style={{ color:"#d97706" }}>⚠️ {zoneM}</span>
                    <span style={{ color:"#dc2626" }}>❌ {zoneNS}</span>
                    <span style={{ color:"#9ca3af" }}>| {zoneItems.length}/{zone.items.length}</span>
                  </div>
                </div>
                <div style={{ padding:"4px 0" }}>
                  {zone.items.map(item => {
                    const r = itemResult(item.id)
                    if (!r?.statut) return null
                    const st = STATUTS.find(s => s.val === r.statut)
                    return (
                      <div key={item.id} style={{ padding:"10px 16px", borderBottom:"1px solid #f3f4f6", display:"flex", alignItems:"flex-start", gap:10 }}>
                        <span style={{ fontSize:16, flexShrink:0, width:28, textAlign:"center" }}>{st?.short}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, color:"#111", fontWeight:500 }}>{item.label}</div>
                          {r.comment && <div style={{ fontSize:12, color:"#6b7280", marginTop:3, fontStyle:"italic" }}>{r.comment}</div>}
                          {r.action && (
                            <div style={{ fontSize:12, color:"#ED7D31", marginTop:3 }}>
                              <strong>Action :</strong> {r.action}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Synthèse des actions correctives */}
        {itemsWithAction.length > 0 && (
          <div style={{ marginBottom:24, padding:"16px 20px", background:"#fff", borderRadius:10, border:"1px solid #e5e7eb" }}>
            <h3 style={{ fontSize:15, fontWeight:600, margin:"0 0 12px", color:"#111", borderLeft:"3px solid #dc2626", paddingLeft:10 }}>
              Synthèse des actions correctives
            </h3>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:"#f9fafb" }}>
                    <th style={{ textAlign:"left", padding:"8px 10px", borderBottom:"1px solid #e5e7eb", fontWeight:600, color:"#374151" }}>Statut</th>
                    <th style={{ textAlign:"left", padding:"8px 10px", borderBottom:"1px solid #e5e7eb", fontWeight:600, color:"#374151" }}>Zone</th>
                    <th style={{ textAlign:"left", padding:"8px 10px", borderBottom:"1px solid #e5e7eb", fontWeight:600, color:"#374151" }}>Critère</th>
                    <th style={{ textAlign:"left", padding:"8px 10px", borderBottom:"1px solid #e5e7eb", fontWeight:600, color:"#374151" }}>Action requise</th>
                    <th style={{ textAlign:"left", padding:"8px 10px", borderBottom:"1px solid #e5e7eb", fontWeight:600, color:"#374151" }}>Délai</th>
                  </tr>
                </thead>
                <tbody>
                  {zonesActives.flatMap(zone =>
                    zone.items.map(item => {
                      const r = itemResult(item.id)
                      if (!r?.statut || r.statut === "S" || r.statut === "NA") return null
                      return (
                        <tr key={item.id} style={{ borderBottom:"1px solid #f3f4f6" }}>
                          <td style={{ padding:"8px 10px", fontSize:14 }}>{STATUTS.find(s => s.val === r.statut)?.short}</td>
                          <td style={{ padding:"8px 10px", color:"#6b7280" }}>{zone.label}</td>
                          <td style={{ padding:"8px 10px", fontWeight:500 }}>{item.label}</td>
                          <td style={{ padding:"8px 10px" }}>{r.action || "—"}</td>
                          <td style={{ padding:"8px 10px", whiteSpace:"nowrap" }}>{r.deadline || r.deadlineType || "—"}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recommandations */}
        <div style={{ marginBottom:24, padding:"16px 20px", background:"#fff", borderRadius:10, border:"1px solid #e5e7eb" }}>
          <h3 style={{ fontSize:15, fontWeight:600, margin:"0 0 12px", color:"#111", borderLeft:"3px solid #0284c7", paddingLeft:10 }}>
            Recommandations
          </h3>
          <ol style={{ margin:0, paddingLeft:20 }}>
            {recommandations.map((rec, i) => (
              <li key={i} style={{ fontSize:13, color:"#374151", lineHeight:1.7, marginBottom:6 }}>{rec}</li>
            ))}
          </ol>
        </div>

        {/* Pied de page */}
        <div style={{ marginTop:32, paddingTop:16, borderTop:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", fontSize:12, color:"#9ca3af" }}>
          <div>Rapport généré le {new Date().toLocaleDateString("fr-FR")} via ProAudit</div>
          <div>Prosuma — Audit de supervision</div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div style={{ display:"flex", gap:8, marginTop:24, paddingTop:16, borderTop:"1px solid #e5e7eb" }}>
        {audit.status === "draft" && (
          <Link href={`/audit/nouveau?draft=${audit.id}`}
            style={{
              padding:"12px 20px", borderRadius:8, background:"#ED7D31", color:"#fff",
              fontSize:14, textDecoration:"none", fontWeight:500
            }}>
            Reprendre le brouillon
          </Link>
        )}
        <Link href="/dashboard"
          style={{
            padding:"12px 20px", borderRadius:8, background:"#fff", color:"#111",
            fontSize:14, textDecoration:"none", border:"0.5px solid #e5e7eb",
            display:"flex", alignItems:"center", gap:6, fontWeight:500
          }}>
          <LayoutDashboard size={16} /> Retour dashboard
        </Link>
      </div>
    </div>
  )
}
