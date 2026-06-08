export default function Loading() {
  return (
    <div style={{ maxWidth:560, margin:"0 auto", padding:"1.5rem 1rem" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <div style={{ width:44, height:44, borderRadius:8, background:"#f3f4f6" }} />
        <div style={{ width:200, height:22, borderRadius:6, background:"#f3f4f6" }} />
      </div>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ padding:"14px", borderRadius:10, border:"0.5px solid #e5e7eb", background:"#fff", marginBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <div style={{ flex:1 }}>
              <div style={{ width:"60%", height:16, borderRadius:4, background:"#f3f4f6", marginBottom:6 }} />
              <div style={{ width:"40%", height:12, borderRadius:4, background:"#f3f4f6" }} />
            </div>
            <div style={{ width:40, height:20, borderRadius:4, background:"#f3f4f6" }} />
          </div>
        </div>
      ))}
    </div>
  )
}
