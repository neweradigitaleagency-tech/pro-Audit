"use client"

import { useState, useRef } from "react"
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
  auditRef?: string
}

export function DownloadPdfButton(props: Props) {
  const [loading, setLoading] = useState(false)
  const downloadLinkRef = useRef<HTMLAnchorElement | null>(null)

  function handleDownload() {
    setLoading(true)
    try {
      const html = generateReportHtml(props)
      const slug = (props.auditRef || props.magasinName).replace(/[^a-zA-Z0-9]/g, "_")

      const dataUrl = "data:text/html;charset=utf-8," + encodeURIComponent(html)

      if (!downloadLinkRef.current) {
        const a = document.createElement("a")
        a.style.display = "none"
        document.body.appendChild(a)
        downloadLinkRef.current = a
      }

      const a = downloadLinkRef.current
      a.href = dataUrl
      a.download = `rapport-${slug}.html`
      a.click()

      setTimeout(() => setLoading(false), 100)
    } catch (e) {
      console.error("HTML generation error", e)
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
        background: loading ? "#d1d5db" : "#ED7D31", color:"#fff",
        fontSize:13, fontWeight:500, cursor: loading ? "wait" : "pointer",
        whiteSpace:"nowrap", lineHeight:1,
      }}
    >
      <Download size={15} />
      {loading ? "..." : "PDF"}
    </button>
  )
}
