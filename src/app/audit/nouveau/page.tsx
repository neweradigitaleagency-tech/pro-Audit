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
  }, [])

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
    return (
      <div style={{ maxWidth:560, margin:"0 auto", padding:"1.5rem 1rem", textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
        <h1 style={{ fontSize:22, fontWeight:600, color:"#111", margin:"0 0 4px" }}>Audit enregistr&eacute;</h1>
        <p style={{ fontSize:14, color:"#6b7280", margin:"0 0 8px" }}>
          {header.magasin} — {header.date}
        </p>
        <div style={{
          fontSize:36, fontWeight:700, color: score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626",
          margin:"16px 0"
        }}>
          {score}%
        </div>
        <div style={{ display:"flex", justifyContent:"center", gap:12, marginBottom:20 }}>
          {STATUTS.map(s => (
            <div key={s.val} style={{ textAlign:"center" }}>
              <div style={{ fontSize:20 }}>{s.short}</div>
              <div style={{ fontSize:13, fontWeight:600, color:"#111" }}>{counts[s.val]}</div>
              <div style={{ fontSize:11, color:"#6b7280" }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button onClick={() => router.push("/audits")}
            style={{ padding:"12px 24px", borderRadius:8, background:"#ED7D31", color:"#fff", border:"none", fontSize:14, cursor:"pointer" }}>
            Voir historique
          </button>
          <button onClick={() => router.push("/dashboard")}
            style={{ padding:"12px 24px", borderRadius:8, background:"#fff", color:"#111", border:"0.5px solid #e5e7eb", fontSize:14, cursor:"pointer" }}>
            Retour dashboard
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
          <input
            list="magasins-list"
            value={header.magasin}
            onChange={e => setHeader(p => ({...p, magasin: e.target.value}))}
            placeholder="Nom du magasin"
            style={{ width:"100%", padding:"12px", borderRadius:8, border:"0.5px solid #d1d5db", fontSize:14, fontFamily:"inherit" }}
          />
          <datalist id="magasins-list">
            {magasins.map(m => <option key={m} value={m} />)}
          </datalist>
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:13, fontWeight:500, color:"#374151", display:"block", marginBottom:4 }}>Superviseur</label>
          <input
            value={header.superviseur}
            onChange={e => setHeader(p => ({...p, superviseur: e.target.value}))}
            placeholder="Nom du superviseur"
            style={{ width:"100%", padding:"12px", borderRadius:8, border:"0.5px solid #d1d5db", fontSize:14, fontFamily:"inherit" }}
          />
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

      <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:12 }}>
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
        <>
          <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:8, marginBottom:12 }}>
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

          <h2 style={{ fontSize:16, fontWeight:600, color:"#111", margin:"0 0 4px" }}>
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
              <button onClick={saveFinal} disabled={saving}
                style={{ flex:1, padding:"12px", borderRadius:8, border:"none", background:"#16a34a", color:"#fff", fontSize:14, cursor:saving?"wait":"pointer" }}>
                {saving ? "Enregistrement..." : "Terminer et sauvegarder"}
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:8, marginBottom:12 }}>
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

          <button onClick={saveFinal} disabled={saving}
            style={{
              width:"100%", padding:"14px", borderRadius:8, border:"none",
              background:"#16a34a", color:"#fff", fontSize:15, fontWeight:500,
              cursor: saving ? "wait" : "pointer", marginTop:16, marginBottom:40
            }}>
            {saving ? "Enregistrement..." : "Terminer et sauvegarder"}
          </button>
        </>
      )}
    </div>
  )
}
