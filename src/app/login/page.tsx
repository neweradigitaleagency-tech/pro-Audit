"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();

      const fn = mode === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password, options: { data: { role: "auditeur" } } });

      const { error: err } = await fn;
      if (err) { setError(err.message); setLoading(false); return; }

      if (mode === "login") {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("Inscription réussie ! Vérifiez votre email pour confirmer.");
        setMode("login");
      }
    } catch (e) {
      setError(`Erreur de connexion: ${e instanceof Error ? e.message : "Vérifie ta connexion"}`);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f9fafb", padding:"1rem" }}>
      <div style={{ width:"100%", maxWidth:400, background:"#fff", borderRadius:12, padding:"2rem", boxShadow:"0 1px 3px rgba(0,0,0,.08)" }}>
        <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
          <div style={{ fontSize:36 }}>🛒</div>
          <h1 style={{ fontSize:20, fontWeight:600, color:"#111", marginTop:8 }}>ProAudit</h1>
          <p style={{ fontSize:13, color:"#6b7280", marginTop:4 }}>Supervision Prosuma</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:12, color:"#6b7280", display:"block", marginBottom:4 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid #e5e7eb", fontSize:14, boxSizing:"border-box" }} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, color:"#6b7280", display:"block", marginBottom:4 }}>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid #e5e7eb", fontSize:14, boxSizing:"border-box" }} />
          </div>

          {error && (
            <div style={{ fontSize:12, color: error.includes("réussie") ? "#16a34a" : "#dc2626", background: error.includes("réussie") ? "#f0fdf4" : "#fee2e2", padding:"8px 12px", borderRadius:6, marginBottom:12 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width:"100%", padding:"11px", borderRadius:8, border:"none", background:"#ED7D31", color:"#fff", fontSize:14, fontWeight:500, cursor:"pointer", opacity:loading?0.7:1 }}>
            {loading ? "..." : mode === "login" ? "Se connecter" : "S'inscrire"}
          </button>
        </form>

        <div style={{ textAlign:"center", marginTop:14 }}>
          <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            style={{ background:"none", border:"none", color:"#ED7D31", cursor:"pointer", fontSize:13 }}>
            {mode === "login" ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}
