import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { ArrowLeft, ClipboardList, Search } from "lucide-react"
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

  let query = svc
    .from("audits")
    .select("id, ref, magasin_name, superviseur, date, score, status, created_at")
    .order("created_at", { ascending: false })

  if (!isManagerOrAdmin) {
    query = query.eq("user_id", session.user.id)
  }

  const { data: audits } = await query

  return (
    <div style={{ maxWidth:560, margin:"0 auto", padding:"1.5rem 1rem" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <Link href="/dashboard" style={{ display:"flex", color:"#111", textDecoration:"none" }} aria-label="Retour">
          <ArrowLeft size={20} />
        </Link>
        <h1 style={{ fontSize:20, fontWeight:600, color:"#111", margin:0 }}>Historique des audits</h1>
      </div>

      {!audits || audits.length === 0 ? (
        <div style={{ textAlign:"center", padding:"40px 20px", color:"#9ca3af" }}>
          <ClipboardList size={40} style={{ margin:"0 auto 12px", opacity:0.4 }} />
          <p style={{ fontSize:15, color:"#6b7280" }}>Aucun audit trouvé</p>
          <Link href="/audit/nouveau"
            style={{ display:"inline-block", marginTop:12, padding:"10px 20px", borderRadius:8, background:"#ED7D31", color:"#fff", fontSize:14, textDecoration:"none" }}>
            Créer un audit
          </Link>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {audits.map(a => (
            <Link key={a.id} href={`/audits/${a.id}`}
              style={{
                display:"block", padding:"14px", borderRadius:10, border:"0.5px solid #e5e7eb",
                background:"#fff", textDecoration:"none", color:"#111"
              }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:500 }}>{a.magasin_name}</div>
                  <div style={{ fontSize:13, color:"#6b7280", marginTop:2 }}>
                    {a.ref ? `${a.ref} · ` : ""}{a.superviseur} · {a.date}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:20, fontWeight:700, color: scoreColor(a.score || 0) }}>
                    {a.score || 0}%
                  </div>
                  {a.status === "draft" && (
                    <span style={{
                      fontSize:11, padding:"1px 6px", borderRadius:4, background:"#fef3c7", color:"#d97706"
                    }}>
                      Brouillon
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
