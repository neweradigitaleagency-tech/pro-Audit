import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { ZONES, STATUTS, scoreOf, scoreColor, computeCounts } from "@/lib/audit/zones"
import type { ResultItem } from "@/lib/audit/zones"
import { ArrowLeft, Download, LayoutDashboard } from "lucide-react"

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

  function itemResult(itemId: string): ResultItem | undefined {
    return results[itemId]
  }

  return (
    <div style={{ maxWidth:560, margin:"0 auto", padding:"1.5rem 1rem" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Link href="/audits" style={{ display:"flex", color:"#111", textDecoration:"none" }} aria-label="Retour">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize:18, fontWeight:600, color:"#111", margin:0 }}>{audit.magasin_name}</h1>
            <p style={{ fontSize:13, color:"#6b7280", margin:"2px 0 0" }}>
              {audit.superviseur} · {audit.date}{audit.heure ? ` · ${audit.heure}` : ""}
            </p>
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:28, fontWeight:700, color: scoreColor(score) }}>{score}%</div>
          {audit.status === "draft" && (
            <span style={{ fontSize:11, padding:"1px 6px", borderRadius:4, background:"#fef3c7", color:"#d97706" }}>
              Brouillon
            </span>
          )}
        </div>
      </div>

      {audit.responsable && (
        <div style={{ fontSize:13, color:"#6b7280", marginBottom:16 }}>
          Responsable : {audit.responsable}
        </div>
      )}

      <div style={{ display:"flex", gap:16, justifyContent:"center", marginBottom:20, padding:"16px", background:"#fff", borderRadius:10, border:"0.5px solid #e5e7eb" }}>
        {STATUTS.map(s => (
          <div key={s.val} style={{ textAlign:"center" }}>
            <div style={{ fontSize:22 }}>{s.short}</div>
            <div style={{ fontSize:18, fontWeight:600, color:"#111" }}>{counts[s.val] || 0}</div>
            <div style={{ fontSize:11, color:"#6b7280" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {zonesWithItems.filter(z => z.items.length > 0).map(zone => {
          const zoneResults = zone.items.filter(it => results[it.id]?.statut)
          if (zoneResults.length === 0) return null
          return (
            <div key={zone.id} style={{
              background:"#fff", borderRadius:10, border:"0.5px solid #e5e7eb", overflow:"hidden"
            }}>
              <div style={{
                padding:"10px 14px", borderBottom:"0.5px solid #e5e7eb",
                display:"flex", alignItems:"center", justifyContent:"space-between"
              }}>
                <div style={{ fontSize:14, fontWeight:500, color:"#111" }}>
                  {zone.icon} {zone.label}
                </div>
                <div style={{ fontSize:12, color:"#6b7280" }}>
                  {zoneResults.length}/{zone.items.length}
                </div>
              </div>
              {zone.items.map(item => {
                const r = itemResult(item.id)
                if (!r?.statut) return null
                const st = STATUTS.find(s => s.val === r.statut)
                return (
                  <div key={item.id} style={{
                    padding:"10px 14px", borderBottom:"0.5px solid #f3f4f6",
                    display:"flex", alignItems:"flex-start", gap:8
                  }}>
                    <span style={{
                      fontSize:14, flexShrink:0, width:28, textAlign:"center",
                      color: st?.color
                    }}>
                      {st?.short}
                    </span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:"#111" }}>{item.label}</div>
                      {r.comment && (
                        <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>{r.comment}</div>
                      )}
                      {r.action && (
                        <div style={{ fontSize:12, color:"#ED7D31", marginTop:2 }}>Action: {r.action}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      <div style={{ display:"flex", gap:8, marginTop:20 }}>
        {audit.status === "draft" && (
          <Link href={`/audit/nouveau?draft=${audit.id}`}
            style={{
              flex:1, padding:"12px", borderRadius:8, background:"#ED7D31", color:"#fff",
              textAlign:"center", fontSize:14, textDecoration:"none"
            }}>
            Reprendre le brouillon
          </Link>
        )}
        <Link href="/dashboard"
          style={{
            flex:1, padding:"12px", borderRadius:8, background:"#fff", color:"#111",
            textAlign:"center", fontSize:14, textDecoration:"none",
            border:"0.5px solid #e5e7eb", display:"flex", alignItems:"center", justifyContent:"center", gap:6
          }}>
          <LayoutDashboard size={16} /> Retour dashboard
        </Link>
      </div>
    </div>
  )
}
