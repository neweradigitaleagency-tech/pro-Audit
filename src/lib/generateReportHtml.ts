import { ZONES, STATUTS } from "@/lib/audit/zones"
import type { ResultItem } from "@/lib/audit/zones"

function interprétation(score: number): string {
  if (score >= 90) return "Excellent"
  if (score >= 80) return "Très bon"
  if (score >= 70) return "Bon"
  if (score >= 60) return "Moyen"
  if (score >= 40) return "Insuffisant"
  return "CRITIQUE"
}

function scoreColor(s: number): string {
  return s >= 80 ? "#16a34a" : s >= 60 ? "#d97706" : "#dc2626"
}

function todayFR(): string {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export function generateReportHtml(params: {
  magasinName: string
  date: string
  heure: string
  superviseur: string
  responsable: string
  score: number
  counts: Record<string, number>
  total: number
  zonesActives: { id: string; label: string; icon: string; items: { id: string; cat: string; label: string }[] }[]
  results: Record<string, ResultItem>
  itemsWithAction: [string, ResultItem][]
  zonesWithItems: { id: string; label: string; icon: string; items: { id: string; cat: string; label: string }[] }[]
  ref?: string
}): string {
  const {
    magasinName, date, heure, superviseur, responsable,
    score, counts, total, zonesActives, results, itemsWithAction, zonesWithItems, ref,
  } = params

  const totalS = counts.S || 0
  const totalM = counts.M || 0
  const totalNS = counts.NS || 0
  const totalNA = counts.NA || 0

  function zoneRows(): string {
    return zonesActives.map(z => {
      const zi = z.items.filter(it => results[it.id]?.statut)
      const s = zi.filter(it => results[it.id]?.statut === "S").length
      const m = zi.filter(it => results[it.id]?.statut === "M").length
      const ns = zi.filter(it => results[it.id]?.statut === "NS").length
      const has = m > 0 || ns > 0
      return `
        <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:#fff;border-radius:8px;border:${has ? "0.5px solid #fca5a5" : "0.5px solid #e5e7eb"}">
          <span style="font-size:14px;width:22px;text-align:center;flex-shrink:0">${z.icon}</span>
          <span style="font-size:13px;font-weight:500;color:#111;flex:1">${z.label}</span>
          <div style="display:flex;gap:4px;align-items:center">
            <span style="font-size:11px;padding:2px 6px;border-radius:4px;background:#dcfce7;color:#166534;font-weight:500">✓ ${s}</span>
            ${m > 0 ? `<span style="font-size:11px;padding:2px 6px;border-radius:4px;background:#fef3c7;color:#92400e;font-weight:500">⚠ ${m}</span>` : ""}
            ${ns > 0 ? `<span style="font-size:11px;padding:2px 6px;border-radius:4px;background:#fee2e2;color:#991b1b;font-weight:500">✗ ${ns}</span>` : ""}
          </div>
          <span style="font-size:11px;color:#9ca3af">${zi.length}/${z.items.length}</span>
        </div>`
    }).join("")
  }

  function actionRows(): string {
    return zonesActives.flatMap(z =>
      z.items.map(item => {
        const r = results[item.id]
        if (!r?.statut || r.statut === "S" || r.statut === "NA") return []
        const isBad = r.statut === "NS"
        const ddl = r.deadlineType === "immediat" ? "🔴 Immédiat" : r.deadlineType === "continu" ? "🔄 Continu" : r.deadline ? `📅 ${r.deadline}` : ""
        return `<div style="display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border-radius:8px;border:${isBad ? "0.5px solid #fecaca" : "0.5px solid #fde68a"};background:${isBad ? "#fff5f5" : "#fffbeb"}">
          <span style="font-size:13px;flex-shrink:0;margin-top:1px">${isBad ? "✗" : "⚠️"}</span>
          <div style="flex:1">
            <div style="font-size:11px;color:#6b7280;margin-bottom:2px">${z.label}</div>
            <div style="font-size:13px;color:#111;line-height:1.4">${item.label}</div>
            ${r.action ? `<div style="font-size:12px;color:#ED7D31;margin-top:2px">Action : ${r.action}</div>` : ""}
            ${r.comment ? `<div style="font-size:11px;color:#6b7280;font-style:italic;margin-top:2px">${r.comment}</div>` : ""}
          </div>
          ${ddl ? `<span style="font-size:11px;white-space:nowrap;color:#6b7280;flex-shrink:0">${ddl}</span>` : ""}
        </div>`
      })
    ).join("")
  }

  function recoItems(): string {
    const recs: string[] = []
    const nsZ = zonesWithItems.filter(z => z.items.some(it => results[it.id]?.statut === "NS"))
    const mZ = zonesWithItems.filter(z => z.items.some(it => results[it.id]?.statut === "M"))
    if (nsZ.length) recs.push(`Intervenir en priorité sur : <strong>${nsZ.map(z => z.label).join("</strong>, <strong>")}</strong> — zones les plus défaillantes.`)
    if (mZ.length) recs.push(`Renforcer les contrôles sur : <strong>${mZ.map(z => z.label).join("</strong>, <strong>")}</strong>.`)
    if (Object.values(results).filter(r => r?.statut === "NS").length > 5) recs.push("Organiser une réunion de sensibilisation du personnel.")
    if (itemsWithAction.length) recs.push("Assurer un suivi régulier des actions correctives engagées.")
    recs.push("Planifier un audit de suivi sous <strong>30 à 60 jours</strong>.")
    return recs.map((r, i) => `
      <div style="display:flex;gap:8px;align-items:flex-start;font-size:13px;color:#111">
        <div style="min-width:20px;height:20px;border-radius:50%;background:#ED7D31;color:#fff;font-size:11px;font-weight:500;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">${i + 1}</div>
        <span>${r}</span>
      </div>`).join("")
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rapport d'audit - ${magasinName}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#111;background:#fff;padding:0}
.doc{max-width:680px;margin:0 auto;padding:2rem 1rem}
@media print{body{padding:0}.doc{padding:0;max-width:100%}button,.no-print{display:none!important}}
</style>
</head>
<body>
<div class="doc">

<div style="border-bottom:2px solid #ED7D31;padding-bottom:12px;margin-bottom:20px">
  <div style="font-size:11px;font-weight:500;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Prosuma — ProAudit</div>
  <div style="font-size:20px;font-weight:500;color:#111;margin-bottom:10px">Rapport d'Audit de Supervision${ref ? ` <span style="font-size:12px;color:#9ca3af;font-weight:400">— Réf. ${ref}</span>` : ""}</div>
  <div style="display:flex;gap:16px;flex-wrap:wrap">
    ${[["Magasin", magasinName], ["Date", `${date}${heure ? ` · ${heure}` : ""}`], ["Superviseur", superviseur], ...(responsable ? [["Responsable", responsable]] : [])].map(([l, v]) => `<div style="font-size:13px;color:#6b7280"><strong style="color:#111;font-weight:500">${l} :</strong> ${v}</div>`).join("")}
  </div>
</div>

${score < 60 ? `<div style="background:#fff7ed;border:0.5px solid #fed7aa;border-radius:8px;padding:10px 14px;margin-bottom:20px;font-size:12px;color:#9a3412;line-height:1.6"><strong>Attention :</strong> Défaillances significatives dans plusieurs zones. Des actions correctives immédiates sont indispensables.</div>` : ""}

<div style="display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center;background:#f9fafb;border-radius:10px;padding:14px 18px;margin-bottom:20px;border:0.5px solid #e5e7eb">
  <div style="width:72px;height:72px;border-radius:50%;border:3px solid ${scoreColor(score)};display:flex;flex-direction:column;align-items:center;justify-content:center">
    <div style="font-size:22px;font-weight:500;color:${scoreColor(score)};line-height:1">${score}%</div>
    <div style="font-size:9px;color:${scoreColor(score)};margin-top:1px">${score < 60 ? "CRITIQUE" : interprétation(score).toUpperCase()}</div>
  </div>
  <div>
    <div style="font-size:13px;font-weight:500;color:#111;margin-bottom:4px">Score de conformité globale — Niveau ${interprétation(score)}</div>
    <div style="font-size:12px;color:#6b7280;line-height:1.5;margin-bottom:8px">Sur ${total} critère${total > 1 ? "s" : ""} évalués, ${totalS} satisfaisant${totalS > 1 ? "s" : ""}.${itemsWithAction.length > 0 ? ` ${itemsWithAction.length} point${itemsWithAction.length > 1 ? "s" : ""} nécessite${itemsWithAction.length > 1 ? "nt" : ""} un plan d'action correctif.` : ""}</div>
    <div style="height:6px;border-radius:3px;background:#e5e7eb;overflow:hidden;margin-bottom:8px"><div style="height:100%;border-radius:3px;width:${score}%;background:${scoreColor(score)}"></div></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">
      ${[
        { n: totalS, l: "Satisfaisant", c: "#dcfce7", t: "#16a34a" },
        { n: totalM, l: "Moyen", c: "#fef3c7", t: "#d97706" },
        { n: totalNS, l: "Non satisf.", c: "#fee2e2", t: "#dc2626" },
        { n: totalNA, l: "N/A", c: "#f3f4f6", t: "#6b7280" },
      ].map(s => `<div style="padding:6px 0;border-radius:6px;text-align:center;background:${s.c}"><div style="font-size:16px;font-weight:500;line-height:1;color:${s.t}">${s.n}</div><div style="font-size:10px;color:${s.t};margin-top:2px">${s.l}</div></div>`).join("")}
    </div>
  </div>
</div>

<div style="font-size:13px;font-weight:500;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;display:flex;align-items:center;gap:8px;margin-top:4px">
  Synthèse par zone
  <span style="flex:1;height:0.5px;background:#e5e7eb"></span>
</div>
<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:20px">
  ${zoneRows()}
</div>

${itemsWithAction.length > 0 ? `
<div style="font-size:13px;font-weight:500;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;display:flex;align-items:center;gap:8px">
  Actions correctives (${itemsWithAction.length} point${itemsWithAction.length > 1 ? "s" : ""})
  <span style="flex:1;height:0.5px;background:#e5e7eb"></span>
</div>
<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:20px">
  ${actionRows()}
</div>` : ""}

<div style="background:#f9fafb;border:0.5px solid #e5e7eb;border-radius:10px;padding:14px 18px;margin-bottom:20px">
  <div style="font-size:13px;font-weight:500;color:#111;margin-bottom:10px">Recommandations</div>
  <div style="display:flex;flex-direction:column;gap:6px">
    ${recoItems()}
  </div>
</div>

<div style="padding-top:12px;border-top:0.5px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
  <span style="font-size:11px;color:#9ca3af">Rapport généré le ${todayFR()}</span>
  <span style="font-size:11px;color:#9ca3af">Prosuma — ProAudit</span>
</div>

<div class="no-print" style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#6b7280">
  Ouvrir dans Chrome/Edge → Ctrl+P → Enregistrer en PDF
</div>

</div>
</body>
</html>`
}
