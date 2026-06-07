"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, Mail, Lock } from "lucide-react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!email.trim()) errs.email = "Email requis"
    if (!password) errs.password = "Mot de passe requis"
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setLoading(false)
        if (error.message.includes("Email not confirmed")) {
          toast.error("Veuillez d'abord vérifier votre adresse e-mail")
        } else if (error.message.includes("Invalid login credentials")) {
          setFieldErrors({ password: "Email ou mot de passe incorrect" })
        } else {
          toast.error(error.message)
        }
        return
      }
      toast.success("Connexion réussie")
      router.push("/dashboard")
      router.refresh()
    } catch {
      toast.error("Erreur de connexion au serveur")
      setLoading(false)
    }
  }

  async function handleResendVerification() {
    if (!email.trim()) { toast.error("Entre ton email d'abord"); return }
    setResending(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    })
    setResending(false)
    if (error) toast.error(error.message)
    else toast.success("Email de vérification renvoyé !")
  }

  const errorParam = searchParams.get("error")

  return (
    <>
      {errorParam === "invalid_link" && (
        <div style={{ fontSize:12, color:"#dc2626", background:"#fee2e2", padding:"8px 12px", borderRadius:6, marginBottom:12 }}>
          Lien de vérification invalide ou expiré. Veuillez demander un nouveau lien.
        </div>
      )}
      {errorParam === "auth_failed" && (
        <div style={{ fontSize:12, color:"#dc2626", background:"#fee2e2", padding:"8px 12px", borderRadius:6, marginBottom:12 }}>
          La connexion a échoué. Réessaie.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12, color:"#6b7280", display:"block", marginBottom:4 }}>Email</label>
          <div style={{ position:"relative" }}>
            <Mail size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }} />
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({...p, email: ""})) }}
              style={{ width:"100%", padding:"10px 10px 10px 30px", borderRadius:8, border:`1px solid ${fieldErrors.email ? "#dc2626" : "#e5e7eb"}`, fontSize:14, boxSizing:"border-box" }} />
          </div>
          {fieldErrors.email && <div style={{ fontSize:11, color:"#dc2626", marginTop:2 }}>{fieldErrors.email}</div>}
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12, color:"#6b7280", display:"block", marginBottom:4 }}>Mot de passe</label>
          <div style={{ position:"relative" }}>
            <Lock size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }} />
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({...p, password: ""})) }}
              style={{ width:"100%", padding:"10px 10px 10px 30px", borderRadius:8, border:`1px solid ${fieldErrors.password ? "#dc2626" : "#e5e7eb"}`, fontSize:14, boxSizing:"border-box" }} />
          </div>
          {fieldErrors.password && <div style={{ fontSize:11, color:"#dc2626", marginTop:2 }}>{fieldErrors.password}</div>}
        </div>

        <button type="submit" disabled={loading}
          style={{ width:"100%", padding:"11px", borderRadius:8, border:"none", background: loading ? "#f3caa0" : "#ED7D31", color:"#fff", fontSize:14, fontWeight:500, cursor: loading ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          {loading ? <Loader2 size={16} style={{ animation:"spin 1s linear infinite" }} /> : null}
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <div style={{ marginTop:12 }}>
        <button onClick={handleResendVerification} disabled={resending}
          style={{ width:"100%", padding:"8px", borderRadius:8, border:"0.5px solid #e5e7eb", background:"#fff", color:"#6b7280", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
          {resending ? "Envoi en cours..." : "Renvoyer l'email de vérification"}
        </button>
      </div>

      <div style={{ textAlign:"center", marginTop:14 }}>
        <span style={{ fontSize:13, color:"#6b7280" }}>Pas encore de compte ? </span>
        <Link href="/auth/register" style={{ background:"none", border:"none", color:"#ED7D31", cursor:"pointer", fontSize:13, textDecoration:"none", fontWeight:500 }}>
          S&apos;inscrire
        </Link>
      </div>

      <div style={{ textAlign:"center", marginTop:8 }}>
        <Link href="/login" style={{ fontSize:12, color:"#9ca3af", textDecoration:"none" }}>
          ← Ancienne version
        </Link>
      </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f9fafb", padding:"1rem" }}>
      <div style={{ width:"100%", maxWidth:400, background:"#fff", borderRadius:12, padding:"2rem", boxShadow:"0 1px 3px rgba(0,0,0,.08)" }}>
        <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
          <div style={{ fontSize:36 }}>🛒</div>
          <h1 style={{ fontSize:20, fontWeight:600, color:"#111", marginTop:8 }}>Connexion</h1>
          <p style={{ fontSize:13, color:"#6b7280", marginTop:4 }}>ProAudit — Supervision Prosuma</p>
        </div>

        <Suspense fallback={<div style={{ textAlign:"center", padding:"2rem", color:"#9ca3af", fontSize:13 }}>Chargement...</div>}>
          <LoginForm />
        </Suspense>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
