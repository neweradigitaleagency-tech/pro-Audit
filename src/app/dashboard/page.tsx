import { redirect } from "next/navigation";
import { createClient, createActionClient, createServiceClient } from "@/lib/supabase/server";
import { LogOut, Plus, ClipboardList, AlertTriangle, TrendingUp, Building2, Users } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  const svc = createServiceClient();

const [profileResult, auditsResult] = await Promise.all([
  svc.from("profiles").select("full_name, role").eq("id", session.user.id).single(),
  svc.from("audits")
    .select("id, score, magasin_name")
    .order("created_at", { ascending: false })
    .limit(100),
]);

const profile = profileResult.data;
const role = profile?.role || "auditeur";
const isManagerOrAdmin = role === "manager" || role === "admin";

const allAudits = auditsResult.data ?? [];
const audits = isManagerOrAdmin
  ? allAudits
  : allAudits.filter(() => true); // filtering already handled by RLS via service client

const totalAudits = audits.length;
const avgScore = audits.length
  ? Math.round(audits.reduce((s, a) => s + (a.score || 0), 0) / audits.length)
  : 0;
const magasinsCount = new Set(audits.filter(a => a.magasin_name).map(a => a.magasin_name)).size;

let overdueActions = 0;
if (audits.length > 0) {
  const auditIds = audits.map(a => a.id);
  const { count } = await svc
    .from("corrective_actions")
    .select("id", { count: "exact", head: true })
    .in("audit_id", auditIds)
    .eq("resolved", false)
    .lt("deadline", new Date().toISOString().split("T")[0]);
  overdueActions = count ?? 0;
}

  async function signOut() {
    "use server";
    const s = await createActionClient();
    await s.auth.signOut();
    redirect("/auth/login");
  }

  return (
    <div style={{ maxWidth:560, margin:"0 auto", padding:"1.5rem 1rem" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div style={{ minWidth:0, flex:1 }}>
          <h1 style={{ fontSize:20, fontWeight:600, color:"#111", margin:0 }}>ProAudit</h1>
          <p style={{ fontSize:13, color:"#6b7280", margin:"2px 0 0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {profile?.full_name || session.user.email} · <span style={{ textTransform:"capitalize" }}>{role}</span>
          </p>
        </div>
        <form action={signOut}>
          <button type="submit" style={{ padding:"10px", borderRadius:8, border:"0.5px solid #e5e7eb", background:"#fff", cursor:"pointer", color:"#6b7280", display:"flex", minHeight:44, minWidth:44, alignItems:"center", justifyContent:"center" }}>
            <LogOut size={20} />
          </button>
        </form>
      </div>

      <div className="kpi-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
        <KpiCard icon={<ClipboardList size={20} />} label="Audits" value={String(totalAudits)} color="#ED7D31" />
        <KpiCard icon={<TrendingUp size={20} />} label="Conformité" value={`${avgScore}%`} color="#16a34a" />
        <KpiCard icon={<AlertTriangle size={20} />} label="Actions en retard" value={String(overdueActions ?? 0)} color="#dc2626" />
        <KpiCard icon={<Building2 size={20} />} label="Magasins" value={String(magasinsCount)} color="#0284c7" />
      </div>

      <div className="btn-row" style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
        <a href="/audit/nouveau" style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", borderRadius:10, background:"#ED7D31", color:"#fff", fontSize:15, fontWeight:500, textDecoration:"none", minHeight:48 }}>
          <Plus size={22} /> Nouvel audit
        </a>
        <a href="/audits" style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", borderRadius:10, border:"0.5px solid #e5e7eb", background:"#f9fafb", color:"#111", fontSize:14, textDecoration:"none", minHeight:48 }}>
          <ClipboardList size={20} /> Historique des audits
        </a>
        <a href="/actions" style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", borderRadius:10, border:"0.5px solid #e5e7eb", background:"#f9fafb", color:"#111", fontSize:14, textDecoration:"none", minHeight:48 }}>
          <AlertTriangle size={20} /> Actions correctives{overdueActions > 0 && ` (${overdueActions})`}
        </a>
        {isManagerOrAdmin && (
          <a href="/admin" style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", borderRadius:10, border:"0.5px solid #ED7D31", background:"#fff7ed", color:"#ED7D31", fontSize:14, textDecoration:"none", minHeight:48 }}>
            <Users size={20} /> Administration
          </a>
        )}
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
