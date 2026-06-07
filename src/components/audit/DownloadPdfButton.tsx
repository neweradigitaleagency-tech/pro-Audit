"use client"

import { useState } from "react"
import { Download } from "lucide-react"

export function DownloadPdfButton() {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const html2canvas = (await import("html2canvas")).default
      const { jsPDF } = await import("jspdf")

      const el = document.getElementById("report-content")
      if (!el) return

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({ format: "a4", unit: "mm" })
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = (canvas.height * pdfW) / canvas.width

      let remainingH = pdfH
      let srcY = 0
      const pageH = pdf.internal.pageSize.getHeight()

      while (remainingH > 0) {
        const sliceH = Math.min(remainingH, pageH - 20)
        const canvasSlice = document.createElement("canvas")
        canvasSlice.width = canvas.width
        canvasSlice.height = (sliceH * canvas.width) / pdfW
        const ctx = canvasSlice.getContext("2d")!
        ctx.drawImage(canvas, 0, srcY, canvas.width, canvasSlice.height, 0, 0, canvas.width, canvasSlice.height)
        const sliceData = canvasSlice.toDataURL("image/png")
        pdf.addImage(sliceData, "PNG", 0, 10, pdfW, sliceH)
        remainingH -= sliceH
        srcY += canvasSlice.height * (pdfW / canvas.width)
        if (remainingH > 0) pdf.addPage()
      }

      pdf.save("rapport-audit.pdf")
    } catch (e) {
      console.error("PDF generation error", e)
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
      {loading ? "Génération..." : "Télécharger le rapport PDF"}
    </button>
  )
}
