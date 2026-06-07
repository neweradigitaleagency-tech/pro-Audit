export interface Store {
  name: string
  type: string
  zone: string
}

export const STORE_TYPES = ["Casino Mandarine", "Hyper Casino", "Super U", "Prosuma"] as const

export const DEFAULT_STORES: Store[] = [
  { name: "Casino Mandarine - Biétry",        type: "Casino Mandarine", zone: "Marcory" },
  { name: "Casino Mandarine - Marcory Zone 4", type: "Casino Mandarine", zone: "Marcory" },
  { name: "Casino Mandarine - Riviera Golf",   type: "Casino Mandarine", zone: "Riviera" },
  { name: "Casino Mandarine - Angré 22e",     type: "Casino Mandarine", zone: "Angré" },
  { name: "Casino Mandarine - Danga",         type: "Casino Mandarine", zone: "Danga" },
  { name: "Casino Mandarine - 2 Plateaux Vallons", type: "Casino Mandarine", zone: "2 Plateaux" },
  { name: "Casino Mandarine - M'badon",       type: "Casino Mandarine", zone: "M'badon" },
  { name: "Casino Mandarine - Riviera 4 Sol Béni", type: "Casino Mandarine", zone: "Riviera" },
  { name: "Hyper Casino - Prima",             type: "Hyper Casino",    zone: "Prima" },
  { name: "Hyper Casino - Cap Nord",          type: "Hyper Casino",    zone: "Riviera 3" },
  { name: "Hyper Casino - Vallons",           type: "Hyper Casino",    zone: "Vallons" },
  { name: "Super U - Plateau",                type: "Super U",         zone: "Plateau" },
  { name: "Super U - Djibi",                  type: "Super U",         zone: "Djibi" },
  { name: "Super U - Vallons",                type: "Super U",         zone: "Vallons" },
  { name: "Hyper Hayat",                      type: "Prosuma",         zone: "" },
  { name: "Hyper U Abidjan",                  type: "Prosuma",         zone: "" },
  { name: "Sococé - Treichville",             type: "Prosuma",         zone: "Treichville" },
  { name: "Cash Center - Marcory",            type: "Prosuma",         zone: "Marcory" },
]

export const TYPE_COLORS: Record<string, string> = {
  "Casino Mandarine": "#1e40af",
  "Hyper Casino":     "#7c3aed",
  "Super U":          "#059669",
  "Prosuma":          "#d97706",
}

export function searchStores(stores: Store[], query: string): Store[] {
  if (!query.trim()) return stores
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  return stores.filter(s => {
    const name = s.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    return name.includes(q)
  })
}

export function groupStores(stores: Store[]): { type: string; stores: Store[] }[] {
  const map = new Map<string, Store[]>()
  for (const s of stores) {
    if (!map.has(s.type)) map.set(s.type, [])
    map.get(s.type)!.push(s)
  }
  return Array.from(map.entries()).map(([type, stores]) => ({ type, stores }))
}
