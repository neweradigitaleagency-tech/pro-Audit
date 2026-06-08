"use client"

import { memo, useRef } from "react"
import type { ResultItem, AuditItem } from "@/lib/audit/zones"
import { STATUTS, DEADLINE_TYPES, getDeadlineBadge } from "@/lib/audit/zones"

interface ItemCardProps {
  item: AuditItem
  result?: ResultItem
  zoneLabel?: string
  showZone?: boolean
  isCustom?: boolean
  expanded?: boolean
  onStatut: (itemId: string, statut: "S" | "M" | "NS" | "NA") => void
  onField: (itemId: string, field: string, value: string) => void
  onToggle: (itemId: string) => void
  onAddPhoto: (itemId: string, files: FileList) => void
  onRemovePhoto: (itemId: string, photoName: string) => void
  onRemoveCustom?: (itemId: string) => void
}

export const ItemCard = memo(function ItemCard({
  item, result, zoneLabel, showZone, isCustom, expanded,
  onStatut, onField, onToggle, onAddPhoto, onRemovePhoto, onRemoveCustom
}: ItemCardProps) {
  const photoInputRef = useRef<HTMLInputElement>(null)
  const isExpanded = expanded ?? (result?.statut === "M" || result?.statut === "NS" || (result?.comment || result?.action || result?.deadlineType))
  const badge = getDeadlineBadge(result)

  return (
    <div style={{
      background:"#fff", borderRadius:10, border:"0.5px solid #e5e7eb",
      overflow:"hidden", marginBottom:8
    }}>
      <div style={{ padding:"12px 14px" }}>
        {showZone && zoneLabel && (
          <div style={{ fontSize:11, color:"#9ca3af", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.05em" }}>
            {zoneLabel}
          </div>
        )}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
          <div style={{ flex:1 }}>
            <div style={{
              fontSize:11, color:"#6b7280", marginBottom:2,
              display:"inline-block", background:"#f3f4f6", padding:"1px 6px", borderRadius:4
            }}>
              {item.cat}
            </div>
            <div style={{ fontSize:14, color:"#111", lineHeight:1.5, marginTop:4 }}>
              {item.label}
            </div>
            {badge && (
              <span style={{
                display:"inline-block", fontSize:11, padding:"1px 6px", borderRadius:4,
                color:badge.color, background:badge.bg, marginTop:6
              }}>
                {badge.text}
              </span>
            )}
          </div>
          {isCustom && onRemoveCustom && (
            <button
              onClick={() => onRemoveCustom(item.id)}
              style={{ background:"none", border:"none", cursor:"pointer", color:"#9ca3af", fontSize:16, padding:2 }}
              aria-label="Supprimer"
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ display:"flex", gap:6, marginTop:10 }}>
          {STATUTS.map(s => (
            <button
              key={s.val}
              onClick={() => onStatut(item.id, s.val)}
              style={{
                flex:1, padding:"6px 0", borderRadius:6, border:"0.5px solid #e5e7eb",
                fontSize:13, fontWeight:500, cursor:"pointer",
                background: result?.statut === s.val ? s.bg : "#fff",
                color: result?.statut === s.val ? s.color : "#6b7280",
              }}
            >
              {s.short} {s.val}
            </button>
          ))}
        </div>

        <button
          onClick={() => onToggle(item.id)}
          style={{
            background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#9ca3af",
            padding:"4px 0", marginTop:6, width:"100%", textAlign:"left"
          }}
        >
          {isExpanded ? "▲ Moins" : "▼ Plus"}
        </button>
      </div>

      {isExpanded && (
        <div style={{ borderTop:"0.5px solid #e5e7eb", padding:"12px 14px" }}>
          <textarea
            placeholder="Commentaire / observation"
            value={result?.comment || ""}
            onChange={e => onField(item.id, "comment", e.target.value)}
            style={{
              width:"100%", minHeight:60, borderRadius:6, border:"0.5px solid #e5e7eb",
              padding:"8px", fontSize:13, resize:"vertical", marginBottom:8,
              fontFamily:"inherit"
            }}
          />
          <textarea
            placeholder="Plan d'action"
            value={result?.action || ""}
            onChange={e => onField(item.id, "action", e.target.value)}
            style={{
              width:"100%", minHeight:60, borderRadius:6, border:"0.5px solid #e5e7eb",
              padding:"8px", fontSize:13, resize:"vertical", marginBottom:8,
              fontFamily:"inherit"
            }}
          />

          <div style={{ fontSize:12, color:"#6b7280", marginBottom:4 }}>Délai de correction</div>
          <div style={{ display:"flex", gap:6 }}>
            {DEADLINE_TYPES.map(dt => (
              <button
                key={dt.val}
                onClick={() => onField(item.id, "deadlineType", dt.val)}
                style={{
                  flex:1, padding:"8px 4px", borderRadius:6, border:"0.5px solid #e5e7eb",
                  fontSize:11, cursor:"pointer", textAlign:"center",
                  background: result?.deadlineType === dt.val ? dt.bg : "#fff",
                  color: result?.deadlineType === dt.val ? dt.color : "#6b7280",
                  fontWeight: result?.deadlineType === dt.val ? 600 : 400,
                }}
              >
                <div style={{ fontSize:16 }}>{dt.icon}</div>
                <div>{dt.label}</div>
              </button>
            ))}
          </div>
          {result?.deadlineType === "date" && (
            <input
              type="date"
              value={result?.deadline || ""}
              onChange={e => onField(item.id, "deadline", e.target.value)}
              style={{
                marginTop:8, width:"100%", padding:"8px", borderRadius:6,
                border:"0.5px solid #e5e7eb", fontSize:13, fontFamily:"inherit"
              }}
            />
          )}

          <div style={{ marginTop:10 }}>
            <div style={{ fontSize:12, color:"#6b7280", marginBottom:4 }}>Photos {(result?.photoUrls?.length || 0) > 0 && `(${result?.photoUrls?.length})`}</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {(result?.photoUrls || []).map(p => (
                <div key={p.name} style={{ position:"relative", width:56, height:56 }}>
                  <img src={p.url} alt={p.name} style={{ width:56, height:56, borderRadius:6, objectFit:"cover" }} />
                  <button
                    onClick={() => onRemovePhoto(item.id, p.name)}
                    style={{
                      position:"absolute", top:-4, right:-4, width:18, height:18, borderRadius:"50%",
                      background:"#dc2626", color:"#fff", border:"none", fontSize:10,
                      cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"
                    }}
                    aria-label="Supprimer photo"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => photoInputRef.current?.click()}
              style={{
                width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                padding:"10px", borderRadius:8, border:"1px dashed #d1d5db",
                background:"#f9fafb", cursor:"pointer", fontSize:13, color:"#111",
                minHeight:44, marginTop:6,
              }}
              aria-label="Ajouter une photo"
            >
              <span style={{ fontSize:16 }}>📷</span> Ajouter une photo
            </button>
            <input
              ref={photoInputRef}
              type="file" accept="image/*" multiple
              style={{ display:"none" }}
              onChange={e => { if (e.target.files) { onAddPhoto(item.id, e.target.files); e.target.value = "" } }}
            />
          </div>
        </div>
      )}
    </div>
  )
})
