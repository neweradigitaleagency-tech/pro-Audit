"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, ArrowLeft, Mail, Lock, User } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  function validate() {
    const errs: Record<string, string> = {}
    if (!firstName.trim()) errs.firstName = "Prénom requis"
    if (!lastName.trim()) errs.lastName = "Nom requis"
    if (!email.trim()) errs.email = "Email requis"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Email invalide"
    if (!password) errs.password = "Mot de passe requis"
    else if (password.length < 6) errs.password = "6 caractères minimum"
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: `${firstName.trim()} ${lastName.trim()}`.trim() },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      })

      if (error) {
        if (error.message.includes("already")) {
          setFieldErrors({ email: "Cet email est déjà utilisé" })
        } else {
          toast.error(error.message)
        }
        setLoading(false)
        return
      }

      setSuccess(true)
      toast.success("Inscription réussie !")
    } catch (e) {
      toast.error("Erreur de connexion au serveur")
      setLoading(false)
    }
  }

  function getStrength(s: string): { label: string; color: string; pct: number } {
    if (!s) return { label: "", color: "#e5e7eb", pct: 0 }
    const score = [
      s.length >= 6,
      s.length >= 10,
      /[a-z]/.test(s) && /[A-Z]/.test(s),
      /\d/.test(s),
      /[^a-zA-Z0-9]/.test(s),
    ].filter(Boolean).length
    if (score <= 1) return { label: "Faible", color: "#dc2626", pct: 25 }
    if (score <= 2) return { label: "Moyen", color: "#d97706", pct: 50 }
    if (score <= 3) return { label: "Bon", color: "#16a34a", pct: 75 }
    return { label: "Fort", color: "#16a34a", pct: 100 }
  }

  const strength = getStrength(password)

  if (success) {
    return (
      <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f9fafb", padding:"1rem" }}>
        <div style={{ width:"100%", maxWidth:420, background:"#fff", borderRadius:12, padding:"2rem", boxShadow:"0 1px 3px rgba(0,0,0,.08)", textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📧</div>
          <h1 style={{ fontSize:18, fontWeight:600, color:"#111", margin:"0 0 8px" }}>Vérifie ta boîte mail</h1>
          <p style={{ fontSize:13, color:"#6b7280", lineHeight:1.6, margin:"0 0 4px" }}>
            Un lien de vérification a été envoyé à <strong>{email}</strong>.
          </p>
          <p style={{ fontSize:13, color:"#6b7280", lineHeight:1.6, margin:"0 0 20px" }}>
            Clique sur ce lien pour activer ton compte et accéder au tableau de bord.
          </p>
          <div style={{ fontSize:12, color:"#9ca3af", background:"#f3f4f6", borderRadius:8, padding:"10px 14px", marginBottom:20 }}>
            Email non reçu ? Vérifie tes spams ou réessaie de t&apos;inscrire.
          </div>
          <Link href="/auth/login"
            style={{ display:"inline-block", padding:"10px 24px", borderRadius:8, background:"#ED7D31", color:"#fff", fontSize:14, fontWeight:500, textDecoration:"none" }}>
            Aller à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f9fafb", padding:"1rem" }}>
      <div style={{ width:"100%", maxWidth:400, background:"#fff", borderRadius:12, padding:"2rem", boxShadow:"0 1px 3px rgba(0,0,0,.08)" }}>
        <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
          <div style={{ fontSize:36 }}>🛒</div>
          <h1 style={{ fontSize:20, fontWeight:600, color:"#111", marginTop:8 }}>Créer un compte</h1>
          <p style={{ fontSize:13, color:"#6b7280", marginTop:4 }}>ProAudit — Supervision Prosuma</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            <div>
              <label style={{ fontSize:12, color:"#6b7280", display:"block", marginBottom:4 }}>Prénom</label>
              <div style={{ position:"relative" }}>
                <User size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }} />
                <input type="text" value={firstName} onChange={e => { setFirstName(e.target.value); setFieldErrors(p => ({...p, firstName: ""})) }}
                  style={{ width:"100%", padding:"10px 10px 10px 30px", borderRadius:8, border:`1px solid ${fieldErrors.firstName ? "#dc2626" : "#e5e7eb"}`, fontSize:14, boxSizing:"border-box" }} />
              </div>
              {fieldErrors.firstName && <div style={{ fontSize:11, color:"#dc2626", marginTop:2 }}>{fieldErrors.firstName}</div>}
            </div>
            <div>
              <label style={{ fontSize:12, color:"#6b7280", display:"block", marginBottom:4 }}>Nom</label>
              <div style={{ position:"relative" }}>
                <User size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }} />
                <input type="text" value={lastName} onChange={e => { setLastName(e.target.value); setFieldErrors(p => ({...p, lastName: ""})) }}
                  style={{ width:"100%", padding:"10px 10px 10px 30px", borderRadius:8, border:`1px solid ${fieldErrors.lastName ? "#dc2626" : "#e5e7eb"}`, fontSize:14, boxSizing:"border-box" }} />
              </div>
              {fieldErrors.lastName && <div style={{ fontSize:11, color:"#dc2626", marginTop:2 }}>{fieldErrors.lastName}</div>}
            </div>
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:12, color:"#6b7280", display:"block", marginBottom:4 }}>Email</label>
            <div style={{ position:"relative" }}>
              <Mail size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }} />
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({...p, email: ""})) }}
                style={{ width:"100%", padding:"10px 10px 10px 30px", borderRadius:8, border:`1px solid ${fieldErrors.email ? "#dc2626" : "#e5e7eb"}`, fontSize:14, boxSizing:"border-box" }} />
            </div>
            {fieldErrors.email && <div style={{ fontSize:11, color:"#dc2626", marginTop:2 }}>{fieldErrors.email}</div>}
          </div>

          <div style={{ marginBottom:6 }}>
            <label style={{ fontSize:12, color:"#6b7280", display:"block", marginBottom:4 }}>Mot de passe</label>
            <div style={{ position:"relative" }}>
              <Lock size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }} />
              <input type="password" value={password} onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({...p, password: ""})) }}
                style={{ width:"100%", padding:"10px 10px 10px 30px", borderRadius:8, border:`1px solid ${fieldErrors.password ? "#dc2626" : "#e5e7eb"}`, fontSize:14, boxSizing:"border-box" }} />
            </div>
            {fieldErrors.password && <div style={{ fontSize:11, color:"#dc2626", marginTop:2 }}>{fieldErrors.password}</div>}
          </div>

          {password && (
            <div style={{ marginBottom:12 }}>
              <div style={{ height:4, borderRadius:2, background:"#e5e7eb", overflow:"hidden", marginBottom:2 }}>
                <div style={{ height:"100%", borderRadius:2, width:`${strength.pct}%`, background: strength.color, transition:"width .2s" }} />
              </div>
              <div style={{ fontSize:11, color: strength.color }}>{strength.label}</div>
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width:"100%", padding:"11px", borderRadius:8, border:"none", background: loading ? "#f3caa0" : "#ED7D31", color:"#fff", fontSize:14, fontWeight:500, cursor: loading ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"background .15s" }}>
            {loading ? <Loader2 size={16} style={{ animation:"spin 1s linear infinite" }} /> : null}
            {loading ? "Inscription..." : "Créer mon compte"}
          </button>
        </form>

        <div style={{ textAlign:"center", marginTop:14 }}>
          <span style={{ fontSize:13, color:"#6b7280" }}>Déjà un compte ? </span>
          <Link href="/auth/login" style={{ background:"none", border:"none", color:"#ED7D31", cursor:"pointer", fontSize:13, textDecoration:"none", fontWeight:500 }}>
            Se connecter
          </Link>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
