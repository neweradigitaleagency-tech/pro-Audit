import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft, Users, Building2, ClipboardList, TrendingUp, Upload } from "lucide-react"

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single()

  if (!myProfile || myProfile.role !== "admin") redirect("/dashboard")

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .order("created_at", { ascending: false })

  const { data: magasins } = await supabase
    .from("magasins")
    .select("id, name, created_at")
    .order("name")

  const { count: totalAudits } = await supabase
    .from("audits")
    .select("id", { count: "exact", head: true })

  const { data: latestAudits } = await supabase
    .from("audits")
    .select("id, magasin_name, score, created_at")
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div style={{ maxWidth:640, margin:"0 auto", padding:"1.5rem 1rem" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24 }}>
        <Link href="/dashboard" style={{ display:"flex", color:"#111", textDecoration:"none" }} aria-label="Retour">
          <ArrowLeft size={20} />
        </Link>
        <h1 style={{ fontSize:20, fontWeight:600, color:"#111", margin:0 }}>Administration</h1>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 }}>
        <div style={{ background:"#fff", border:"0.5px solid #e5e7eb", borderRadius:10, padding:"14px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
            <Users size={16} color="#ED7D31" />
            <span style={{ fontSize:12, color:"#6b7280" }}>Utilisateurs</span>
          </div>
          <div style={{ fontSize:24, fontWeight:600, color:"#111" }}>{profiles?.length || 0}</div>
        </div>
        <div style={{ background:"#fff", border:"0.5px solid #e5e7eb", borderRadius:10, padding:"14px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
            <Building2 size={16} color="#0284c7" />
            <span style={{ fontSize:12, color:"#6b7280" }}>Magasins</span>
          </div>
          <div style={{ fontSize:24, fontWeight:600, color:"#111" }}>{magasins?.length || 0}</div>
        </div>
        <div style={{ background:"#fff", border:"0.5px solid #e5e7eb", borderRadius:10, padding:"14px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
            <ClipboardList size={16} color="#16a34a" />
            <span style={{ fontSize:12, color:"#6b7280" }}>Audits</span>
          </div>
          <div style={{ fontSize:24, fontWeight:600, color:"#111" }}>{totalAudits || 0}</div>
        </div>
        <div style={{ background:"#fff", border:"0.5px solid #e5e7eb", borderRadius:10, padding:"14px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
            <TrendingUp size={16} color="#d97706" />
            <span style={{ fontSize:12, color:"#6b7280" }}>Moy. score</span>
          </div>
          <div style={{ fontSize:24, fontWeight:600, color:"#111" }}>—</div>
        </div>
      </div>

      <h2 style={{ fontSize:16, fontWeight:600, color:"#111", margin:"0 0 12px" }}>
        <Users size={16} style={{ marginRight:6, verticalAlign:"middle" }} />
        Utilisateurs ({profiles?.length || 0})
      </h2>
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:24 }}>
        {(profiles || []).map(p => (
          <div key={p.id} style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"12px 14px", background:"#fff", borderRadius:10, border:"0.5px solid #e5e7eb"
          }}>
            <div>
              <div style={{ fontSize:14, fontWeight:500, color:"#111" }}>
                {p.full_name || "—"}
              </div>
              <div style={{ fontSize:12, color:"#9ca3af" }}>
                {p.id.slice(0,8)}... · {new Date(p.created_at).toLocaleDateString("fr-FR")}
              </div>
            </div>
            <span style={{
              fontSize:12, padding:"2px 8px", borderRadius:4, fontWeight:500,
              background: p.role === "admin" ? "#fee2e2" : p.role === "manager" ? "#fef3c7" : "#f3f4f6",
              color: p.role === "admin" ? "#dc2626" : p.role === "manager" ? "#d97706" : "#6b7280",
            }}>
              {p.role}
            </span>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize:16, fontWeight:600, color:"#111", margin:"0 0 12px" }}>
        <Building2 size={16} style={{ marginRight:6, verticalAlign:"middle" }} />
        Magasins ({magasins?.length || 0})
      </h2>
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:24 }}>
        {(magasins || []).map(m => (
          <div key={m.id} style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"12px 14px", background:"#fff", borderRadius:10, border:"0.5px solid #e5e7eb"
          }}>
            <div style={{ fontSize:14, color:"#111" }}>{m.name}</div>
            <div style={{ fontSize:12, color:"#9ca3af" }}>
              {new Date(m.created_at).toLocaleDateString("fr-FR")}
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize:16, fontWeight:600, color:"#111", margin:"0 0 12px" }}>
        Derniers audits
      </h2>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {(latestAudits || []).map(a => (
          <Link key={a.id} href={`/audits/${a.id}`} style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"12px 14px", background:"#fff", borderRadius:10, border:"0.5px solid #e5e7eb",
            textDecoration:"none", color:"#111"
          }}>
            <div>
              <div style={{ fontSize:14, fontWeight:500 }}>{a.magasin_name}</div>
              <div style={{ fontSize:12, color:"#9ca3af" }}>
                {new Date(a.created_at).toLocaleDateString("fr-FR")}
              </div>
            </div>
            <span style={{
              fontSize:16, fontWeight:700,
              color: (a.score || 0) >= 80 ? "#16a34a" : (a.score || 0) >= 60 ? "#d97706" : "#dc2626"
            }}>
              {a.score || 0}%
            </span>
          </Link>
        ))}
        {(!latestAudits || latestAudits.length === 0) && (
          <div style={{ fontSize:13, color:"#9ca3af", textAlign:"center", padding:16 }}>
            Aucun audit
          </div>
        )}
      </div>

      <div style={{ marginTop:24, paddingTop:16, borderTop:"0.5px solid #e5e7eb" }}>
        <Link href="/migration" style={{
          display:"flex", alignItems:"center", gap:8,
          padding:"12px 14px", borderRadius:10, border:"0.5px solid #e5e7eb",
          background:"#fff7ed", color:"#ED7D31", fontSize:14, textDecoration:"none"
        }}>
          <Upload size={18} />
          Migration des données (import JSON)
        </Link>
      </div>
    </div>
  )
}
