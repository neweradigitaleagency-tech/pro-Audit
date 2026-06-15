"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Search, Plus, Check, ChevronDown } from "lucide-react"
import { DEFAULT_STORES, searchStores, groupStores, TYPE_COLORS } from "@/lib/stores"
import type { Store } from "@/lib/stores"

interface Props {
  value: string
  onChange: (name: string) => void
  placeholder?: string
}

const RECENT_KEY = "proaudit_recent_stores"

function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").slice(0, 5) }
  catch { return [] }
}

function saveRecent(name: string) {
  try {
    const recent = loadRecent().filter(n => n !== name)
    recent.unshift(name)
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 5)))
  } catch { /* ignore */ }
}

export function StoreAutocomplete({ value, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const [stores, setStores] = useState<Store[]>(DEFAULT_STORES)
  const [addingNew, setAddingNew] = useState(false)
  const [newName, setNewName] = useState("")
  const [adding, setAdding] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const newInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client")
        const { data } = await createClient()
          .from("magasins")
          .select("name, type, zone")
          .order("name")
        if (data && data.length > 0) setStores(data)
      } catch {
        // Silently fall back to DEFAULT_STORES
      }
    })()
  }, [])

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    if (addingNew) newInputRef.current?.focus()
  }, [addingNew])

  const recent = loadRecent()
  const filtered = open ? searchStores(stores, query) : []
  const grouped = groupStores(filtered)
  const flatList = filtered
  useEffect(() => { setHighlightIdx(-1) }, [query, open])

  const selectStore = useCallback((name: string) => {
    onChange(name)
    setQuery(name)
    saveRecent(name)
    setOpen(false)
    setAddingNew(false)
  }, [onChange])

  const handleAddNew = useCallback(async () => {
    const name = newName.trim()
    if (!name) return
    setAdding(true)
    try {
      const res = await fetch("/api/magasins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        const { store } = await res.json()
        setStores(prev => prev.some(s => s.name === store.name) ? prev : [...prev, store])
      }
    } catch { /* ignore */ }
    selectStore(name)
    setNewName("")
    setAddingNew(false)
    setAdding(false)
  }, [newName, selectStore])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); return }
      return
    }
    const total = flatList.length + (query.trim() && !flatList.some(s => s.name.toLowerCase() === query.trim().toLowerCase()) ? 1 : 0)
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightIdx(i => i < total - 1 ? i + 1 : 0)
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightIdx(i => i > 0 ? i - 1 : total - 1)
        break
      case "Enter":
        e.preventDefault()
        if (highlightIdx >= 0 && highlightIdx < flatList.length) {
          selectStore(flatList[highlightIdx].name)
        } else if (highlightIdx === flatList.length && query.trim()) {
          setQuery(""); setNewName(query); setAddingNew(true); setOpen(false)
        }
        break
      case "Escape":
        setOpen(false)
        break
    }
  }, [open, query, flatList, highlightIdx, selectStore])

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <div style={{ position:"relative" }}>
        <Search size={16} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#9ca3af", pointerEvents:"none" }} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setAddingNew(false) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Rechercher un magasin..."}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          style={{
            width:"100%", padding:"12px 12px 12px 36px", borderRadius:8,
            border:"0.5px solid #d1d5db", fontSize:14, fontFamily:"inherit",
            outline:"none", boxSizing:"border-box",
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); onChange(""); inputRef.current?.focus() }}
            style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#9ca3af", fontSize:16, padding:"4px" }}
            tabIndex={-1}
            aria-label="Effacer"
          >×</button>
        )}
      </div>

      {open && (
        <div
          role="listbox"
          style={{
            position:"absolute", top:"100%", left:0, right:0, zIndex:50,
            marginTop:4, borderRadius:8, background:"#fff",
            border:"0.5px solid #e5e7eb", boxShadow:"0 4px 20px rgba(0,0,0,0.1)",
            maxHeight:320, overflowY:"auto",
          }}
        >
          {recent.length > 0 && !query.trim() && (
            <div>
              <div style={{ padding:"8px 12px 4px", fontSize:11, color:"#9ca3af", textTransform:"uppercase", letterSpacing:0.5 }}>
                Récents
              </div>
              {recent.map(name => {
                const store = stores.find(s => s.name === name)
                return (
                  <div
                    key={name}
                    role="option"
                    onClick={() => selectStore(name)}
                    style={{ padding:"8px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13, borderBottom:"0.5px solid #f3f4f6" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}
                  >
                    <ClockIcon />
                    <span style={{ flex:1 }}>{name}</span>
                    {store && <TypeBadge type={store.type} />}
                  </div>
                )
              })}
            </div>
          )}

          {grouped.map(group => (
            <div key={group.type}>
              <div style={{ padding:"8px 12px 4px", fontSize:11, color: TYPE_COLORS[group.type] || "#6b7280", textTransform:"uppercase", letterSpacing:0.5, fontWeight:600 }}>
                {group.type}
              </div>
              {group.stores.map((store, idx) => {
                const globalIdx = flatList.indexOf(store)
                return (
                  <div
                    key={store.name}
                    role="option"
                    aria-selected={value === store.name}
                    onClick={() => selectStore(store.name)}
                    style={{
                      padding:"8px 12px 8px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13,
                      background: highlightIdx === globalIdx ? "#f3f4f6" : value === store.name ? "#f0fdf4" : "",
                      borderLeft: value === store.name ? "3px solid #16a34a" : "3px solid transparent",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
                    onMouseLeave={e => (e.currentTarget.style.background = highlightIdx === globalIdx ? "#f3f4f6" : value === store.name ? "#f0fdf4" : "")}
                  >
                    <span style={{ flex:1 }}>{store.name}</span>
                    {store.zone && <span style={{ fontSize:11, color:"#9ca3af" }}>{store.zone}</span>}
                    <TypeBadge type={store.type} />
                  </div>
                )
              })}
            </div>
          ))}

          {query.trim() && !flatList.some(s => s.name.toLowerCase() === query.trim().toLowerCase()) && (
            <div
              role="option"
              onClick={() => { setQuery(""); setNewName(query); setAddingNew(true); setOpen(false) }}
              style={{
                padding:"10px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13,
                color:"#ED7D31", fontWeight:500, borderTop:"0.5px solid #e5e7eb",
                background: highlightIdx === flatList.length ? "#fff7ed" : "",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#fff7ed")}
              onMouseLeave={e => (e.currentTarget.style.background = "")}
            >
              <Plus size={16} />
              Ajouter &laquo; {query.trim()} &raquo;
            </div>
          )}

          {!query.trim() && filtered.length === 0 && (
            <div style={{ padding:"16px", textAlign:"center", fontSize:13, color:"#9ca3af" }}>
              Aucun magasin trouvé
            </div>
          )}
        </div>
      )}

      {addingNew && (
        <div style={{ marginTop:8, display:"flex", gap:8 }}>
          <input
            ref={newInputRef}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAddNew(); if (e.key === "Escape") setAddingNew(false) }}
            placeholder="Nom du nouveau magasin"
            style={{
              flex:1, padding:"10px 12px", borderRadius:8, border:"0.5px solid #d1d5db",
              fontSize:14, fontFamily:"inherit", outline:"none",
            }}
          />
          <button
            onClick={handleAddNew}
            disabled={adding || !newName.trim()}
            style={{
              padding:"10px 16px", borderRadius:8, border:"none",
              background: adding || !newName.trim() ? "#d1d5db" : "#ED7D31", color:"#fff",
              fontSize:14, fontWeight:500, cursor: adding || !newName.trim() ? "not-allowed" : "pointer",
              whiteSpace:"nowrap",
            }}
          >
            {adding ? "..." : "Ajouter"}
          </button>
        </div>
      )}
    </div>
  )
}

function TypeBadge({ type }: { type: string }) {
  const color = TYPE_COLORS[type] || "#6b7280"
  return (
    <span style={{
      fontSize:10, fontWeight:600, padding:"1px 6px", borderRadius:4,
      background: `${color}15`, color,
      whiteSpace:"nowrap", textTransform:"uppercase", letterSpacing:0.3,
    }}>
      {type}
    </span>
  )
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
