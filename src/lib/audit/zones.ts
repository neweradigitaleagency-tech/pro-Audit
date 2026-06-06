export interface AuditItem {
  id: string
  cat: string
  label: string
}
export interface Zone {
  id: string
  label: string
  icon: string
  items: AuditItem[]
}
export interface CustomItem extends AuditItem {}

export interface ResultItem {
  statut?: "S" | "M" | "NS" | "NA"
  comment?: string
  action?: string
  deadlineType?: "immediat" | "continu" | "date"
  deadline?: string
  photoUrls?: { name: string; url: string }[]
  resolved?: boolean
}

export interface AuditHeader {
  date: string
  heure: string
  superviseur: string
  responsable: string
  magasin: string
}

export type AuditMode = "zone" | "cat"
export type AuditStatus = "draft" | "final"

export const ZONES: Zone[] = [
  {id:"batiment",label:"Bâtiment",icon:"🏢",items:[
    {id:"b1",cat:"Hygiène & qualité",label:"Façade : état et propreté (fissures, moisissures)"},
    {id:"b2",cat:"Hygiène & qualité",label:"Enseigne : propreté, visibilité, éclairage fonctionnel"},
    {id:"b3",cat:"Hygiène & qualité",label:"Dalle et toitures (contrat d'entretien)"},
    {id:"b4",cat:"Hygiène & qualité",label:"Problèmes voisinage (ex : fuites d'eau)"},
  ]},
  {id:"parking",label:"Parking & extérieur",icon:"🅿️",items:[
    {id:"p1",cat:"Effectif & personnel",label:"Nombre de vigiles suffisant (planning, propreté stores)"},
    {id:"p2",cat:"Sécurité",label:"Tracé et délimitation des zones de parking"},
    {id:"p3",cat:"Hygiène & qualité",label:"Tenues des vigiles propres"},
    {id:"p4",cat:"Sécurité",label:"Identification des véhicules présents"},
    {id:"p5",cat:"Hygiène & qualité",label:"Local poubelle"},
    {id:"p6",cat:"Sécurité",label:"Sécurité des biens et des personnes"},
    {id:"p7",cat:"Hygiène & qualité",label:"Propreté et rangement des chariots"},
    {id:"p8",cat:"Hygiène & qualité",label:"Respect et conformité de la signalétique"},
    {id:"p9",cat:"Hygiène & qualité",label:"Regards et caniveaux"},
  ]},
  {id:"terrasse",label:"Terrasse",icon:"☀️",items:[
    {id:"t1",cat:"Hygiène & qualité",label:"Propreté (poubelle, sol, table)"},
    {id:"t2",cat:"Hygiène & qualité",label:"Propreté et état du mobilier"},
    {id:"t3",cat:"Hygiène & qualité",label:"Utilisation client"},
    {id:"t4",cat:"Hygiène & qualité",label:"Entretien fleurs et plantes (contrat jardinier)"},
  ]},
  {id:"surface",label:"Surface de vente",icon:"🛒",items:[
    {id:"s1",cat:"Outils & matériels",label:"Groupe électrogène fonctionnel (carburant)"},
    {id:"s2",cat:"Outils & matériels",label:"Fonctionnement des portes automatiques"},
    {id:"s3",cat:"Outils & matériels",label:"Fonctionnement des rideaux d'air"},
    {id:"s4",cat:"Outils & matériels",label:"Fonctionnement de la climatisation"},
    {id:"s5",cat:"Outils & matériels",label:"État des consignes (chaussures vigiles…)"},
    {id:"s6",cat:"Outils & matériels",label:"Ascenseurs et monte-charges"},
    {id:"s7",cat:"Effectif & personnel",label:"Présence vigiles conforme au planning"},
    {id:"s8",cat:"Effectif & personnel",label:"Présence agents nettoyage conforme au planning"},
  ]},
  {id:"caisse",label:"Ligne de caisse",icon:"💳",items:[
    {id:"c1",cat:"Effectif & personnel",label:"Présence caissières et hôtesses (planning)"},
    {id:"c2",cat:"Outils & matériels",label:"Boutons d'appel clients et afficheurs"},
    {id:"c3",cat:"Outils & matériels",label:"Fonctionnement TPE et détecteurs faux billets"},
    {id:"c4",cat:"Produit",label:"Tenue des devants de caisses"},
    {id:"c5",cat:"Effectif & personnel",label:"Présence et tenues des porteurs"},
    {id:"c6",cat:"Hygiène & qualité",label:"Propreté et rangement chariots et paniers"},
  ]},
  {id:"sec",label:"Secteur Sec",icon:"📦",items:[
    {id:"sec1",cat:"Effectif & personnel",label:"Tenue, propreté et port du badge"},
    {id:"sec2",cat:"Effectif & personnel",label:"Effectif suffisant (planning)"},
    {id:"sec3",cat:"Hygiène & qualité",label:"Propreté des gondoles et des produits"},
    {id:"sec4",cat:"Produit",label:"Disponibilité des produits (20/80 ou PGC)"},
    {id:"sec5",cat:"Produit",label:"Vérification de l'affichage des prix"},
    {id:"sec6",cat:"Produit",label:"MAJ nouvelle version (étiquettes, validation directeur)"},
    {id:"sec7",cat:"Produit",label:"Respect des implantations"},
    {id:"sec8",cat:"Produit",label:"Présence étiquettes et points fidélité"},
    {id:"sec9",cat:"Produit",label:"Suivi et vérification des promos"},
    {id:"sec10",cat:"Produit",label:"Tenue des TG"},
  ]},
  {id:"frais",label:"Secteur Frais",icon:"🥩",items:[
    {id:"f1",cat:"Produit",label:"Présence des produits (état de stock)"},
    {id:"f2",cat:"Hygiène & qualité",label:"Vérification qualité des produits frais"},
    {id:"f3",cat:"Hygiène & qualité",label:"Hygiène des rayons"},
    {id:"f4",cat:"Produit",label:"Présence des emballages (sachets, sacs)"},
    {id:"f5",cat:"Hygiène & qualité",label:"Propreté machine jus/café/viennoiserie"},
    {id:"f6",cat:"Produit",label:"Affichage des prix (versions, promos, harmonisation)"},
    {id:"f7",cat:"Outils & matériels",label:"État et besoins du matériel"},
    {id:"f8",cat:"Effectif & personnel",label:"Effectif suffisant (planning)"},
  ]},
  {id:"bureaux",label:"Bureaux",icon:"🗄️",items:[
    {id:"bu1",cat:"Hygiène & qualité",label:"Hygiène toilettes, vestiaires, bureaux, salle de repos"},
    {id:"bu2",cat:"Sécurité",label:"Local technique et informatique (encombrement)"},
    {id:"bu3",cat:"Sécurité",label:"OTS"},
    {id:"bu4",cat:"Outils & matériels",label:"Peintures"},
    {id:"bu9",cat:"Sécurité",label:"Sécurité biens et personnes (réception)"},
    {id:"bu10",cat:"Hygiène & qualité",label:"Fonctionnement et propreté (réception)"},
  ]},
  {id:"reception",label:"Réception",icon:"📬",items:[
    {id:"re1",cat:"Sécurité",label:"Aire de réception dégagée"},
    {id:"re2",cat:"Sécurité",label:"Aire de réception délimitée"},
    {id:"re3",cat:"Hygiène & qualité",label:"Fonctionnement et propreté (réception)"},
    {id:"re4",cat:"Effectif & personnel",label:"Réceptionnaire présent"},
    {id:"re5",cat:"Sécurité",label:"Sécurité biens et personnes (réception)"},
  ]},
  {id:"reserve",label:"Réserves & chambres froides",icon:"❄️",items:[
    {id:"r1",cat:"Hygiène & qualité",label:"Réserve épicerie / liquides / non alimentaires propre"},
    {id:"r2",cat:"Produit",label:"Produits stockés par famille"},
    {id:"r3",cat:"Produit",label:"Marchandise en quantité suffisante (surstock ?)"},
    {id:"r4",cat:"Produit",label:"Rotation FIFO respectée"},
    {id:"r5",cat:"Hygiène & qualité",label:"Zone casse délimitée et propre"},
    {id:"r6",cat:"Hygiène & qualité",label:"Zone retour identifiable"},
    {id:"r7",cat:"Sécurité",label:"Détecteurs de fumée fonctionnels"},
    {id:"r8",cat:"Sécurité",label:"Extincteurs présents et accessibles"},
    {id:"r9",cat:"Hygiène & qualité",label:"Dispositif anti-nuisible en place"},
    {id:"r10",cat:"Sécurité",label:"Abords dégagés"},
    {id:"r11",cat:"Hygiène & qualité",label:"Température relevée (chambres froides)"},
    {id:"r12",cat:"Hygiène & qualité",label:"Murs et plafonds nettoyés (chambres froides)"},
    {id:"r13",cat:"Hygiène & qualité",label:"Planning de nettoyage présent"},
    {id:"r14",cat:"Hygiène & qualité",label:"Fiche de température présente"},
    {id:"r15",cat:"Hygiène & qualité",label:"État portes (joints, poignées) et revêtement"},
    {id:"r16",cat:"Hygiène & qualité",label:"Siphons présents et en état"},
    {id:"r17",cat:"Hygiène & qualité",label:"Évacuations en bon état"},
    {id:"r18",cat:"Hygiène & qualité",label:"Zone casse < 48h DLV présente"},
    {id:"r19",cat:"Hygiène & qualité",label:"Pas de produits à même le sol"},
    {id:"r20",cat:"Sécurité",label:"Sécurité biens et personnes (chambres froides)"},
  ]},
  {id:"securite",label:"Sécurité générale",icon:"🔒",items:[
    {id:"sg1",cat:"Sécurité",label:"Nombre suffisant d'agents à la réception"},
    {id:"sg2",cat:"Sécurité",label:"Contrôle entrées/sorties marchandises"},
    {id:"sg3",cat:"Sécurité",label:"Contrôle entrées/sorties personnel"},
    {id:"sg4",cat:"Sécurité",label:"Contrôle tickets (dates, désignation, quantités)"},
    {id:"sg5",cat:"Sécurité",label:"Issues de secours dégagées, accès extincteurs"},
    {id:"sg6",cat:"Sécurité",label:"Fonctionnement antennes antivol"},
    {id:"sg7",cat:"Sécurité",label:"Protection des produits à risque"},
    {id:"sg8",cat:"Sécurité",label:"Accès sécurisé salle des coffres"},
  ]},
  {id:"custom",label:"Items personnalisés",icon:"✏️",items:[]},
]

export const STATUTS = [
  {val:"S" as const,label:"Satisfaisant",color:"#16a34a",bg:"#dcfce7",short:"✅"},
  {val:"M" as const,label:"Moyen",color:"#d97706",bg:"#fef3c7",short:"⚠️"},
  {val:"NS" as const,label:"Non satisfaisant",color:"#dc2626",bg:"#fee2e2",short:"❌"},
  {val:"NA" as const,label:"N/A",color:"#6b7280",bg:"#f3f4f6",short:"—"},
]

export const DEADLINE_TYPES = [
  {val:"immediat" as const,label:"Immédiat",icon:"🚨",color:"#dc2626",bg:"#fee2e2",desc:"Corriger maintenant"},
  {val:"continu" as const,label:"En continu",icon:"🔄",color:"#7c3aed",bg:"#ede9fe",desc:"Surveillance permanente"},
  {val:"date" as const,label:"Date fixée",icon:"📅",color:"#0369a1",bg:"#e0f2fe",desc:"Choisir une date"},
]

export const CAT_ICONS: Record<string, string> = {
  "Hygiène & qualité":"🧹",
  "Effectif & personnel":"👥",
  "Sécurité":"🔒",
  "Outils & matériels":"🔧",
  "Produit":"📦",
  "Autre":"📋"
}

export function today() {
  return new Date().toISOString().slice(0,10)
}

export function scoreOf(res: Record<string, ResultItem> | null | undefined): number {
  if (!res) return 0
  const v = Object.values(res).map(r => r.statut).filter((s): s is "S" | "M" | "NS" => !!s && s !== "NA")
  return v.length ? Math.round(v.filter(x => x === "S").length / v.length * 100) : 0
}

export function scoreColor(s: number): string {
  return s >= 80 ? "#16a34a" : s >= 60 ? "#d97706" : "#dc2626"
}

function daysDiff(d: string): number | null {
  if (!d) return null
  const n = new Date(); n.setHours(0,0,0,0)
  return Math.round((new Date(d).getTime() - n.getTime()) / 86400000)
}

export function getDeadlineBadge(r?: ResultItem | null) {
  if (!r) return null
  if (r.deadlineType === "immediat") return {text:"Immédiat",color:"#dc2626",bg:"#fee2e2",urgent:true as const}
  if (r.deadlineType === "continu")  return {text:"En continu",color:"#7c3aed",bg:"#ede9fe",urgent:false as const}
  if (r.deadlineType === "date" && r.deadline) {
    const d = daysDiff(r.deadline)
    if (d === null) return null
    if (d < 0)  return {text:`Dépassée de ${Math.abs(d)}j`,color:"#dc2626",bg:"#fee2e2",urgent:true as const}
    if (d === 0) return {text:"Aujourd'hui !",color:"#dc2626",bg:"#fee2e2",urgent:true as const}
    if (d <= 3)  return {text:`Dans ${d}j`,color:"#d97706",bg:"#fef3c7",urgent:true as const}
    return {text:`${r.deadline} (dans ${d}j)`,color:"#16a34a",bg:"#dcfce7",urgent:false as const}
  }
  return null
}

export function computeCounts(results: Record<string, ResultItem>): Record<string, number> {
  const counts: Record<string, number> = {S:0, M:0, NS:0, NA:0}
  Object.values(results).forEach(r => {
    if (r.statut && counts[r.statut] !== undefined) counts[r.statut]++
  })
  return counts
}

export function getAllCats(zones: Zone[]): string[] {
  const cats = new Set<string>()
  zones.forEach(z => z.items.forEach(i => cats.add(i.cat)))
  return Array.from(cats)
}
