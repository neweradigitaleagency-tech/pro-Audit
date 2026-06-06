"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ArrowLeft, Upload, CheckCircle, AlertCircle } from "lucide-react"

interface OldAudit {
  id: string
  date: string
  heure?: string
  magasin: string
  superviseur: string
  responsable?: string
  results: Record<string, unknown>
  score: number
  counts: Record<string, number>
  customItems?: Record<string, unknown[]>
}

export default function MigrationPage() {
  const router = useRouter()
  const [status, setStatus] = useState<"idle" | "scanning" | "importing" | "done" | "error">("idle")
  const [message, setMessage] = useState("")
  const [imported, setImported] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  async function scanLocalStorage() {
    setStatus("scanning")
    setMessage("Analyse du localStorage...")
    try {
      const raw = localStorage.getItem("mandarine-audits") || localStorage.getItem("prosuma-audits")
      if (!raw) {
        setMessage("Aucune donnée trouvée dans le localStorage.")
        setStatus("idle")
        return
      }
      const data = JSON.parse(raw)
      if (!Array.isArray(data) || data.length === 0) {
        setMessage("Aucun audit à importer.")
        setStatus("idle")
        return
      }
      await importData(data)
    } catch (e) {
      setStatus("error")
      setMessage(`Erreur: ${e instanceof Error ? e.message : "Inconnue"}`)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus("scanning")
    setMessage("Lecture du fichier...")
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const audits = Array.isArray(data) ? data : data.audits || []
      if (!Array.isArray(audits) || audits.length === 0) {
        setMessage("Le fichier ne contient pas d'audits valides.")
        setStatus("idle")
        return
      }
      await importData(audits)
    } catch (e) {
      setStatus("error")
      setMessage(`Erreur de lecture: ${e instanceof Error ? e.message : "Fichier invalide"}`)
    }
  }

  async function importData(audits: OldAudit[]) {
    setStatus("importing")
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setStatus("error")
      setMessage("Connecte-toi d'abord.")
      return
    }

    let success = 0
    const errs: string[] = []

    for (const a of audits) {
      try {
        const { error } = await supabase.from("audits").insert({
          user_id: session.user.id,
          magasin_name: a.magasin || "",
          superviseur: a.superviseur || "",
          responsable: a.responsable || "",
          date: a.date || "",
          heure: a.heure || "",
          results: a.results || {},
          custom_items: a.customItems || {},
          counts: a.counts || { S: 0, M: 0, NS: 0, NA: 0 },
          score: a.score || 0,
          status: "final",
        })
        if (error) errs.push(`${a.magasin} (${a.date}): ${error.message}`)
        else success++
      } catch (e) {
        errs.push(`${a.magasin}: ${e instanceof Error ? e.message : "Erreur"}`)
      }
    }

    setImported(success)
    setErrors(errs)
    setStatus("done")
    setMessage(`${success} audit(s) importé(s) avec succès.${errs.length ? ` ${errs.length} erreur(s).` : ""}`)
  }

  return (
    <div style={{ maxWidth:560, margin:"0 auto", padding:"1.5rem 1rem" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24 }}>
        <Link href="/dashboard" style={{ display:"flex", color:"#111", textDecoration:"none" }} aria-label="Retour">
          <ArrowLeft size={20} />
        </Link>
        <h1 style={{ fontSize:20, fontWeight:600, color:"#111", margin:0 }}>
          Migration des données
        </h1>
      </div>

      <div style={{
        background:"#fff7ed", border:"0.5px solid #fed7aa", borderRadius:10,
        padding:"14px", marginBottom:20, fontSize:13, color:"#9a3412", lineHeight:1.6
      }}>
        Importe ici les audits de l&apos;ancienne application vers ProAudit.
      </div>

      <div style={{
        background:"#fff", borderRadius:10, border:"0.5px solid #e5e7eb",
        padding:"20px", marginBottom:16
      }}>
        <h2 style={{ fontSize:15, fontWeight:600, color:"#111", margin:"0 0 8px" }}>
          Depuis le navigateur (localStorage)
        </h2>
        <p style={{ fontSize:13, color:"#6b7280", margin:"0 0 12px" }}>
          Si tu as déjà utilisé l&apos;ancienne app dans ce navigateur, les données peuvent encore être en localStorage.
        </p>
        <button onClick={scanLocalStorage} disabled={status === "importing"}
          style={{
            padding:"10px 20px", borderRadius:8, border:"none",
            background: "#ED7D31", color:"#fff", fontSize:14, cursor:"pointer",
            opacity: status === "importing" ? 0.6 : 1
          }}>
          Scanner localStorage
        </button>
      </div>

      <div style={{
        background:"#fff", borderRadius:10, border:"0.5px solid #e5e7eb",
        padding:"20px"
      }}>
        <h2 style={{ fontSize:15, fontWeight:600, color:"#111", margin:"0 0 8px" }}>
          Depuis un fichier JSON
        </h2>
        <p style={{ fontSize:13, color:"#6b7280", margin:"0 0 12px" }}>
          Exporte les données de l&apos;ancienne app et importe le fichier JSON ici.
        </p>
        <input
          ref={fileRef}
          type="file" accept=".json"
          onChange={handleFileUpload}
          style={{ display:"none" }}
        />
        <button onClick={() => fileRef.current?.click()} disabled={status === "importing"}
          style={{
            display:"inline-flex", alignItems:"center", gap:6,
            padding:"10px 20px", borderRadius:8, border:"0.5px solid #e5e7eb",
            background:"#f9fafb", color:"#111", fontSize:14, cursor:"pointer",
            opacity: status === "importing" ? 0.6 : 1
          }}>
          <Upload size={16} /> Choisir un fichier JSON
        </button>
      </div>

      {status === "scanning" && (
        <div style={{ textAlign:"center", padding:20, color:"#6b7280", fontSize:14 }}>
          {message}
        </div>
      )}

      {status === "importing" && (
        <div style={{ textAlign:"center", padding:20, color:"#ED7D31", fontSize:14 }}>
          Import en cours...
        </div>
      )}

      {status === "done" && (
        <div style={{
          marginTop:16, padding:"14px", borderRadius:10,
          background: errors.length === 0 ? "#f0fdf4" : "#fef2f2",
          border: `0.5px solid ${errors.length === 0 ? "#bbf7d0" : "#fecaca"}`
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            {errors.length === 0 ? <CheckCircle size={20} color="#16a34a" /> : <AlertCircle size={20} color="#dc2626" />}
            <span style={{ fontSize:14, fontWeight:500, color: errors.length === 0 ? "#16a34a" : "#dc2626" }}>
              {message}
            </span>
          </div>
          {errors.map((e, i) => (
            <div key={i} style={{ fontSize:12, color:"#dc2626", marginTop:4 }}>
              {e}
            </div>
          ))}
          <button onClick={() => router.push("/audits")}
            style={{
              marginTop:12, padding:"10px 20px", borderRadius:8, border:"none",
              background:"#ED7D31", color:"#fff", fontSize:14, cursor:"pointer"
            }}>
            Voir les audits
          </button>
        </div>
      )}

      {status === "error" && (
        <div style={{
          marginTop:16, padding:"14px", borderRadius:10,
          background:"#fef2f2", border:"0.5px solid #fecaca"
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <AlertCircle size={20} color="#dc2626" />
            <span style={{ fontSize:14, color:"#dc2626" }}>{message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
