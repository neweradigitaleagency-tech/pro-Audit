"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import type * as XLSXType from "xlsx"
import { ZONES, STATUTS } from "@/lib/audit/zones"
import type { ResultItem } from "@/lib/audit/zones"

interface Props {
  magasinName: string
  date: string
  superviseur: string
  score: number
  results: Record<string, ResultItem>
  customItems: Record<string, { id: string; cat: string; label: string }[]>
}

const STATUT_MAP: Record<string, string> = {
  S: "Satisfaisant",
  M: "Moyen",
  NS: "Non satisfaisant",
  NA: "N/A",
}

const DEADLINE_MAP: Record<string, string> = {
  immediat: "Immédiat",
  continu: "En continu",
  date: "Date fixée",
}

function findItemMeta(itemId: string) {
  for (const zone of ZONES) {
    for (const item of zone.items) {
      if (item.id === itemId) return { zone: zone.label, cat: item.cat, label: item.label }
    }
  }
  return null
}

export function DownloadExcelButton({ magasinName, date, superviseur, score, results, customItems }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const XLSX = await import("xlsx") as unknown as typeof XLSXType

      const rows: Record<string, string>[] = []

      for (const [itemId, r] of Object.entries(results)) {
        if (!r?.statut) continue
        const meta = findItemMeta(itemId)
        const zone = meta?.zone || ""
        const cat = meta?.cat || ""
        const label = meta?.label || ""
        rows.push({
          Magasin: magasinName,
          Date: date,
          Superviseur: superviseur,
          Score: `${score}%`,
          Zone: zone,
          Catégorie: cat,
          Critère: label,
          Résultat: STATUT_MAP[r.statut] || r.statut,
          Commentaire: r.comment || "",
          "Plan action": r.action || "",
          "Type délai": r.deadlineType ? (DEADLINE_MAP[r.deadlineType] || r.deadlineType) : "",
          "Date deadline": r.deadline || "",
          Statut: "En cours",
        })
      }

      for (const [zoneId, items] of Object.entries(customItems)) {
        for (const item of items) {
          const r = results[item.id]
          if (!r?.statut) continue
          const zoneLabel = ZONES.find(z => z.id === zoneId)?.label || zoneId
          rows.push({
            Magasin: magasinName,
            Date: date,
            Superviseur: superviseur,
            Score: `${score}%`,
            Zone: zoneLabel,
            Catégorie: item.cat,
            Critère: item.label,
            Résultat: STATUT_MAP[r.statut] || r.statut,
            Commentaire: r.comment || "",
            "Plan action": r.action || "",
            "Type délai": r.deadlineType ? (DEADLINE_MAP[r.deadlineType] || r.deadlineType) : "",
            "Date deadline": r.deadline || "",
            Statut: "En cours",
          })
        }
      }

      const ws = XLSX.utils.json_to_sheet(rows)
      const colWidths = [
        { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 6 },
        { wch: 22 }, { wch: 22 }, { wch: 55 }, { wch: 16 },
        { wch: 30 }, { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
      ]
      ws["!cols"] = colWidths

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Audit")

      const dateKey = date.replace(/-/g, "")
      const magasinShort = magasinName.replace("Prosuma ", "").replace(/\s+/g, "_")
      XLSX.writeFile(wb, `Detail_${magasinShort}_${dateKey}.xlsx`)
    } catch (e) {
      console.error("Excel generation error", e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="download-btn"
      style={{
        display:"inline-flex", alignItems:"center", justifyContent:"center", gap:4,
        padding:"8px 12px", borderRadius:6, border:"none",
        background: loading ? "#d1d5db" : "#0284c7", color:"#fff",
        fontSize:13, fontWeight:500, cursor: loading ? "wait" : "pointer",
        whiteSpace:"nowrap", lineHeight:1,
      }}
    >
      <Download size={15} />
      {loading ? "..." : "Excel"}
    </button>
  )
}
