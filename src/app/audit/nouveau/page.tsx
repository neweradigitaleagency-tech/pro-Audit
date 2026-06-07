"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  ZONES, STATUTS, CAT_ICONS, today,
  scoreOf, computeCounts, getAllCats
} from "@/lib/audit/zones"
import type { AuditHeader, ResultItem, CustomItem, AuditMode, Zone, AuditItem } from "@/lib/audit/zones"
import { ItemCard } from "@/components/audit/ItemCard"
import { StoreAutocomplete } from "@/components/audit/StoreAutocomplete"
import { ArrowLeft, Save, Check, Plus, X } from "lucide-react"

export default function NewAuditPage() {
  const router = useRouter()

  const [page, setPage] = useState<"header" | "audit" | "summary">("header")
  const [header, setHeader] = useState<AuditHeader>({
    date: today(), heure: "", superviseur: "", responsable: "", magasin: ""
  })
  const [results, setResults] = useState<Record<string, ResultItem>>({})
  const [customItems, setCustomItems] = useState<Record<string, CustomItem[]>>({})
  const [zoneIdx, setZoneIdx] = useState(0)
  const [auditMode, setAuditMode] = useState<AuditMode>("zone")
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [auditId, setAuditId] = useState<string | null>(null)
  const [magasins, setMagasins] = useState<string[]>([])
  const [nameLoaded, setNameLoaded] = useState(false)
  const [newCustomCat, setNewCustomCat] = useState("Autre")
  const [newCustomLabel, setNewCustomLabel] = useState("")
  const [addingCustomZone, setAddingCustomZone] = useState<string | null>(null)

  const zonesLive: Zone[] = ZONES.map(z => ({
    ...z,
    items: z.id === "custom"
      ? (customItems["custom"] || [])
      : [...z.items, ...(customItems[z.id] || [])]
  }))

  const allCats = getAllCats(zonesLive.filter(z => z.id !== "custom"))

  const autoSaveRef = useRef<ReturnType<typeof setInterval>>(undefined)

  const headerOk = header.superviseur.trim() && header.responsable.trim() && header.magasin.trim()

  useEffect(() => {
    loadMagasins()
    const supabase = createClient()
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) await loadUserName(supabase, session.user)
      else setNameLoaded(true)
    })()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadUserName(supabase, session.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadUserName(supabase: ReturnType<typeof createClient>, user: { id: string; user_metadata?: Record<string, unknown> }) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle()
      const name = profile?.full_name || (user.user_metadata?.full_name as string) || ""
      if (name) {
        setHeader(prev => ({ ...prev, superviseur: name }))
        setNameLoaded(true)
        if (!profile?.full_name) {
          await supabase.from("profiles").update({ full_name: name }).eq("id", user.id)
        }
      } else {
        setNameLoaded(true)
      }
    } catch { setNameLoaded(true) }
  }

  async function saveProfileName(name: string) {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle()
      if (profile && !profile.full_name) {
        await supabase.from("profiles").update({ full_name: name }).eq("id", user.id)
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (page !== "audit") return
    autoSaveRef.current = setInterval(saveDraft, 30000)
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current) }
  }, [page, header, results, customItems, zoneIdx, auditMode, selectedCat])

  const setStatut = useCallback((itemId: string, statut: "S" | "M" | "NS" | "NA") => {
    setResults(prev => {
      const r = { ...prev }
      const cur = r[itemId] ? { ...r[itemId] } : {}
      if (cur.statut === statut) {
        delete cur.statut
        r[itemId] = Object.keys(cur).length ? cur : undefined!
        if (!r[itemId]) delete r[itemId]
      } else {
        cur.statut = statut
        if (statut === "S" || statut === "NA") {
          delete cur.action; delete cur.deadlineType; delete cur.deadline
        }
        r[itemId] = cur
      }
      return r
    })
  }, [])

  const setField = useCallback((itemId: string, field: string, value: string) => {
    setResults(prev => {
      const r = { ...prev }
      r[itemId] = { ...(r[itemId] || {}), [field]: value }
      return r
    })
  }, [])

  const toggleItem = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const n = new Set(prev)
      if (n.has(itemId)) n.delete(itemId); else n.add(itemId)
      return n
    })
  }, [])

  const addPhoto = useCallback((itemId: string, files: FileList) => {
    Array.from(files).forEach(f => {
      const reader = new FileReader()
      reader.onload = () => {
        setResults(prev => {
          const r = { ...prev }
          const cur = { ...(r[itemId] || {}) }
          const urls = [...(cur.photoUrls || []), { name: f.name, url: reader.result as string }]
          cur.photoUrls = urls
          r[itemId] = cur
          return r
        })
      }
      reader.readAsDataURL(f)
    })
  }, [])

  const removePhoto = useCallback((itemId: string, photoName: string) => {
    setResults(prev => {
      const r = { ...prev }
      const cur = { ...(r[itemId] || {}) }
      cur.photoUrls = (cur.photoUrls || []).filter(p => p.name !== photoName)
      r[itemId] = cur
      return r
    })
  }, [])

  function addCustomItem(zoneId: string) {
    if (!newCustomLabel.trim()) return
    const item: CustomItem = { id: `cx_${Date.now()}`, cat: newCustomCat, label: newCustomLabel.trim() }
    setCustomItems(prev => ({ ...prev, [zoneId]: [...(prev[zoneId] || []), item] }))
    setNewCustomLabel("")
    setAddingCustomZone(null)
  }

  function removeCustomItem(zoneId: string, itemId: string) {
    setCustomItems(prev => ({
      ...prev,
      [zoneId]: (prev[zoneId] || []).filter(i => i.id !== itemId)
    }))
    setResults(prev => { const r = { ...prev }; delete r[itemId]; return r })
  }

  function totalAnswered(): number {
    return Object.values(results).filter(r => r?.statut).length
  }

  function totalItems(): number {
    return zonesLive.reduce((sum, z) => sum + z.items.length, 0)
  }

  async function loadMagasins() {
    try {
      const { data } = await createClient().from("magasins").select("name")
      if (data) setMagasins(data.map(m => m.name))
    } catch { /* ignore */ }
  }

  async function saveDraft() {
    const counts = computeCounts(results)
    const score = scoreOf(results)
    try {
      const payload = {
        magasin_name: header.magasin,
        superviseur: header.superviseur,
        responsable: header.responsable,
        date: header.date,
        heure: header.heure,
        results: JSON.parse(JSON.stringify(results)),
        custom_items: JSON.parse(JSON.stringify(customItems)),
        counts: JSON.parse(JSON.stringify(counts)),
        score,
        status: "draft" as const,
      }
      if (auditId) {
        const res = await fetch("/api/audits", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, id: auditId }),
        });
        if (!res.ok) { const d = await res.json(); console.error("saveDraft error", d.error); return; }
      } else {
        const res = await fetch("/api/audits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { const d = await res.json(); console.error("saveDraft error", d.error); return; }
        const d = await res.json();
        if (d.id) setAuditId(d.id)
      }
    } catch (e) { console.error("saveDraft error", e) }
  }

  async function saveFinal() {
    setSaving(true)
    if (header.superviseur.trim()) saveProfileName(header.superviseur.trim())
    const counts = computeCounts(results)
    const score = scoreOf(results)
    let finalId = auditId
    try {
      const payload = {
        magasin_name: header.magasin,
        superviseur: header.superviseur,
        responsable: header.responsable,
        date: header.date,
        heure: header.heure,
        results: JSON.parse(JSON.stringify(results)),
        custom_items: JSON.parse(JSON.stringify(customItems)),
        counts: JSON.parse(JSON.stringify(counts)),
        score,
        status: "final" as const,
      }
      if (finalId) {
        const res = await fetch("/api/audits", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, id: finalId }),
        });
        if (!res.ok) { const d = await res.json(); setError(d.error); setSaving(false); return; }
      } else {
        const res = await fetch("/api/audits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { const d = await res.json(); setError(d.error); setSaving(false); return; }
        const d = await res.json();
        if (d.id) { finalId = d.id; setAuditId(d.id) }
      }
      if (finalId) router.push(`/audits/${finalId}`)
    } catch (e) {
      setError(`Erreur de sauvegarde: ${e instanceof Error ? e.message : "Vérifie ta connexion"}`);
    }
    finally { setSaving(false) }
  }

  const progressPct = totalItems() > 0 ? Math.round(totalAnswered() / totalItems() * 100) : 0

  if (page === "summary") {
    const counts = computeCounts(results)
    const score = scoreOf(results)
    const total = Object.keys(results).length
    const totalS = counts.S || 0
    const totalM = counts.M || 0
    const totalNS = counts.NS || 0
    const totalNA = counts.NA || 0
    const barTotal = totalS + totalM + totalNS + totalNA || 1
    const pctS = (totalS / barTotal) * 100
    const pctM = (totalM / barTotal) * 100
    const pctNS = (totalNS / barTotal) * 100
    const pctNA = (totalNA / barTotal) * 100

    const zonesWithItems = zonesLive.map(z => ({
      ...z,
      items: z.items.filter(it => results[it.id]?.statut)
    })).filter(z => z.items.length > 0)

    const itemsWithAction = Object.entries(results).filter(([, r]) => r?.action || r?.statut === "M" || r?.statut === "NS")

    function interprétation(s: number): string {
      if (s >= 90) return "Excellent"
      if (s >= 80) return "Très bon"
      if (s >= 70) return "Bon"
      if (s >= 60) return "Moyen"
      if (s >= 40) return "Insuffisant"
      return "CRITIQUE"
    }

    function scoreColor(s: number): string {
      return s >= 80 ? "#16a34a" : s >= 60 ? "#d97706" : "#dc2626"
    }

    function résuméScore(s: number): string {
      if (s >= 80) return "Niveau de conformité satisfaisant sur l'ensemble des critères."
      if (s >= 60) return "Points d'amélioration notables. Des écarts nécessitent une attention particulière."
      return "Défaillances significatives dans plusieurs zones. Des actions correctives immédiates sont indispensables."
    }

    return (
      <div style={{ maxWidth:680, margin:"0 auto", padding:"1.5rem 1rem" }}>

        {/* Top bar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={() => setPage("audit")} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }} aria-label="Retour">
              <ArrowLeft size={20} color="#111" />
            </button>
            <h1 style={{ fontSize:16, fontWeight:600, color:"#111", margin:0 }}>Aperçu du rapport</h1>
          </div>
        </div>

        <div id="preview-content">

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
                ["Magasin", header.magasin],
                ["Date", `${header.date}${header.heure ? ` · ${header.heure}` : ""}`],
                ["Superviseur", header.superviseur],
                ...(header.responsable ? [["Responsable", header.responsable]] : []),
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
              <div style={{ height:6, borderRadius:3, background:"#e5e7eb", overflow:"hidden", marginBottom:8 }}>
                <div style={{ height:"100%", borderRadius:3, width:`${score}%`, background: score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626" }} />
              </div>
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
            {zonesWithItems.map(zone => {
              const zoneS = zone.items.filter(it => results[it.id]?.statut === "S").length
              const zoneM = zone.items.filter(it => results[it.id]?.statut === "M").length
              const zoneNS = zone.items.filter(it => results[it.id]?.statut === "NS").length
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
                {zonesWithItems.flatMap(zone =>
                  zone.items.map(item => {
                    const r = results[item.id]
                    if (!r?.statut || r.statut === "S" || r.statut === "NA") return null
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
          <div style={{ paddingTop:12, borderTop:"0.5px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6, marginBottom:16 }}>
            <span style={{ fontSize:11, color:"#9ca3af" }}>Aperçu généré le {(() => { const d = new Date(); return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}` })()}</span>
            <span style={{ fontSize:11, color:"#9ca3af" }}>Prosuma — ProAudit</span>
          </div>
        </div>

        {error && (
          <div style={{ fontSize:12, color:"#dc2626", background:"#fee2e2", padding:"8px 12px", borderRadius:6, marginBottom:12 }}>
            {error}
          </div>
        )}

        <div style={{ display:"flex", gap:8, justifyContent:"center", borderTop:"0.5px solid #e5e7eb", paddingTop:16 }}>
          <button onClick={() => setPage("audit")}
            style={{ padding:"12px 20px", borderRadius:8, border:"0.5px solid #e5e7eb", background:"#fff", color:"#111", fontSize:14, cursor:"pointer", flex:1 }}>
            ← Retour à l&apos;audit
          </button>
          <button onClick={saveFinal} disabled={saving}
            style={{
              padding:"12px 20px", borderRadius:8, border:"none",
              background: saving ? "#d1d5db" : "#16a34a", color:"#fff",
              fontSize:14, fontWeight:500, cursor: saving ? "wait" : "pointer", flex:1
            }}>
            {saving ? "Enregistrement..." : "✓ Confirmer et enregistrer"}
          </button>
        </div>
      </div>
    )
  }

  if (page === "header") {
    return (
      <div style={{ maxWidth:560, margin:"0 auto", padding:"1.5rem 1rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
          <button onClick={() => router.back()} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }} aria-label="Retour">
            <ArrowLeft size={20} color="#111" />
          </button>
          <h1 style={{ fontSize:20, fontWeight:600, color:"#111", margin:0 }}>Nouvel audit</h1>
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:13, fontWeight:500, color:"#374151", display:"block", marginBottom:4 }}>Magasin</label>
          <StoreAutocomplete
            value={header.magasin}
            onChange={v => setHeader(p => ({...p, magasin: v}))}
            placeholder="Rechercher un magasin..."
          />
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:13, fontWeight:500, color:"#374151", display:"block", marginBottom:4 }}>Superviseur</label>
          <input
            value={header.superviseur}
            onChange={e => setHeader(p => ({...p, superviseur: e.target.value}))}
            placeholder="Nom du superviseur"
            disabled={nameLoaded && !!header.superviseur}
            style={{
              width:"100%", padding:"12px", borderRadius:8,
              border:"0.5px solid #d1d5db", fontSize:14, fontFamily:"inherit",
              ...(nameLoaded && header.superviseur ? { background:"#f3f4f6", color:"#6b7280" } : {})
            }}
          />
          {nameLoaded && !header.superviseur && (
            <div style={{ fontSize:11, color:"#f59e0b", marginTop:4 }}>
              Aucun nom trouvé sur ton profil. Saisis ton nom une fois, il sera mémorisé.
            </div>
          )}
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:13, fontWeight:500, color:"#374151", display:"block", marginBottom:4 }}>Responsable magasin</label>
          <input
            value={header.responsable}
            onChange={e => setHeader(p => ({...p, responsable: e.target.value}))}
            placeholder="Nom du responsable"
            style={{ width:"100%", padding:"12px", borderRadius:8, border:"0.5px solid #d1d5db", fontSize:14, fontFamily:"inherit" }}
          />
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:24 }}>
          <div>
            <label style={{ fontSize:13, fontWeight:500, color:"#374151", display:"block", marginBottom:4 }}>Date</label>
            <input type="date" value={header.date}
              onChange={e => setHeader(p => ({...p, date: e.target.value}))}
              style={{ width:"100%", padding:"12px", borderRadius:8, border:"0.5px solid #d1d5db", fontSize:14, fontFamily:"inherit" }}
            />
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:500, color:"#374151", display:"block", marginBottom:4 }}>Heure</label>
            <input type="time" value={header.heure}
              onChange={e => setHeader(p => ({...p, heure: e.target.value}))}
              style={{ width:"100%", padding:"12px", borderRadius:8, border:"0.5px solid #d1d5db", fontSize:14, fontFamily:"inherit" }}
            />
          </div>
        </div>

        <button
          onClick={() => setPage("audit")}
          disabled={!headerOk}
          style={{
            width:"100%", padding:"14px", borderRadius:8, border:"none",
            fontSize:15, fontWeight:500, cursor: headerOk ? "pointer" : "not-allowed",
            background: headerOk ? "#ED7D31" : "#d1d5db", color:"#fff"
          }}
        >
          Démarrer l'audit
        </button>
      </div>
    )
  }

  const currentZone = zonesLive[zoneIdx]
  const zoneItems = auditMode === "zone"
    ? currentZone?.items || []
    : zonesLive
        .filter(z => z.id !== "custom")
        .flatMap(z => z.items.filter(i => i.cat === selectedCat).map(i => ({ ...i, _zoneLabel: z.label, _zoneId: z.id })))
  const total = totalItems()
  const answered = totalAnswered()

  return (
    <div style={{ maxWidth:560, margin:"0 auto", padding:"1rem" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <button onClick={() => setPage("header")} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }} aria-label="Retour">
          <ArrowLeft size={20} color="#111" />
        </button>
        <div style={{ fontSize:12, color:"#6b7280", textAlign:"center" }}>
          {header.magasin} · {header.date}
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={saveDraft} style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:"#6b7280" }} aria-label="Sauvegarder brouillon">
            <Save size={18} />
          </button>
          <button onClick={saveFinal} disabled={saving} style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:"#16a34a" }} aria-label="Finaliser">
            <Check size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{ fontSize:12, color:"#dc2626", background:"#fee2e2", padding:"8px 12px", borderRadius:6, marginBottom:12 }}>
          {error}
        </div>
      )}

      <div style={{ height:6, background:"#f3f4f6", borderRadius:3, marginBottom:12 }}>
        <div style={{ height:6, borderRadius:3, background:"#ED7D31", width:`${progressPct}%` }} />
      </div>
      <div style={{ fontSize:12, color:"#9ca3af", textAlign:"center", marginBottom:12 }}>
        {answered}/{total} r&eacute;pondu{answered > 1 ? "s" : ""} ({progressPct}%)
      </div>

      <div style={{ position:"sticky", top:0, zIndex:10, background:"#fff", borderBottom:"1px solid #e5e7eb", marginLeft:"-1rem", marginRight:"-1rem", padding:"8px 1rem 0" }}>
        <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:6 }}>
          <button onClick={() => { setAuditMode("zone"); setSelectedCat(null) }}
            style={{
              padding:"6px 16px", borderRadius:20, border:"none", fontSize:13, cursor:"pointer",
              background: auditMode === "zone" ? "#ED7D31" : "#f3f4f6",
              color: auditMode === "zone" ? "#fff" : "#6b7280", fontWeight: auditMode === "zone" ? 500 : 400
            }}>
            Par zone
          </button>
          <button onClick={() => { setAuditMode("cat"); setSelectedCat(allCats[0] || null) }}
            style={{
              padding:"6px 16px", borderRadius:20, border:"none", fontSize:13, cursor:"pointer",
              background: auditMode === "cat" ? "#ED7D31" : "#f3f4f6",
              color: auditMode === "cat" ? "#fff" : "#6b7280", fontWeight: auditMode === "cat" ? 500 : 400
            }}>
            Par catégorie
          </button>
        </div>

        {auditMode === "zone" ? (
          <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:8 }}>
            {zonesLive.map((z, i) => {
              const zoneDone = z.items.filter(it => results[it.id]?.statut).length
              const zoneTotal = z.items.length
              const hasNS = z.items.some(it => results[it.id]?.statut === "NS")
              const allDone = zoneDone === zoneTotal && zoneTotal > 0
              return (
                <button key={z.id} onClick={() => setZoneIdx(i)}
                  style={{
                    flexShrink:0, display:"flex", alignItems:"center", gap:4,
                    padding:"8px 12px", borderRadius:20, border:"none", fontSize:12, cursor:"pointer",
                    background: i === zoneIdx ? "#ED7D31" : hasNS ? "#fee2e2" : allDone ? "#dcfce7" : "#f3f4f6",
                    color: i === zoneIdx ? "#fff" : hasNS ? "#dc2626" : allDone ? "#16a34a" : "#6b7280",
                    fontWeight: i === zoneIdx ? 500 : 400
                  }}>
                  <span>{z.icon}</span>
                  <span style={{ whiteSpace:"nowrap" }}>{z.label.split(" ")[0]}</span>
                  {zoneTotal > 0 && (
                    <span style={{ fontSize:10, opacity:0.8 }}>{zoneDone}/{zoneTotal}</span>
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:8 }}>
            {allCats.map(cat => {
              const catItems = zonesLive.flatMap(z => z.items).filter(i => i.cat === cat)
              const catDone = catItems.filter(it => results[it.id]?.statut).length
              const catTotal = catItems.length
              return (
                <button key={cat} onClick={() => setSelectedCat(cat)}
                  style={{
                    flexShrink:0, display:"flex", alignItems:"center", gap:4,
                    padding:"8px 12px", borderRadius:20, border:"none", fontSize:12, cursor:"pointer",
                    background: selectedCat === cat ? "#ED7D31" : "#f3f4f6",
                    color: selectedCat === cat ? "#fff" : "#6b7280",
                    fontWeight: selectedCat === cat ? 500 : 400
                  }}>
                  <span>{CAT_ICONS[cat] || "📋"}</span>
                  <span style={{ whiteSpace:"nowrap" }}>{cat}</span>
                  <span style={{ fontSize:10, opacity:0.8 }}>{catDone}/{catTotal}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {auditMode === "zone" ? (
        <>
          <h2 style={{ fontSize:16, fontWeight:600, color:"#111", margin:"12px 0 4px" }}>
            {currentZone.icon} {currentZone.label}
          </h2>
          <div style={{ fontSize:12, color:"#9ca3af", marginBottom:12 }}>
            {currentZone.items.filter(it => results[it.id]?.statut).length}/{currentZone.items.length} r&eacute;pondu{currentZone.items.filter(it => results[it.id]?.statut).length > 1 ? "s" : ""}
          </div>

          {currentZone.id !== "custom" && (
            <div style={{ marginBottom:8 }}>
              <button onClick={() => setAddingCustomZone(addingCustomZone === currentZone.id ? null : currentZone.id)}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 12px", borderRadius:8, border:"0.5px dashed #d1d5db", background:"#f9fafb", color:"#6b7280", fontSize:13, cursor:"pointer", width:"100%" }}>
                {addingCustomZone === currentZone.id ? <X size={16} /> : <Plus size={16} />}
                Ajouter un item personnalisé
              </button>
              {addingCustomZone === currentZone.id && (
                <div style={{ marginTop:8, padding:12, background:"#f9fafb", borderRadius:8, border:"0.5px solid #e5e7eb" }}>
                  <select value={newCustomCat} onChange={e => setNewCustomCat(e.target.value)}
                    style={{ width:"100%", padding:"8px", borderRadius:6, border:"0.5px solid #d1d5db", fontSize:13, marginBottom:8, fontFamily:"inherit" }}>
                    {Object.keys(CAT_ICONS).map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                  </select>
                  <input value={newCustomLabel} onChange={e => setNewCustomLabel(e.target.value)}
                    placeholder="Description du critère"
                    style={{ width:"100%", padding:"8px", borderRadius:6, border:"0.5px solid #d1d5db", fontSize:13, marginBottom:8, fontFamily:"inherit" }}
                    onKeyDown={e => { if (e.key === "Enter") addCustomItem(currentZone.id) }}
                  />
                  <button onClick={() => addCustomItem(currentZone.id)} disabled={!newCustomLabel.trim()}
                    style={{
                      padding:"8px 16px", borderRadius:6, border:"none", cursor: newCustomLabel.trim() ? "pointer" : "not-allowed",
                      background: newCustomLabel.trim() ? "#ED7D31" : "#d1d5db", color:"#fff", fontSize:13
                    }}>
                    Ajouter
                  </button>
                </div>
              )}
            </div>
          )}

          {zoneItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              result={results[item.id]}
              expanded={expandedItems.has(item.id)}
              isCustom={item.id.startsWith("cx_")}
              onStatut={setStatut}
              onField={setField}
              onToggle={toggleItem}
              onAddPhoto={addPhoto}
              onRemovePhoto={removePhoto}
              onRemoveCustom={item.id.startsWith("cx_") ? (id) => removeCustomItem(currentZone.id, id) : undefined}
            />
          ))}

          <div style={{ display:"flex", gap:8, marginTop:16, marginBottom:40 }}>
            <button
              onClick={() => setZoneIdx(Math.max(0, zoneIdx - 1))}
              disabled={zoneIdx === 0}
              style={{
                flex:1, padding:"12px", borderRadius:8, border:"0.5px solid #e5e7eb",
                background:"#fff", color:"#111", fontSize:14, cursor: zoneIdx === 0 ? "not-allowed" : "pointer", opacity: zoneIdx === 0 ? 0.5 : 1
              }}>
              Précédent
            </button>
            {zoneIdx < zonesLive.length - 1 ? (
              <button onClick={() => setZoneIdx(zoneIdx + 1)}
                style={{ flex:1, padding:"12px", borderRadius:8, border:"none", background:"#ED7D31", color:"#fff", fontSize:14, cursor:"pointer" }}>
                Zone suivante →
              </button>
            ) : (
              <button onClick={() => setPage("summary")}
                style={{ flex:1, padding:"12px", borderRadius:8, border:"none", background:"#0284c7", color:"#fff", fontSize:14, cursor:"pointer" }}>
                Aperçu du rapport →
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          {zoneItems.map((item: AuditItem & { _zoneLabel?: string; _zoneId?: string }) => (
            <ItemCard
              key={item.id}
              item={item}
              result={results[item.id]}
              expanded={expandedItems.has(item.id)}
              zoneLabel={item._zoneLabel}
              showZone={true}
              isCustom={item.id.startsWith("cx_")}
              onStatut={setStatut}
              onField={setField}
              onToggle={toggleItem}
              onAddPhoto={addPhoto}
              onRemovePhoto={removePhoto}
              onRemoveCustom={item.id.startsWith("cx_") ? (id) => removeCustomItem(item._zoneId || "", id) : undefined}
            />
          ))}

          <button onClick={() => setPage("summary")}
            style={{
              width:"100%", padding:"14px", borderRadius:8, border:"none",
              background:"#0284c7", color:"#fff", fontSize:15, fontWeight:500,
              cursor:"pointer", marginTop:16, marginBottom:40
            }}>
            Aperçu du rapport →
          </button>
        </>
      )}
    </div>
  )
}
