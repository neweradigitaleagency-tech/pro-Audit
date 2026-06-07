"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ maxWidth:560, margin:"0 auto", padding:"2rem 1rem", textAlign:"center" }}>
      <h1 style={{ fontSize:20, fontWeight:600, color:"#dc2626", marginBottom:8 }}>
        Erreur serveur
      </h1>
      <p style={{ fontSize:14, color:"#6b7280", marginBottom:16 }}>
        Une erreur s&apos;est produite lors du chargement de cette page.
      </p>
      <p style={{ fontSize:12, color:"#9ca3af", marginBottom:20 }}>
        Digest : {error.digest || "inconnu"}
      </p>
      <button
        onClick={() => reset()}
        style={{
          padding:"10px 20px", borderRadius:8, background:"#ED7D31", color:"#fff",
          border:"none", fontSize:14, fontWeight:500, cursor:"pointer",
        }}
      >
        Réessayer
      </button>
    </div>
  )
}
