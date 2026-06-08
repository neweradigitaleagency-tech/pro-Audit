import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { ArrowLeft, ClipboardList, FileText, FileEdit } from "lucide-react"
import { scoreColor } from "@/lib/audit/zones"

export default async function AuditsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/auth/login")

  const svc = createServiceClient()
  const { data: profile } = await svc
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single()

  const role = profile?.role || "auditeur"
  const isManagerOrAdmin = role === "manager" || role === "admin"

  let baseQuery = svc
    .from("audits")
    .select("id, ref, magasin_name, superviseur, date, score, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100)

  if (!isManagerOrAdmin) {
    baseQuery = baseQuery.eq("user_id", session.user.id)
  }

  const { data: audits } = await baseQuery

  const drafts = audits?.filter(a => a.status === "draft") || []
  const finals = audits?.filter(a => a.status === "final") || []

  function AuditCard({ a }: { a: { id: string; ref: string | null; magasin_name: string | null; superviseur: string | null; date: string | null; score: number | null; status: string | null } }) {
    return (
      <Link key={a.id} href={`/audits/${a.id}`}
        style={{
          display:"block", padding:"12px 14px", borderRadius:10, border:"0.5px solid #e5e7eb",
          background:"#fff", textDecoration:"none", color:"#111", minHeight:48
        }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
          <div style={{ minWidth:0, flex:1 }}>
            <div style={{ fontSize:14, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.magasin_name}</div>
            <div style={{ fontSize:12, color:"#6b7280", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {a.superviseur} · {a.date}
            </div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            {a.status === "final" && (
              <div style={{ fontSize:18, fontWeight:700, color: scoreColor(a.score || 0) }}>
                {a.score || 0}%
              </div>
            )}
            {a.status === "draft" && (
              <span style={{
                fontSize:11, padding:"2px 8px", borderRadius:4, background:"#fef3c7", color:"#92400e", whiteSpace:"nowrap", fontWeight:500
              }}>
                Brouillon
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div style={{ maxWidth:560, margin:"0 auto", padding:"1.5rem 1rem" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <Link href="/dashboard" style={{ display:"flex", color:"#111", textDecoration:"none", minWidth:44, minHeight:44, alignItems:"center", justifyContent:"center" }} aria-label="Retour">
          <ArrowLeft size={24} />
        </Link>
        <h1 style={{ fontSize:20, fontWeight:600, color:"#111", margin:0 }}>Historique des audits</h1>
      </div>

      {!audits || audits.length === 0 ? (
        <div style={{ textAlign:"center", padding:"40px 20px", color:"#9ca3af" }}>
          <ClipboardList size={40} style={{ margin:"0 auto 12px", opacity:0.4 }} />
          <p style={{ fontSize:15, color:"#6b7280" }}>Aucun audit trouvé</p>
          <Link href="/audit/nouveau"
            style={{ display:"inline-block", marginTop:12, padding:"12px 24px", borderRadius:8, background:"#ED7D31", color:"#fff", fontSize:14, textDecoration:"none" }}>
            Créer un audit
          </Link>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {drafts.length > 0 && (
            <>
              <div style={{
                fontSize:13, fontWeight:600, color:"#92400e", textTransform:"uppercase", letterSpacing:0.5,
                display:"flex", alignItems:"center", gap:6, padding:"8px 0 4px"
              }}>
                <FileEdit size={16} /> Brouillons ({drafts.length})
                <span style={{ flex:1, height:"0.5px", background:"#fde68a" }} />
              </div>
              {drafts.map(a => <AuditCard key={a.id} a={a} />)}
            </>
          )}
          {finals.length > 0 && (
            <>
              <div style={{
                fontSize:13, fontWeight:600, color:"#16a34a", textTransform:"uppercase", letterSpacing:0.5,
                display:"flex", alignItems:"center", gap:6, padding: drafts.length > 0 ? "16px 0 4px" : "8px 0 4px"
              }}>
                <FileText size={16} /> Complétés ({finals.length})
                <span style={{ flex:1, height:"0.5px", background:"#bbf7d0" }} />
              </div>
              {finals.map(a => <AuditCard key={a.id} a={a} />)}
            </>
          )}
        </div>
      )}
    </div>
  )
}
