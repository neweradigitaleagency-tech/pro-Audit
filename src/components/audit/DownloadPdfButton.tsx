"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { generateReportHtml } from "@/lib/generateReportHtml"
import type { ResultItem } from "@/lib/audit/zones"

interface Props {
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
}

export function DownloadPdfButton(props: Props) {
  const [loading, setLoading] = useState(false)

  function handleDownload() {
    setLoading(true)
    try {
      const html = generateReportHtml(props)
      const blob = new Blob([html], { type: "text/html;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const slug = (props.ref || props.magasinName).replace(/[^a-zA-Z0-9]/g, "_")
      a.download = `rapport-${slug}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error("HTML generation error", e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      style={{
        display:"flex", alignItems:"center", gap:6,
        padding:"12px 20px", borderRadius:8, border:"none",
        background: loading ? "#d1d5db" : "#ED7D31", color:"#fff",
        fontSize:14, fontWeight:500, cursor: loading ? "wait" : "pointer",
      }}
    >
      <Download size={18} />
      {loading ? "Génération..." : "Télécharger le rapport (HTML/PDF)"}
    </button>
  )
}
