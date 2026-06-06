import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogOut, Plus, ClipboardList, AlertTriangle, TrendingUp, Building2, Users } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", session.user.id)
    .single();

  const role = profile?.role || "auditeur";
  const isManagerOrAdmin = role === "manager" || role === "admin";

  async function signOut() {
    "use server";
    const s = await createClient();
    await s.auth.signOut();
    redirect("/login");
  }

  return (
    <div style={{ maxWidth:560, margin:"0 auto", padding:"1.5rem 1rem" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:600, color:"#111", margin:0 }}>ProAudit</h1>
          <p style={{ fontSize:13, color:"#6b7280", margin:"2px 0 0" }}>
            {profile?.full_name || session.user.email} · <span style={{ textTransform:"capitalize" }}>{role}</span>
          </p>
        </div>
        <form action={signOut}>
          <button type="submit" style={{ padding:"8px", borderRadius:8, border:"0.5px solid #e5e7eb", background:"#fff", cursor:"pointer", color:"#6b7280", display:"flex" }}>
            <LogOut size={18} />
          </button>
        </form>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
        <KpiCard icon={<ClipboardList size={20} />} label="Audits" value="—" color="#ED7D31" />
        <KpiCard icon={<TrendingUp size={20} />} label="Conformité" value="—" color="#16a34a" />
        <KpiCard icon={<AlertTriangle size={20} />} label="Actions en retard" value="—" color="#dc2626" />
        <KpiCard icon={<Building2 size={20} />} label="Magasins" value="—" color="#0284c7" />
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
        <a href="/audit/nouveau" style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", borderRadius:10, background:"#ED7D31", color:"#fff", fontSize:15, fontWeight:500, textDecoration:"none" }}>
          <Plus size={22} /> Nouvel audit
        </a>
        <a href="/audits" style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", borderRadius:10, border:"0.5px solid #e5e7eb", background:"#f9fafb", color:"#111", fontSize:14, textDecoration:"none" }}>
          <ClipboardList size={20} /> Historique des audits
        </a>
        {isManagerOrAdmin && (
          <a href="/admin" style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", borderRadius:10, border:"0.5px solid #ED7D31", background:"#fff7ed", color:"#ED7D31", fontSize:14, textDecoration:"none" }}>
            <Users size={20} /> Administration
          </a>
        )}
      </div>

      <div style={{ background:"#fff7ed", border:"0.5px solid #fed7aa", borderRadius:10, padding:"12px 14px" }}>
        <div style={{ fontSize:13, fontWeight:500, color:"#9a3412", marginBottom:4 }}>🚀 Mode déploiement</div>
        <div style={{ fontSize:12, color:"#c2410c", lineHeight:1.6 }}>
          Configuration Supabase requise. Créez un projet Supabase et mettez à jour <code style={{ background:"#fef3c7", padding:"1px 4px", borderRadius:3 }}>.env.local</code>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div style={{ background:"#fff", border:"0.5px solid #e5e7eb", borderRadius:10, padding:"14px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize:12, color:"#6b7280" }}>{label}</span>
      </div>
      <div style={{ fontSize:24, fontWeight:600, color:"#111" }}>{value}</div>
    </div>
  );
}
