import { useState, useRef, useEffect, useCallback, memo, Fragment } from "react";

// ── ZONES ──────────────────────────────────────────────────────────────
const ZONES = [
  {id:"batiment", label:"Bâtiment", icon:"🏢", items:[
    {id:"b1", cat:"Hygiène & qualité", label:"Façade : état et propreté (fissures, moisissures)"},
    {id:"b2", cat:"Hygiène & qualité", label:"Enseigne : propreté, visibilité, éclairage fonctionnel"},
    {id:"b3", cat:"Hygiène & qualité", label:"Dalle et toitures (contrat d'entretien)"},
    {id:"b4", cat:"Hygiène & qualité", label:"Problèmes voisinage (ex : fuites d'eau)"},
  ]},
  {id:"parking", label:"Parking & extérieur", icon:"🅿️", items:[
    {id:"p1", cat:"Effectif & personnel", label:"Nombre de vigiles suffisant (planning, propreté stores)"},
    {id:"p2", cat:"Sécurité", label:"Tracé et délimitation des zones de parking"},
    {id:"p3", cat:"Hygiène & qualité", label:"Tenues des vigiles propres"},
    {id:"p4", cat:"Sécurité", label:"Identification des véhicules présents"},
    {id:"p5", cat:"Hygiène & qualité", label:"Local poubelle"},
    {id:"p6", cat:"Sécurité", label:"Sécurité des biens et des personnes"},
    {id:"p7", cat:"Hygiène & qualité", label:"Propreté et rangement des chariots"},
    {id:"p8", cat:"Hygiène & qualité", label:"Respect et conformité de la signalétique"},
    {id:"p9", cat:"Hygiène & qualité", label:"Regards et caniveaux"},
  ]},
  {id:"terrasse", label:"Terrasse", icon:"☀️", items:[
    {id:"t1", cat:"Hygiène & qualité", label:"Propreté (poubelle, sol, table)"},
    {id:"t2", cat:"Hygiène & qualité", label:"Propreté et état du mobilier"},
    {id:"t3", cat:"Hygiène & qualité", label:"Utilisation client"},
    {id:"t4", cat:"Hygiène & qualité", label:"Entretien fleurs et plantes (contrat jardinier)"},
  ]},
  {id:"surface", label:"Surface de vente", icon:"🛒", items:[
    {id:"s1", cat:"Outils & matériels", label:"Groupe électrogène fonctionnel (carburant)"},
    {id:"s2", cat:"Outils & matériels", label:"Fonctionnement des portes automatiques"},
    {id:"s3", cat:"Outils & matériels", label:"Fonctionnement des rideaux d'air"},
    {id:"s4", cat:"Outils & matériels", label:"Fonctionnement de la climatisation"},
    {id:"s5", cat:"Outils & matériels", label:"État des consignes (chaussures vigiles…)"},
    {id:"s6", cat:"Outils & matériels", label:"Ascenseurs et monte-charges"},
    {id:"s7", cat:"Effectif & personnel", label:"Présence vigiles conforme au planning"},
    {id:"s8", cat:"Effectif & personnel", label:"Présence agents nettoyage conforme au planning"},
  ]},
  {id:"caisse", label:"Ligne de caisse", icon:"💳", items:[
    {id:"c1", cat:"Effectif & personnel", label:"Présence caissières et hôtesses (planning)"},
    {id:"c2", cat:"Outils & matériels", label:"Boutons d'appel clients et afficheurs"},
    {id:"c3", cat:"Outils & matériels", label:"Fonctionnement TPE et détecteurs faux billets"},
    {id:"c4", cat:"Produit", label:"Tenue des devants de caisses"},
    {id:"c5", cat:"Effectif & personnel", label:"Présence et tenues des porteurs"},
    {id:"c6", cat:"Hygiène & qualité", label:"Propreté et rangement chariots et paniers"},
  ]},
  {id:"sec", label:"Secteur Sec", icon:"📦", items:[
    {id:"sec1", cat:"Effectif & personnel", label:"Tenue, propreté et port du badge"},
    {id:"sec2", cat:"Effectif & personnel", label:"Effectif suffisant (planning)"},
    {id:"sec3", cat:"Hygiène & qualité", label:"Propreté des gondoles et des produits"},
    {id:"sec4", cat:"Produit", label:"Disponibilité des produits (20/80 ou PGC)"},
    {id:"sec5", cat:"Produit", label:"Vérification de l'affichage des prix"},
    {id:"sec6", cat:"Produit", label:"MAJ nouvelle version (étiquettes, validation directeur)"},
    {id:"sec7", cat:"Produit", label:"Respect des implantations"},
    {id:"sec8", cat:"Produit", label:"Présence étiquettes et points fidélité"},
    {id:"sec9", cat:"Produit", label:"Suivi et vérification des promos"},
    {id:"sec10", cat:"Produit", label:"Tenue des TG"},
  ]},
  {id:"frais", label:"Secteur Frais", icon:"🥩", items:[
    {id:"f1", cat:"Produit", label:"Présence des produits (état de stock)"},
    {id:"f2", cat:"Hygiène & qualité", label:"Vérification qualité des produits frais"},
    {id:"f3", cat:"Hygiène & qualité", label:"Hygiène des rayons"},
    {id:"f4", cat:"Produit", label:"Présence des emballages (sachets, sacs)"},
    {id:"f5", cat:"Hygiène & qualité", label:"Propreté machine jus/café/viennoiserie"},
    {id:"f6", cat:"Produit", label:"Affichage des prix (versions, promos, harmonisation)"},
    {id:"f7", cat:"Outils & matériels", label:"État et besoins du matériel"},
    {id:"f8", cat:"Effectif & personnel", label:"Effectif suffisant (planning)"},
  ]},
  {id:"bureaux", label:"Bureaux", icon:"🗄️", items:[
    {id:"bu1", cat:"Hygiène & qualité", label:"Hygiène toilettes, vestiaires, bureaux, salle de repos"},
    {id:"bu2", cat:"Sécurité", label:"Local technique et informatique (encombrement)"},
    {id:"bu3", cat:"Sécurité", label:"OTS"},
    {id:"bu4", cat:"Outils & matériels", label:"Peintures"},
    {id:"bu9", cat:"Sécurité", label:"Sécurité biens et personnes (réception)"},
    {id:"bu10", cat:"Hygiène & qualité", label:"Fonctionnement et propreté (réception)"},
  ]},
  {id:"reception", label:"Réception", icon:"📬", items:[
    {id:"re1", cat:"Sécurité", label:"Aire de réception dégagée"},
    {id:"re2", cat:"Sécurité", label:"Aire de réception délimitée"},
    {id:"re3", cat:"Hygiène & qualité", label:"Fonctionnement et propreté (réception)"},
    {id:"re4", cat:"Effectif & personnel", label:"Réceptionnaire présent"},
    {id:"re5", cat:"Sécurité", label:"Sécurité biens et personnes (réception)"},
  ]},
  {id:"reserve", label:"Réserves & chambres froides", icon:"❄️", items:[
    {id:"r1", cat:"Hygiène & qualité", label:"Réserve épicerie / liquides / non alimentaires propre"},
    {id:"r2", cat:"Produit", label:"Produits stockés par famille"},
    {id:"r3", cat:"Produit", label:"Marchandise en quantité suffisante (surstock ?)"},
    {id:"r4", cat:"Produit", label:"Rotation FIFO respectée"},
    {id:"r5", cat:"Hygiène & qualité", label:"Zone casse délimitée et propre"},
    {id:"r6", cat:"Hygiène & qualité", label:"Zone retour identifiable"},
    {id:"r7", cat:"Sécurité", label:"Détecteurs de fumée fonctionnels"},
    {id:"r8", cat:"Sécurité", label:"Extincteurs présents et accessibles"},
    {id:"r9", cat:"Hygiène & qualité", label:"Dispositif anti-nuisible en place"},
    {id:"r10", cat:"Sécurité", label:"Abords dégagés"},
    {id:"r11", cat:"Hygiène & qualité", label:"Température relevée (chambres froides)"},
    {id:"r12", cat:"Hygiène & qualité", label:"Murs et plafonds nettoyés (chambres froides)"},
    {id:"r13", cat:"Hygiène & qualité", label:"Planning de nettoyage présent"},
    {id:"r14", cat:"Hygiène & qualité", label:"Fiche de température présente"},
    {id:"r15", cat:"Hygiène & qualité", label:"État portes (joints, poignées) et revêtement"},
    {id:"r16", cat:"Hygiène & qualité", label:"Siphons présents et en état"},
    {id:"r17", cat:"Hygiène & qualité", label:"Évacuations en bon état"},
    {id:"r18", cat:"Hygiène & qualité", label:"Zone casse < 48h DLV présente"},
    {id:"r19", cat:"Hygiène & qualité", label:"Pas de produits à même le sol"},
    {id:"r20", cat:"Sécurité", label:"Sécurité biens et personnes (chambres froides)"},
  ]},
  {id:"securite", label:"Sécurité générale", icon:"🔒", items:[
    {id:"sg1", cat:"Sécurité", label:"Nombre suffisant d'agents à la réception"},
    {id:"sg2", cat:"Sécurité", label:"Contrôle entrées/sorties marchandises"},
    {id:"sg3", cat:"Sécurité", label:"Contrôle entrées/sorties personnel"},
    {id:"sg4", cat:"Sécurité", label:"Contrôle tickets (dates, désignation, quantités)"},
    {id:"sg5", cat:"Sécurité", label:"Issues de secours dégagées, accès extincteurs"},
    {id:"sg6", cat:"Sécurité", label:"Fonctionnement antennes antivol"},
    {id:"sg7", cat:"Sécurité", label:"Protection des produits à risque"},
    {id:"sg8", cat:"Sécurité", label:"Accès sécurisé salle des coffres"},
  ]},
  {id:"custom", label:"Items personnalisés", icon:"✏️", items:[]},
];

const STATUTS = [
  {val:"S", label:"Satisfaisant", color:"#16a34a", bg:"#dcfce7", short:"✅"},
  {val:"M", label:"Moyen", color:"#d97706", bg:"#fef3c7", short:"⚠️"},
  {val:"NS", label:"Non satisfaisant", color:"#dc2626", bg:"#fee2e2", short:"❌"},
  {val:"NA", label:"N/A", color:"#6b7280", bg:"#f3f4f6", short:"—"},
];
const DEADLINE_TYPES = [
  {val:"immediat", label:"Immédiat", icon:"🚨", color:"#dc2626", bg:"#fee2e2", desc:"Corriger maintenant"},
  {val:"continu", label:"En continu", icon:"🔄", color:"#7c3aed", bg:"#ede9fe", desc:"Surveillance permanente"},
  {val:"date", label:"Date fixée", icon:"📅", color:"#0369a1", bg:"#e0f2fe", desc:"Choisir une date"},
];
const CAT_ICONS = {"Hygiène & qualité":"🧹", "Effectif & personnel":"👥", "Sécurité":"🔒", "Outils & matériels":"🔧", "Produit":"📦", "Autre":"📋"};

// ── Magasins Prosuma par défaut ────────────────────────────────────────
const MAGASINS_DEFAUT = [
  "Prosuma Marcory",
  "Prosuma Cocody",
  "Prosuma Plateau",
  "Prosuma Yopougon",
  "Prosuma Abobo",
  "Prosuma Koumassi",
  "Prosuma Port-Bouët",
  "Prosuma Treichville",
  "Prosuma Adjamé",
  "Prosuma Bingerville",
];

const AUDITS_KEY   = "prosuma-audits";
const MAGASINS_KEY = "prosuma-magasins";
const DRAFTS_KEY   = "prosuma-drafts";

// ── Helpers ────────────────────────────────────────────────────────────
function today() { return new Date().toISOString().slice(0, 10); }
function scoreOf(res) {
  if (!res) return 0;
  const v = Object.values(res).map(r => r.statut).filter(s => s && s !== "NA");
  return v.length ? Math.round(v.filter(x => x === "S").length / v.length * 100) : 0;
}
function scoreColor(s) { return s >= 80 ? "#16a34a" : s >= 60 ? "#d97706" : "#dc2626"; }
function daysDiff(d) {
  if (!d) return null;
  const n = new Date(); n.setHours(0, 0, 0, 0);
  return Math.round((new Date(d) - n) / 86400000);
}
function getDeadlineBadge(r) {
  if (!r) return null;
  if (r.deadlineType === "immediat") return {text:"Immédiat", color:"#dc2626", bg:"#fee2e2", urgent:true};
  if (r.deadlineType === "continu")  return {text:"En continu", color:"#7c3aed", bg:"#ede9fe", urgent:false};
  if (r.deadlineType === "date" && r.deadline) {
    const d = daysDiff(r.deadline);
    if (d < 0)  return {text:"Dépassée de "+Math.abs(d)+"j", color:"#dc2626", bg:"#fee2e2", urgent:true};
    if (d === 0) return {text:"Aujourd'hui !", color:"#dc2626", bg:"#fee2e2", urgent:true};
    if (d <= 3)  return {text:"Dans "+d+"j", color:"#d97706", bg:"#fef3c7", urgent:true};
    return {text:r.deadline+" (dans "+d+"j)", color:"#16a34a", bg:"#dcfce7", urgent:false};
  }
  return null;
}

// ── Storage (localStorage — synchrone) ─────────────────────────────────
function lsGet(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function loadAudits()   { return lsGet(AUDITS_KEY, []); }
function saveAudits(a)  { lsSet(AUDITS_KEY, a); }
function loadDrafts()   { return lsGet(DRAFTS_KEY, []); }
function saveDrafts(a)  { lsSet(DRAFTS_KEY, a); }
function deleteDraft(id) { saveDrafts(loadDrafts().filter(d => d.id !== id)); }
function loadMagasins() {
  const stored = lsGet(MAGASINS_KEY, []);
  return [...new Set([...MAGASINS_DEFAUT, ...stored])];
}
function saveMagasins(a) { lsSet(MAGASINS_KEY, a); }

// ── CSV ────────────────────────────────────────────────────────────────
function csvRow(r) { return r.map(c => '"' + (c||"").toString().replace(/"/g,'""') + '"').join(","); }
function getZoneItems(zone, customItems) {
  return { ...zone, items: [...(zone.items||[]), ...((customItems[zone.id]||[]))] };
}
function toCSVSingle(audit) {
  const zl = ZONES.map(z => getZoneItems(z, audit.customItems||{}));
  const rows = [["Zone","Categorie","Critere","Resultat","Commentaire","Plan action","Type delai","Date deadline","Statut"]];
  zl.forEach(z => z.items.forEach(item => {
    const r = (audit.results||{})[item.id] || {};
    rows.push([z.label, item.cat, item.label, r.statut||"", r.comment||"", r.action||"", r.deadlineType||"", r.deadlineType==="date"?(r.deadline||""):"", r.resolved?"Resolue":"En cours"]);
  }));
  const meta = [["RAPPORT AUDIT SUPERVISEUR - PROSUMA"],["Date", audit.date],["Magasin", audit.magasin],["Superviseur", audit.superviseur],["Score", scoreOf(audit.results)+"%"],[]];
  return [...meta, ...rows].map(csvRow).join("\n");
}
function toCSVConsolide(list, filtre) {
  const l = filtre ? list.filter(a => a.magasin === filtre) : list;
  if (!l.length) return "";
  const si = ZONES.flatMap(z => z.items);
  const h = ["Magasin","Date","Superviseur","Score","S","M","NS","NA", ...si.map(i => i.label)];
  return [h, ...l.map(a => [a.magasin, a.date, a.superviseur, scoreOf(a.results)+"%", (a.counts&&a.counts.S)||0, (a.counts&&a.counts.M)||0, (a.counts&&a.counts.NS)||0, (a.counts&&a.counts.NA)||0, ...si.map(i => ((a.results||{})[i.id]||{}).statut||"")])].map(csvRow).join("\n");
}
function toCSVDetail(list, filtre) {
  const l = filtre ? list.filter(a => a.magasin === filtre) : list;
  if (!l.length) return "";
  const h = ["Magasin","Date","Superviseur","Score","Zone","Categorie","Critere","Resultat","Commentaire","Plan action","Type delai","Date deadline","Statut"];
  const rows = [];
  l.forEach(a => {
    const zl = ZONES.map(z => getZoneItems(z, a.customItems||{}));
    const sc = scoreOf(a.results)+"%";
    zl.forEach(z => z.items.forEach(item => {
      const r = (a.results||{})[item.id] || {};
      if (!r.statut) return;
      rows.push([a.magasin, a.date, a.superviseur, sc, z.label, item.cat, item.label, r.statut||"", r.comment||"", r.action||"", r.deadlineType||"", r.deadlineType==="date"?(r.deadline||""):"", r.resolved?"Resolue":"En cours"]);
    }));
  });
  return [h, ...rows].map(csvRow).join("\n");
}

// ── Atoms ──────────────────────────────────────────────────────────────
function Badge({bg, color, children}) {
  return <span style={{fontSize:11, padding:"2px 8px", borderRadius:10, background:bg, color, whiteSpace:"nowrap"}}>{children}</span>;
}
function ScoreCircle({score, size}) {
  const sz = size||44;
  const c = scoreColor(score);
  return <div style={{width:sz, height:sz, borderRadius:"50%", background:c+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:sz>40?14:11, fontWeight:500, color:c, flexShrink:0}}>{score}%</div>;
}
function Toast({toast}) {
  if (!toast) return null;
  return <div style={{position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", zIndex:9999, background:toast.ok===false?"#7f1d1d":"#14532d", color:"#fff", padding:"8px 18px", borderRadius:20, fontSize:13, fontWeight:500, boxShadow:"0 2px 8px rgba(0,0,0,.25)", whiteSpace:"nowrap", pointerEvents:"none"}}>{toast.msg}</div>;
}

// ── ItemCard ───────────────────────────────────────────────────────────
const ItemCard = memo(function ItemCard({
  itemId, itemLabel, itemCat, zoneIcon, zonelabel, showZone, isCustom,
  statut, comment, action, deadlineType, deadline, photoUrls, isExpanded,
  onStatut, onField, onToggle, onRemove, onAddPhoto, onRemovePhoto, fileRef
}) {
  const r = {statut, comment, action, deadlineType, deadline, photoUrls: photoUrls||[]};
  const st = STATUTS.find(s => s.val === statut);
  const dl = getDeadlineBadge(r);
  const sel = deadlineType||"";
  return (
    <div style={{border:"0.5px solid "+(statut==="NS"?"#fca5a5":statut==="M"?"#fcd34d":"#e5e7eb"), borderRadius:10, marginBottom:8, background:statut?"#fff":"#f9fafb"}}>
      <div style={{padding:"10px 12px"}}>
        <div style={{display:"flex", alignItems:"flex-start", gap:8, marginBottom:8}}>
          <div style={{flex:1, minWidth:0}}>
            {showZone && <div style={{fontSize:10, color:"#ED7D31", marginBottom:1}}>{zoneIcon} {zonelabel}</div>}
            <div style={{fontSize:10, color:"#6b7280", marginBottom:2}}>{itemCat}</div>
            <div style={{fontSize:13, color:"#111", lineHeight:1.4}}>{itemLabel}</div>
          </div>
          <div style={{display:"flex", gap:6, alignItems:"center"}}>
            {st && <Badge bg={st.bg} color={st.color}>{st.label}</Badge>}
            {isCustom && <button onClick={() => onRemove(itemId)} style={{background:"none", border:"none", cursor:"pointer", color:"#dc2626", fontSize:14, padding:0, lineHeight:1}}>✕</button>}
          </div>
        </div>
        {dl && !isExpanded && <div style={{marginBottom:6}}><Badge bg={dl.bg} color={dl.color}>{dl.text}</Badge></div>}
        <div style={{display:"flex", gap:5}}>
          {STATUTS.map(s => (
            <button key={s.val} onClick={() => onStatut(itemId, s.val)}
              style={{flex:1, padding:"6px 2px", fontSize:11, borderRadius:6, fontWeight:statut===s.val?500:400, border:"1.5px solid "+(statut===s.val?s.color:s.color+"55"), background:statut===s.val?s.bg:"transparent", color:statut===s.val?s.color:"#6b7280", cursor:"pointer"}}>
              {s.short} {s.val}
            </button>
          ))}
          <button onClick={() => onToggle(itemId)} style={{padding:"6px 10px", fontSize:13, borderRadius:6, border:"0.5px solid #e5e7eb", background:"none", cursor:"pointer", color:"#6b7280"}}>
            {isExpanded ? "▲" : "▼"}
          </button>
        </div>
      </div>
      {isExpanded && (
        <div style={{padding:"0 12px 12px", borderTop:"0.5px solid #e5e7eb", paddingTop:10}}>
          <div style={{marginBottom:10}}>
            <label style={{fontSize:12, color:"#6b7280", display:"block", marginBottom:3}}>Commentaire</label>
            <textarea value={comment||""} onChange={e => onField(itemId,"comment",e.target.value)} placeholder="Observations..." rows={2}
              style={{width:"100%", boxSizing:"border-box", fontSize:12, borderRadius:6, border:"0.5px solid #e5e7eb", padding:"6px 8px", resize:"vertical", background:"#fff", color:"#111"}}/>
          </div>
          <div style={{marginBottom:10}}>
            <label style={{fontSize:12, color:"#6b7280", display:"block", marginBottom:3}}>Plan d'action</label>
            <textarea value={action||""} onChange={e => onField(itemId,"action",e.target.value)} placeholder="Action corrective..." rows={2}
              style={{width:"100%", boxSizing:"border-box", fontSize:12, borderRadius:6, border:"0.5px solid #e5e7eb", padding:"6px 8px", resize:"vertical", background:"#fff", color:"#111"}}/>
          </div>
          <div style={{marginBottom:10}}>
            <label style={{fontSize:12, color:"#6b7280", display:"block", marginBottom:6}}>Délai de correction</label>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:sel==="date"?8:0}}>
              {DEADLINE_TYPES.map(dt => (
                <button key={dt.val} onClick={() => onField(itemId,"deadlineType",dt.val)}
                  style={{padding:"8px 4px", borderRadius:8, border:"1.5px solid "+(sel===dt.val?dt.color:dt.color+"44"), background:sel===dt.val?dt.bg:"transparent", color:sel===dt.val?dt.color:"#6b7280", cursor:"pointer", textAlign:"center"}}>
                  <div style={{fontSize:16}}>{dt.icon}</div>
                  <div style={{fontSize:11, fontWeight:sel===dt.val?500:400}}>{dt.label}</div>
                  <div style={{fontSize:10, opacity:.8}}>{dt.desc}</div>
                </button>
              ))}
            </div>
            {sel==="date" && <input type="date" value={deadline||""} onChange={e => onField(itemId,"deadline",e.target.value)} style={{width:"100%", boxSizing:"border-box", marginTop:4}}/>}
          </div>
          <div>
            <label style={{fontSize:12, color:"#6b7280", display:"block", marginBottom:6}}>Photos</label>
            <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
              {(photoUrls||[]).map((ph,i) => (
                <div key={i} style={{position:"relative", width:60, height:60, borderRadius:6, overflow:"hidden", border:"0.5px solid #e5e7eb"}}>
                  <img src={ph.url} style={{width:"100%", height:"100%", objectFit:"cover"}} alt=""/>
                  <button onClick={() => onRemovePhoto(itemId,i)} style={{position:"absolute", top:2, right:2, background:"rgba(0,0,0,.6)", border:"none", color:"#fff", borderRadius:"50%", width:16, height:16, fontSize:10, cursor:"pointer", lineHeight:"16px", padding:0}}>x</button>
                </div>
              ))}
              <button onClick={() => fileRef.current && fileRef.current.click()} style={{width:60, height:60, borderRadius:6, border:"1.5px dashed #d1d5db", background:"none", cursor:"pointer", fontSize:24, color:"#6b7280"}}>+</button>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e => onAddPhoto(itemId, e.target.files)}/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// ── Main App ───────────────────────────────────────────────────────────
export default function App() {
  const [page,            setPage]            = useState("loading");
  const [auditMode,       setAuditMode]       = useState("zone");
  const [selectedCat,     setSelectedCat]     = useState(null);
  const [audits,          setAudits]          = useState([]);
  const [magasins,        setMagasins]        = useState([]);
  const [drafts,          setDrafts]          = useState([]);
  const [currentDraftId,  setCurrentDraftId]  = useState(null);
  const [header,          setHeader]          = useState({date:today(), heure:"", magasin:"", superviseur:"", responsable:""});
  const [headerDone,      setHeaderDone]      = useState(false);
  const [zoneIdx,         setZoneIdx]         = useState(0);
  const [results,         setResults]         = useState({});
  const [expandedItem,    setExpandedItem]    = useState(null);
  const [viewAudit,       setViewAudit]       = useState(null);
  const [toast,           setToast]           = useState(null);
  const [reportAudit,     setReportAudit]     = useState(null);
  const [dbPage,          setDbPage]          = useState("list");
  const [filterMag,       setFilterMag]       = useState("tous");
  const [customItems,     setCustomItems]     = useState({});
  const [showAddItemZone, setShowAddItemZone] = useState(null);
  const [newItemLabel,    setNewItemLabel]    = useState("");
  const [newItemCat,      setNewItemCat]      = useState("Hygiène & qualité");
  const fileRefs = useRef({});
  const autoRef  = useRef(null);

  const ZONES_LIVE = ZONES.map(z => ({ ...z, items: [...(z.items||[]), ...((customItems[z.id])||[])] }));
  const ALL_CATS = [...new Set(ZONES_LIVE.flatMap(z => z.items.map(i => i.cat)))].sort();

  // Chargement initial synchrone depuis localStorage
  useEffect(() => {
    setAudits(loadAudits());
    setDrafts(loadDrafts());
    setMagasins(loadMagasins());
    setPage("home");
  }, []);

  // Auto-sauvegarde toutes les 30s
  useEffect(() => {
    if (page === "audit" && headerDone && currentDraftId) {
      autoRef.current = setInterval(() => {
        const all = loadDrafts();
        const up = all.map(d => d.id === currentDraftId ? {...d, header, results, zoneIdx, headerDone, auditMode, selectedCat, customItems, updatedAt: new Date().toISOString()} : d);
        saveDrafts(up);
        setDrafts(up);
      }, 30000);
    }
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [page, header, results, zoneIdx, headerDone, currentDraftId, auditMode, selectedCat, customItems]);

  function showToast(msg, ok) { setToast({msg, ok:ok!==false}); setTimeout(() => setToast(null), 2800); }

  const onStatut = useCallback((id, val) => {
    setResults(prev => ({...prev, [id]:{...(prev[id]||{}), statut:val}}));
    setExpandedItem(val==="S"||val==="NA" ? null : id);
  }, []);
  const onField = useCallback((id, field, val) => {
    setResults(prev => ({...prev, [id]:{...(prev[id]||{}), [field]:val}}));
  }, []);
  const onToggle = useCallback((id) => {
    setExpandedItem(prev => prev===id ? null : id);
  }, []);
  const onAddPhoto = useCallback((id, files) => {
    Array.from(files).forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setResults(prev => ({...prev, [id]:{...(prev[id]||{}), photoUrls:[...((prev[id]||{}).photoUrls||[]), {name:f.name, url:e.target.result}]}}));
      reader.readAsDataURL(f);
    });
  }, []);
  const onRemovePhoto = useCallback((id, idx) => {
    setResults(prev => ({...prev, [id]:{...(prev[id]||{}), photoUrls:((prev[id]||{}).photoUrls||[]).filter((_,i) => i!==idx)}}));
  }, []);
  const onRemoveCustom = useCallback((id) => {
    setCustomItems(prev => {
      const next = {};
      Object.keys(prev).forEach(zid => { next[zid] = prev[zid].filter(i => i.id !== id); });
      return next;
    });
    setResults(prev => { const c = {...prev}; delete c[id]; return c; });
  }, []);

  function getFileRef(id) { if (!fileRefs.current[id]) fileRefs.current[id] = {current:null}; return fileRefs.current[id]; }

  function renderItem(item, showZone, isCustom) {
    const r = results[item.id] || {};
    const ref = getFileRef(item.id);
    return <ItemCard key={item.id}
      itemId={item.id} itemLabel={item.label} itemCat={item.cat}
      zoneIcon={item.zoneicon||""} zonelabel={item.zonelabel||""}
      showZone={showZone} isCustom={isCustom}
      statut={r.statut||""} comment={r.comment||""} action={r.action||""}
      deadlineType={r.deadlineType||""} deadline={r.deadline||""}
      photoUrls={r.photoUrls||[]}
      isExpanded={expandedItem===item.id}
      onStatut={onStatut} onField={onField} onToggle={onToggle}
      onRemove={onRemoveCustom} onAddPhoto={onAddPhoto} onRemovePhoto={onRemovePhoto}
      fileRef={ref}
    />;
  }

  const totalItems = ZONES_LIVE.reduce((a,z) => a+z.items.length, 0);
  const answered = Object.keys(results).filter(k => results[k].statut).length;
  const pct = Math.round(answered / Math.max(totalItems,1) * 100);
  const counts = {S:0, M:0, NS:0, NA:0};
  Object.values(results).forEach(r => { if (r.statut) counts[r.statut]++; });
  const zone = ZONES_LIVE[zoneIdx] || ZONES_LIVE[0];

  // Actions correctives issues de tous les audits sauvegardés
  const allActions = [];
  audits.forEach(a => {
    const az = ZONES.map(z => getZoneItems(z, a.customItems||{}));
    az.forEach(z => z.items.forEach(item => {
      const r = (a.results||{})[item.id] || {};
      if ((r.statut==="NS"||r.statut==="M") && !r.resolved)
        allActions.push({auditId:a.id, auditDate:a.date, magasin:a.magasin, zone:z.label, zoneIcon:z.icon, item:item.label, cat:item.cat, statut:r.statut, comment:r.comment, action:r.action, deadlineType:r.deadlineType, deadline:r.deadline, itemId:item.id});
    }));
  });
  const urgentCount = allActions.filter(a => {
    if (a.deadlineType === "immediat") return true;
    if (a.deadlineType === "date") { const d = daysDiff(a.deadline); return d !== null && d <= 3; }
    return false;
  }).length;

  function startNewAudit() {
    setResults({}); setZoneIdx(0); setHeaderDone(false); setAuditMode("zone"); setSelectedCat(null);
    setCurrentDraftId(null); setCustomItems({}); setShowAddItemZone(null); setNewItemLabel("");
    setHeader({date:today(), heure:"", magasin:"", superviseur:"", responsable:""});
    setPage("audit");
  }

  function saveDraftManual() {
    const all = loadDrafts();
    if (currentDraftId) {
      const up = all.map(d => d.id === currentDraftId ? {...d, header, results, zoneIdx, headerDone, auditMode, selectedCat, customItems, updatedAt: new Date().toISOString()} : d);
      saveDrafts(up); setDrafts(up);
    } else {
      const id = Date.now().toString();
      const nd = {id, header, results, zoneIdx, headerDone, auditMode, selectedCat, customItems, updatedAt: new Date().toISOString()};
      const up = [...all, nd]; saveDrafts(up); setDrafts(up); setCurrentDraftId(id);
    }
    showToast("Brouillon sauvegardé");
  }

  function loadDraft(draft) {
    setHeader(draft.header||{date:today(), heure:"", magasin:"", superviseur:"", responsable:""});
    setResults(draft.results||{}); setZoneIdx(draft.zoneIdx||0); setHeaderDone(!!draft.headerDone);
    setAuditMode(draft.auditMode||"zone"); setSelectedCat(draft.selectedCat||null);
    setCustomItems(draft.customItems||{}); setCurrentDraftId(draft.id);
    setPage("audit"); showToast("Brouillon restauré");
  }

  function discardDraft(id) { deleteDraft(id); setDrafts(d => d.filter(x => x.id !== id)); showToast("Brouillon supprimé", false); }

  function saveAudit() {
    const audit = {id:Date.now().toString(), ...header, results, score:scoreOf(results), counts:{...counts}, customItems};
    const up = [audit, ...audits]; setAudits(up); saveAudits(up);
    if (currentDraftId) { deleteDraft(currentDraftId); setDrafts(d => d.filter(x => x.id !== currentDraftId)); setCurrentDraftId(null); }
    const nm = header.magasin.trim();
    if (nm && !magasins.includes(nm)) { const um = [...magasins, nm]; setMagasins(um); saveMagasins(um); }
    showToast("Audit sauvegardé"); setPage("summary");
  }

  function resolveAction(auditId, itemId) {
    const up = audits.map(a => a.id !== auditId ? a : {...a, results:{...a.results, [itemId]:{...(a.results[itemId]||{}), resolved:true}}});
    setAudits(up); saveAudits(up); showToast("Action résolue");
  }

  function deleteAudit(id) {
    if (!window.confirm("Supprimer cet audit ?")) return;
    const up = audits.filter(a => a.id !== id); setAudits(up); saveAudits(up); setViewAudit(null); showToast("Supprimé", false);
  }

  function downloadCSV(content, filename) {
    if (!content) { showToast("Aucune donnée", false); return; }
    try {
      const blob = new Blob(["\uFEFF"+content], {type:"text/csv;charset=utf-8;"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast("Export CSV lancé");
    } catch(e) { showToast("Erreur: "+e.message, false); }
  }

  function downloadWordDoc(audit) {
    const el = document.getElementById("rapport-word");
    if (!el) { showToast("Rapport introuvable", false); return; }
    const style = `body{font-family:Arial,sans-serif;font-size:11pt;color:#111;margin:20px;line-height:1.5}
table{border-collapse:collapse;width:100%;margin-bottom:10px}
td,th{padding:4px 8px;border:1px solid #ccc;font-size:10pt;vertical-align:top}
th{background:#f3f4f6;font-weight:bold}
img{max-width:80px;max-height:80px;margin:2px}`;
    const html = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8"><title>Rapport Audit</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>${style}</style></head>
<body>${el.innerHTML}</body></html>`;
    const blob = new Blob(["\uFEFF" + html], {type:"application/msword;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "Rapport_"+(audit.magasin||"").replace(/\s+/g,"_")+"_"+audit.date+".doc";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Document Word téléchargé");
  }
  function downloadExcelXLS(audit) {
    const auditZones = ZONES.map(z => getZoneItems(z, audit.customItems||{}));
    const sc = scoreOf(audit.results||{}); const c = audit.counts||{};
    const esc = s => (s||"").toString().replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    let rows = `<tr><td colspan="9" style="background:#ED7D31;color:#fff;font-size:14pt;font-weight:bold;padding:8px">RAPPORT DE SUPERVISION — RÉSEAU MANDARINE</td></tr>`;
    rows += `<tr><td style="font-weight:bold;background:#f3f4f6">Magasin</td><td colspan="8">${esc(audit.magasin)}</td></tr>`;
    rows += `<tr><td style="font-weight:bold;background:#f3f4f6">Date</td><td colspan="8">${esc(audit.date)} ${esc(audit.heure)}</td></tr>`;
    rows += `<tr><td style="font-weight:bold;background:#f3f4f6">Superviseur</td><td colspan="8">${esc(audit.superviseur)}</td></tr>`;
    rows += `<tr><td style="font-weight:bold;background:#f3f4f6">Responsable</td><td colspan="8">${esc(audit.responsable)}</td></tr>`;
    rows += `<tr><td style="font-weight:bold;background:#f3f4f6">Score</td><td colspan="8" style="font-size:18pt;font-weight:bold;color:${scoreColor(sc)}">${sc}%</td></tr>`;
    rows += `<tr><td style="font-weight:bold">S</td><td>${c.S||0}</td><td style="font-weight:bold">M</td><td>${c.M||0}</td><td style="font-weight:bold">NS</td><td>${c.NS||0}</td><td style="font-weight:bold">NA</td><td colspan="2">${c.NA||0}</td></tr>`;
    rows += `<tr><td colspan="9"></td></tr>`;
    rows += `<tr style="background:#374151;color:#fff;font-weight:bold"><td>Zone</td><td>Catégorie</td><td>Critère</td><td>Rés.</td><td>Commentaire</td><td>Plan action</td><td>Type délai</td><td>Deadline</td><td>Photos</td></tr>`;
    auditZones.forEach(z => (z.items||[]).forEach(item => {
      const r = (audit.results||{})[item.id]||{};
      if (!r.statut) return;
      rows += `<tr><td>${esc(z.icon)} ${esc(z.label)}</td><td>${esc(item.cat)}</td><td>${esc(item.label)}</td><td>${esc(r.statut)}</td><td>${esc(r.comment)}</td><td>${esc(r.action)}</td><td>${esc(r.deadlineType)}</td><td>${r.deadlineType==="date"?esc(r.deadline):""}</td><td>${(r.photoUrls||[]).length ? r.photoUrls.length+" photo(s)":""}</td></tr>`;
    }));
    const html = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8"><title>Export Excel</title>
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Audit</x:Name></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>td,th{border:1px solid #ccc;padding:4px 8px;font-size:10pt;vertical-align:top}th{font-weight:bold}</style></head>
<body><table>${rows}</table></body></html>`;
    const blob = new Blob(["\uFEFF" + html], {type:"application/vnd.ms-excel;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "Rapport_"+(audit.magasin||"").replace(/\s+/g,"_")+"_"+audit.date+".xls";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Document Excel téléchargé");
  }
  function downloadPDF() { window.print(); }

  function copyText(text) {
    try {
      const ta = document.createElement("textarea"); ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
      showToast("Copié ✓");
    } catch(e) { showToast("Erreur copie", false); }
  }

  function addCustomItem(zoneId) {
    if (!newItemLabel.trim()) return;
    const id = "cx_"+Date.now();
    setCustomItems(prev => ({...prev, [zoneId]:[...(prev[zoneId]||[]), {id, cat:newItemCat, label:newItemLabel.trim()}]}));
    setNewItemLabel(""); setShowAddItemZone(null);
  }

  const magasinsInDB = [...new Set(audits.map(a => a.magasin).filter(Boolean))].sort();

  // ── RAPPORT ────────────────────────────────────────────────────────────
  if (reportAudit) {
    const audit = reportAudit;
    const auditZones = ZONES.map(z => getZoneItems(z, audit.customItems||{}));
    const sc = scoreOf(audit.results||{});
    const c = audit.counts||{};
    const issues = [];
    auditZones.forEach(z => z.items.forEach(item => {
      const r = (audit.results||{})[item.id] || {};
      if (r.statut && r.statut !== "S" && r.statut !== "NA") issues.push({zone:z.label, icon:z.icon, item:item.label, r});
    }));
    const nsItems = issues.filter(i => i.r.statut === "NS");
    const mItems = issues.filter(i => i.r.statut === "M");
    let mailBody = "Bonjour,\n\nRapport de supervision du "+audit.date+" — "+audit.magasin+".\n\nSCORE : "+sc+"%  |  S:"+(c.S||0)+"  M:"+(c.M||0)+"  NS:"+(c.NS||0)+"\n\n";
    if (nsItems.length) { mailBody += "NON SATISFAISANT ("+nsItems.length+") :\n"; nsItems.forEach(i => { const dl=getDeadlineBadge(i.r); mailBody += "- "+i.zone+" : "+i.item+"\n"; if (i.r.action) mailBody += "  Action : "+i.r.action+"\n"; if (dl) mailBody += "  Delai : "+dl.text+"\n"; }); mailBody += "\n"; }
    if (mItems.length) { mailBody += "MOYEN ("+mItems.length+") :\n"; mItems.forEach(i => { const dl=getDeadlineBadge(i.r); mailBody += "- "+i.zone+" : "+i.item+"\n"; if (i.r.action) mailBody += "  Action : "+i.r.action+"\n"; if (dl) mailBody += "  Delai : "+dl.text+"\n"; }); mailBody += "\n"; }
    mailBody += "Cordialement,\n"+(audit.superviseur||"");
    return (
      <div style={{maxWidth:620,margin:"0 auto",padding:"1rem"}}>
        <Toast toast={toast}/>
        <Toast toast={toast}/>
        <button onClick={()=>setReportAudit(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#6b7280",marginBottom:12}}>← Retour</button>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
          <button onClick={()=>downloadWordDoc(audit)} style={{flex:1,minWidth:80,padding:"8px 12px",borderRadius:8,border:"none",background:"#ED7D31",color:"#fff",cursor:"pointer",fontWeight:500,fontSize:13}}>📝 Word</button>
          <button onClick={()=>downloadExcelXLS(audit)} style={{flex:1,minWidth:80,padding:"8px 12px",borderRadius:8,border:"none",background:"#16a34a",color:"#fff",cursor:"pointer",fontWeight:500,fontSize:13}}>📊 Excel</button>
          <button onClick={downloadPDF} style={{flex:1,minWidth:80,padding:"8px 12px",borderRadius:8,border:"none",background:"#dc2626",color:"#fff",cursor:"pointer",fontWeight:500,fontSize:13}}>📄 PDF</button>
        </div>
        <div id="rapport-word" style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"24px",fontFamily:"Arial,sans-serif",color:"#111",fontSize:13,lineHeight:1.6,userSelect:"all",WebkitUserSelect:"all"}}>
          <div style={{background:"#ED7D31",color:"#fff",padding:"14px 18px",borderRadius:6,marginBottom:16}}><div style={{fontSize:17,fontWeight:"bold",marginBottom:3}}>RAPPORT DE SUPERVISION — RÉSEAU MANDARINE</div><div style={{fontSize:12,opacity:.9}}>{audit.magasin} | {audit.date} {audit.heure||""} | Superviseur : {audit.superviseur||""}</div></div>
          <table style={{width:"100%",borderCollapse:"collapse",marginBottom:16,fontSize:12,border:"1px solid #e5e7eb"}}><tbody>
            <tr><td style={{padding:"6px 10px",fontWeight:"bold",background:"#f9fafb",width:"20%"}}>Magasin</td><td style={{padding:"6px 10px",width:"30%"}}>{audit.magasin}</td><td style={{padding:"6px 10px",fontWeight:"bold",background:"#f9fafb",width:"20%"}}>Date</td><td style={{padding:"6px 10px"}}>{audit.date} {audit.heure||""}</td></tr>
            <tr><td style={{padding:"6px 10px",fontWeight:"bold",background:"#f9fafb"}}>Superviseur</td><td style={{padding:"6px 10px"}}>{audit.superviseur||""}</td><td style={{padding:"6px 10px",fontWeight:"bold",background:"#f9fafb"}}>Responsable</td><td style={{padding:"6px 10px"}}>{audit.responsable||""}</td></tr>
          </tbody></table>
          <div style={{textAlign:"center",margin:"16px 0"}}><div style={{fontSize:48,fontWeight:"bold",color:scoreColor(sc),lineHeight:1}}>{sc}%</div><div style={{fontSize:12,color:"#666",marginTop:4}}>Score de conformité globale</div></div>
          <table style={{width:"100%",borderCollapse:"collapse",marginBottom:20}}><tbody><tr>{STATUTS.map(s=><td key={s.val} style={{padding:"10px 6px",textAlign:"center",background:s.bg,border:"3px solid #fff"}}><div style={{fontSize:20,fontWeight:"bold",color:s.color}}>{c[s.val]||0}</div><div style={{fontSize:10,color:s.color}}>{s.label}</div></td>)}</tr></tbody></table>
          {issues.length>0&&(<div style={{marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:"bold",color:"#dc2626",borderBottom:"2px solid #dc2626",paddingBottom:4,marginBottom:10}}>ACTIONS CORRECTIVES ({issues.length})</div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr style={{background:"#374151",color:"#fff"}}><th style={{padding:"7px 8px",textAlign:"left",width:"20%"}}>Zone</th><th style={{padding:"7px 8px",textAlign:"left",width:"35%"}}>Critère</th><th style={{padding:"7px 8px",textAlign:"center",width:"8%"}}>Rés.</th><th style={{padding:"7px 8px",textAlign:"left",width:"25%"}}>Plan d'action</th><th style={{padding:"7px 8px",textAlign:"left",width:"12%"}}>Délai</th></tr></thead>
            <tbody>{issues.map((iss,i)=>{const st2=STATUTS.find(s=>s.val===iss.r.statut);const dl=getDeadlineBadge(iss.r);return(<tr key={i} style={{background:i%2===0?"#fff":"#f9fafb",borderBottom:"1px solid #e5e7eb"}}><td style={{padding:"6px 8px",fontSize:11}}>{iss.icon} {iss.zone}</td><td style={{padding:"6px 8px"}}>{iss.item}</td><td style={{padding:"6px 8px",textAlign:"center"}}>{st2&&<span style={{background:st2.bg,color:st2.color,padding:"2px 5px",borderRadius:4,fontWeight:"bold",fontSize:11}}>{iss.r.statut}</span>}</td><td style={{padding:"6px 8px",fontSize:11,color:"#d97706"}}>{iss.r.action||iss.r.comment||"—"}</td><td style={{padding:"6px 8px",fontSize:11}}>{dl&&<span style={{background:dl.bg,color:dl.color,padding:"2px 5px",borderRadius:4,fontWeight:"bold",fontSize:10}}>{dl.text}</span>}</td></tr>);})}</tbody></table>
          </div>)}
          <div style={{fontSize:14,fontWeight:"bold",color:"#ED7D31",borderBottom:"2px solid #ED7D31",paddingBottom:4,marginBottom:12}}>DÉTAIL COMPLET PAR ZONE</div>
          {auditZones.map(z=>{
            const zItems=z.items.filter(i=>(audit.results||{})[i.id]&&(audit.results||{})[i.id].statut);
            if(!zItems.length) return null;
            return(<div key={z.id} style={{marginBottom:14}}>
              <div style={{background:"#ED7D31",color:"#fff",padding:"5px 10px",fontWeight:"bold",fontSize:12,borderRadius:"4px 4px 0 0"}}>{z.icon} {z.label}</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,border:"1px solid #e5e7eb"}}>
                <thead><tr style={{background:"#f3f4f6"}}><th style={{padding:"5px 8px",width:"8%",textAlign:"left",fontSize:11}}>Rés.</th><th style={{padding:"5px 8px",width:"18%",textAlign:"left",fontSize:11}}>Catégorie</th><th style={{padding:"5px 8px",width:"36%",textAlign:"left",fontSize:11}}>Critère</th><th style={{padding:"5px 8px",width:"24%",textAlign:"left",fontSize:11}}>Action</th><th style={{padding:"5px 8px",width:"14%",textAlign:"left",fontSize:11}}>Délai</th></tr></thead>
                <tbody>{zItems.map((item,i)=>{
                  const r=(audit.results||{})[item.id]||{};
                  const st2=STATUTS.find(s=>s.val===r.statut);
                  const dl=getDeadlineBadge(r);
                  const photos=r.photoUrls||[];
                  return(<Fragment key={item.id}>
                    <tr style={{background:i%2===0?"#fff":"#f9fafb",borderBottom:"1px solid #e5e7eb"}}>
                      <td style={{padding:"6px 8px",textAlign:"center"}}>{st2&&<span style={{background:st2.bg,color:st2.color,padding:"2px 5px",borderRadius:3,fontWeight:"bold",fontSize:10}}>{r.statut}</span>}</td>
                      <td style={{padding:"6px 8px",fontSize:11,color:"#6b7280"}}>{item.cat}</td>
                      <td style={{padding:"6px 8px"}}>{item.label}</td>
                      <td style={{padding:"6px 8px",fontSize:11,color:"#d97706"}}>{r.action||""}</td>
                      <td style={{padding:"6px 8px",fontSize:11}}>{dl&&<span style={{background:dl.bg,color:dl.color,padding:"2px 4px",borderRadius:3,fontSize:10,fontWeight:"bold"}}>{dl.text}</span>}</td>
                    </tr>
                    {photos.length>0&&<tr style={{background:i%2===0?"#fff":"#f9fafb",borderBottom:"1px solid #e5e7eb"}}><td colSpan={5} style={{padding:"6px 8px"}}><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{photos.map((ph,pi)=><img key={pi} src={ph.url} alt="" style={{width:80,height:80,objectFit:"cover",borderRadius:4,border:"1px solid #e5e7eb"}}/>)}</div></td></tr>}
                  </Fragment>);
                })}</tbody>
              </table>
            </div>);
          })}
          <div style={{borderTop:"1px solid #e5e7eb",marginTop:16,paddingTop:8,fontSize:11,color:"#9ca3af",textAlign:"center"}}>Rapport généré le {new Date().toLocaleDateString("fr-FR")} — Réseau Mandarine 2026</div>
        </div>
      </div>
    );
  }

  // ── LOADING ────────────────────────────────────────────────────────────
  if (page === "loading") return <div style={{display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"4rem", gap:12}}><div style={{fontSize:36}}>🛒</div><div style={{fontSize:14, color:"#6b7280"}}>Chargement...</div></div>;

  // ── HOME ───────────────────────────────────────────────────────────────
  if (page === "home") return (
    <div style={{maxWidth:480, margin:"0 auto", padding:"1.5rem 1rem"}}>
      <Toast toast={toast}/>
      <div style={{textAlign:"center", marginBottom:20}}><div style={{fontSize:38}}>🛒</div><div style={{fontSize:19, fontWeight:500, color:"#111"}}>Audit Superviseur</div><div style={{fontSize:12, color:"#6b7280"}}>Prosuma — 2026</div></div>
      {urgentCount>0 && (<div onClick={() => setPage("actions")} style={{display:"flex", alignItems:"center", gap:10, background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:10, padding:"10px 14px", marginBottom:14, cursor:"pointer"}}><span style={{fontSize:22}}>🚨</span><div style={{flex:1}}><div style={{fontSize:13, fontWeight:500, color:"#dc2626"}}>{urgentCount} action{urgentCount>1?"s":""} urgente{urgentCount>1?"s":""}</div><div style={{fontSize:12, color:"#b91c1c"}}>Deadline immédiate ou dans moins de 3 jours</div></div><span style={{color:"#dc2626", fontSize:16}}>›</span></div>)}
      <div style={{display:"flex", flexDirection:"column", gap:10, marginBottom:16}}>
        <button onClick={startNewAudit} style={{padding:"14px 16px", borderRadius:10, border:"none", background:"#ED7D31", color:"#fff", fontSize:15, fontWeight:500, cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:10}}><span style={{fontSize:22}}>➕</span><span>Nouvel audit</span></button>
        {drafts.length>0 && (<div style={{border:"1.5px solid #ED7D31", borderRadius:10, overflow:"hidden"}}><div style={{background:"#fff7ed", padding:"8px 14px", display:"flex", alignItems:"center", gap:8}}><span style={{fontSize:16}}>📝</span><div style={{fontSize:13, fontWeight:500, color:"#9a3412"}}>Brouillons en cours ({drafts.length})</div></div>{drafts.map(d => (<div key={d.id} style={{display:"flex", alignItems:"center", gap:8, padding:"9px 12px", borderTop:"0.5px solid #fed7aa", background:"#fff"}}><div style={{flex:1, minWidth:0}}><div style={{fontSize:13, fontWeight:500, color:"#111", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{(d.header&&d.header.magasin)||"Magasin non défini"}</div><div style={{fontSize:11, color:"#6b7280"}}>{(d.header&&d.header.date)||""} — {(d.header&&d.header.superviseur)||"?"}</div></div><button onClick={() => loadDraft(d)} style={{fontSize:12, padding:"5px 10px", borderRadius:8, border:"none", background:"#ED7D31", color:"#fff", cursor:"pointer"}}>Reprendre</button><button onClick={() => discardDraft(d.id)} style={{fontSize:12, padding:"5px 8px", borderRadius:8, border:"0.5px solid #fca5a5", background:"none", color:"#dc2626", cursor:"pointer"}}>✕</button></div>))}</div>)}
        <button onClick={() => setPage("actions")} style={{padding:"14px 16px", borderRadius:10, border:"0.5px solid #e5e7eb", background:"#f9fafb", fontSize:14, cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:10, color:"#111"}}><span style={{fontSize:22}}>🔧</span><span style={{flex:1}}>Actions correctives</span>{allActions.length>0 && <Badge bg={urgentCount>0?"#fee2e2":"#fef3c7"} color={urgentCount>0?"#dc2626":"#d97706"}>{allActions.length} en cours</Badge>}</button>
        <button onClick={() => { setDbPage("list"); setViewAudit(null); setPage("history"); }} style={{padding:"14px 16px", borderRadius:10, border:"0.5px solid #e5e7eb", background:"#f9fafb", fontSize:14, cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:10, color:"#111"}}><span style={{fontSize:22}}>📋</span><span style={{flex:1}}>Historique</span><span style={{fontSize:12, color:"#6b7280"}}>{audits.length} audit{audits.length>1?"s":""}</span></button>
        <button onClick={() => { setDbPage("db"); setPage("history"); }} style={{padding:"14px 16px", borderRadius:10, border:"0.5px solid #ED7D31", background:"none", fontSize:14, cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:10, color:"#ED7D31"}}><span style={{fontSize:22}}>📊</span><span style={{flex:1}}>Base de données consolidée</span></button>
      </div>
      {audits.slice(0,4).map(a => (
        <div key={a.id} onClick={() => { setViewAudit(a); setDbPage("detail"); setPage("history"); }} style={{display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, border:"0.5px solid #e5e7eb", background:"#fff", marginBottom:6, cursor:"pointer"}}>
          <ScoreCircle score={a.score||0}/>
          <div style={{flex:1, minWidth:0}}><div style={{fontSize:13, fontWeight:500, color:"#111", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{a.magasin}</div><div style={{fontSize:12, color:"#6b7280"}}>{a.date} — {a.superviseur}</div></div>
          <div style={{display:"flex", gap:4}}>{(a.counts&&a.counts.NS&&a.counts.NS>0)?<Badge bg="#fee2e2" color="#dc2626">{a.counts.NS} NS</Badge>:null}{(a.counts&&a.counts.M&&a.counts.M>0)?<Badge bg="#fef3c7" color="#d97706">{a.counts.M} M</Badge>:null}</div>
          <span style={{color:"#6b7280", fontSize:16}}>›</span>
        </div>
      ))}
    </div>
  );

  // ── AUDIT HEADER ───────────────────────────────────────────────────────
  if (page === "audit" && !headerDone) return (
    <div style={{maxWidth:480, margin:"0 auto", padding:"1.5rem 1rem"}}>
      <Toast toast={toast}/>
      <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:16}}><button onClick={() => setPage("home")} style={{background:"none", border:"none", cursor:"pointer", fontSize:18, padding:0, color:"#6b7280"}}>←</button><div style={{fontSize:17, fontWeight:500, color:"#111"}}>Nouvelle visite</div></div>
      <div style={{background:"#f9fafb", borderRadius:12, padding:"1rem", marginBottom:16}}>
        {[{l:"Date", k:"date", t:"date"}, {l:"Heure", k:"heure", t:"time"}, {l:"Superviseur", k:"superviseur", t:"text", p:"Nom du superviseur"}, {l:"Responsable magasin", k:"responsable", t:"text", p:"Nom du gérant"}].map(f => (
          <div key={f.k} style={{marginBottom:12}}><label style={{fontSize:12, color:"#6b7280", display:"block", marginBottom:3}}>{f.l}</label><input type={f.t} value={header[f.k]||""} placeholder={f.p||""} onChange={e => setHeader(h => ({...h, [f.k]:e.target.value}))} style={{width:"100%", boxSizing:"border-box"}}/></div>
        ))}
        <div style={{marginBottom:12}}><label style={{fontSize:12, color:"#6b7280", display:"block", marginBottom:3}}>Magasin</label><input type="text" value={header.magasin||""} placeholder="Nom du magasin" list="mag-list" onChange={e => setHeader(h => ({...h, magasin:e.target.value}))} style={{width:"100%", boxSizing:"border-box"}}/><datalist id="mag-list">{magasins.map(m => <option key={m} value={m}/>)}</datalist></div>
        <div><label style={{fontSize:12, color:"#6b7280", display:"block", marginBottom:6}}>Mode d'audit</label><div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>{[{v:"zone", icon:"🗺️", l:"Par zone", d:"Zone par zone"}, {v:"cat", icon:"🏷️", l:"Par catégorie", d:"Hygiène, Sécurité…"}].map(m => (<button key={m.v} onClick={() => setAuditMode(m.v)} style={{padding:"10px 8px", borderRadius:8, border:"1.5px solid "+(auditMode===m.v?"#ED7D31":"#e5e7eb"), background:auditMode===m.v?"#fff7ed":"transparent", color:auditMode===m.v?"#ED7D31":"#6b7280", cursor:"pointer", textAlign:"center"}}><div style={{fontSize:18}}>{m.icon}</div><div style={{fontSize:12, fontWeight:auditMode===m.v?500:400}}>{m.l}</div><div style={{fontSize:10, opacity:.8}}>{m.d}</div></button>))}</div></div>
      </div>
      {(!header.superviseur||!header.responsable||!header.magasin) && <div style={{fontSize:12, color:"#d97706", textAlign:"center", marginBottom:8, padding:"8px", background:"#fff7ed", borderRadius:6}}>{!header.magasin?"Champ manquant : Magasin":!header.superviseur?"Champ manquant : Superviseur":"Champ manquant : Responsable magasin"}</div>}
      <button onClick={() => setHeaderDone(true)} disabled={!header.superviseur||!header.responsable||!header.magasin} style={{width:"100%", padding:"12px", fontSize:15, fontWeight:500, background:"#ED7D31", border:"none", borderRadius:8, color:"#fff", cursor:"pointer", opacity:(!header.superviseur||!header.responsable||!header.magasin)?0.45:1}}>Démarrer l'audit →</button>
    </div>
  );

  // ── AUDIT ITEMS ────────────────────────────────────────────────────────
  if (page === "audit" && headerDone) {
    const catItems = selectedCat ? ZONES_LIVE.flatMap(z => z.items.filter(i => i.cat===selectedCat).map(i => ({...i, zonelabel:z.label, zoneicon:z.icon, zoneid:z.id}))) : [];
    return (
      <div style={{maxWidth:560, margin:"0 auto", padding:"1rem"}}>
        <Toast toast={toast}/>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8}}>
          <div style={{display:"flex", alignItems:"center", gap:8}}><button onClick={() => setPage("home")} style={{background:"none", border:"none", cursor:"pointer", fontSize:16, padding:0, color:"#6b7280"}}>←</button><div><div style={{fontSize:13, fontWeight:500, color:"#111"}}>{header.magasin}</div><div style={{fontSize:11, color:"#6b7280"}}>{header.superviseur} — {header.date}</div></div></div>
          <div style={{display:"flex", alignItems:"center", gap:6}}><span style={{fontSize:12, color:"#6b7280"}}>{pct}%</span><button onClick={saveDraftManual} style={{fontSize:12, padding:"5px 10px", borderRadius:20, border:"1px solid #ED7D31", background:"none", color:"#ED7D31", cursor:"pointer"}}>Sauv.</button><button onClick={saveAudit} style={{fontSize:12, padding:"5px 12px", borderRadius:20, border:"none", background:"#ED7D31", color:"#fff", cursor:"pointer", fontWeight:500}}>Terminer</button></div>
        </div>
        <div style={{height:4, background:"#f3f4f6", borderRadius:2, marginBottom:10, overflow:"hidden"}}><div style={{height:"100%", width:pct+"%", background:"#ED7D31", transition:"width .3s"}}/></div>
        <div style={{display:"flex", gap:6, marginBottom:10}}>
          <button onClick={() => { setAuditMode("zone"); setSelectedCat(null); }} style={{flex:1, padding:"7px", borderRadius:8, border:"1.5px solid "+(auditMode==="zone"?"#ED7D31":"#e5e7eb"), background:auditMode==="zone"?"#ED7D31":"transparent", color:auditMode==="zone"?"#fff":"#6b7280", cursor:"pointer", fontSize:12, fontWeight:auditMode==="zone"?500:400}}>🗺️ Par zone</button>
          <button onClick={() => { setAuditMode("cat"); if (!selectedCat) setSelectedCat(ALL_CATS[0]); }} style={{flex:1, padding:"7px", borderRadius:8, border:"1.5px solid "+(auditMode==="cat"?"#ED7D31":"#e5e7eb"), background:auditMode==="cat"?"#ED7D31":"transparent", color:auditMode==="cat"?"#fff":"#6b7280", cursor:"pointer", fontSize:12, fontWeight:auditMode==="cat"?500:400}}>🏷️ Par catégorie</button>
        </div>

        {auditMode === "zone" && (<>
          <div style={{display:"flex", gap:5, overflowX:"auto", paddingBottom:6, marginBottom:10, WebkitOverflowScrolling:"touch"}}>
            {ZONES_LIVE.map((z,i) => {
              const done = z.items.filter(it => results[it.id] && results[it.id].statut).length;
              const hasNS = z.items.some(it => results[it.id] && results[it.id].statut === "NS");
              const allDone = done === z.items.length && done > 0 && z.items.length > 0;
              return (<button key={z.id} onClick={() => setZoneIdx(i)} style={{flexShrink:0, padding:"5px 10px", borderRadius:20, fontSize:12, fontWeight:zoneIdx===i?500:400, border:"1.5px solid "+(zoneIdx===i?"#ED7D31":"#e5e7eb"), background:zoneIdx===i?"#ED7D31":"#fff", color:zoneIdx===i?"#fff":hasNS?"#dc2626":allDone?"#16a34a":"#6b7280", cursor:"pointer"}}>{z.icon} {z.label.split(" ")[0]}{done>0 && <span style={{marginLeft:3, fontSize:10, opacity:.8}}>{done}/{z.items.length}</span>}</button>);
            })}
          </div>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8}}><div style={{fontSize:15, fontWeight:500, color:"#111"}}>{zone.icon} {zone.label}</div><span style={{fontSize:12, color:"#6b7280"}}>{zone.items.filter(i => results[i.id] && results[i.id].statut).length}/{zone.items.length}</span></div>
          {zone.items.map(item => renderItem(item, false, (customItems[zone.id]||[]).some(c => c.id === item.id)))}

          <div style={{marginTop:8}}>
            {showAddItemZone !== zone.id ? (
              <button onClick={() => { setShowAddItemZone(zone.id); setNewItemLabel(""); setNewItemCat(zone.items[0]?.cat||"Hygiène & qualité"); }}
                style={{width:"100%", padding:"9px", borderRadius:8, border:"1.5px dashed #ED7D31", background:"none", color:"#ED7D31", cursor:"pointer", fontSize:12, fontWeight:500}}>
                ✏️ Ajouter un item dans cette zone
              </button>
            ) : (
              <div style={{background:"#f9fafb", borderRadius:10, padding:"12px", border:"1px solid #ED7D31"}}>
                <div style={{fontSize:13, fontWeight:500, color:"#111", marginBottom:10}}>Nouvel item — {zone.label}</div>
                <div style={{marginBottom:8}}>
                  <label style={{fontSize:12, color:"#6b7280", display:"block", marginBottom:3}}>Catégorie</label>
                  <select value={newItemCat} onChange={e => setNewItemCat(e.target.value)} style={{width:"100%", boxSizing:"border-box"}}>
                    {["Hygiène & qualité","Effectif & personnel","Sécurité","Outils & matériels","Produit","Autre"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:10}}>
                  <label style={{fontSize:12, color:"#6b7280", display:"block", marginBottom:3}}>Description</label>
                  <input type="text" value={newItemLabel} onChange={e => setNewItemLabel(e.target.value)}
                    placeholder="Ex: Vérification du registre de sécurité"
                    onKeyDown={e => e.key==="Enter" && addCustomItem(zone.id)}
                    style={{width:"100%", boxSizing:"border-box"}}/>
                </div>
                <div style={{display:"flex", gap:8}}>
                  <button onClick={() => addCustomItem(zone.id)} disabled={!newItemLabel.trim()} style={{flex:2, padding:"9px", borderRadius:8, border:"none", background:"#ED7D31", color:"#fff", cursor:"pointer", fontWeight:500, opacity:!newItemLabel.trim()?0.5:1}}>Ajouter</button>
                  <button onClick={() => { setShowAddItemZone(null); setNewItemLabel(""); }} style={{flex:1, padding:"9px", borderRadius:8, border:"0.5px solid #e5e7eb", background:"none", color:"#6b7280", cursor:"pointer"}}>Annuler</button>
                </div>
              </div>
            )}
          </div>
          <div style={{display:"flex", gap:8, marginTop:10}}>
            <button disabled={zoneIdx===0} onClick={() => setZoneIdx(i => Math.max(0,i-1))} style={{flex:1, padding:"10px", borderRadius:8, border:"0.5px solid #e5e7eb", background:"none", cursor:zoneIdx===0?"not-allowed":"pointer", color:"#6b7280", opacity:zoneIdx===0?0.4:1}}>Précédent</button>
            {zoneIdx < ZONES_LIVE.length-1 ? <button onClick={() => setZoneIdx(i => i+1)} style={{flex:2, padding:"10px", borderRadius:8, border:"none", background:"#ED7D31", color:"#fff", cursor:"pointer", fontWeight:500}}>Zone suivante →</button> : <button onClick={saveAudit} style={{flex:2, padding:"10px", borderRadius:8, border:"none", background:"#16a34a", color:"#fff", cursor:"pointer", fontWeight:500}}>Terminer et sauvegarder</button>}
          </div>
        </>)}

        {auditMode === "cat" && (<>
          <div style={{display:"flex", gap:5, overflowX:"auto", paddingBottom:6, marginBottom:10, WebkitOverflowScrolling:"touch"}}>
            {ALL_CATS.map(cat => {
              const items = ZONES_LIVE.flatMap(z => z.items.filter(i => i.cat === cat));
              const done = items.filter(i => results[i.id] && results[i.id].statut).length;
              const hasNS = items.some(i => results[i.id] && results[i.id].statut === "NS");
              const allDone = done === items.length && done > 0 && items.length > 0;
              return (<button key={cat} onClick={() => setSelectedCat(cat)} style={{flexShrink:0, padding:"5px 10px", borderRadius:20, fontSize:12, fontWeight:selectedCat===cat?500:400, border:"1.5px solid "+(selectedCat===cat?"#ED7D31":"#e5e7eb"), background:selectedCat===cat?"#ED7D31":"#fff", color:selectedCat===cat?"#fff":hasNS?"#dc2626":allDone?"#16a34a":"#6b7280", cursor:"pointer"}}>{CAT_ICONS[cat]||"📋"} {cat.split(" ")[0]}{done>0 && <span style={{marginLeft:3, fontSize:10, opacity:.8}}>{done}/{items.length}</span>}</button>);
            })}
          </div>
          {selectedCat && (() => {
            const zonesByCat = ZONES_LIVE.filter(z => z.items.some(i => i.cat === selectedCat));
            return (<>
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8}}>
                <div style={{fontSize:15, fontWeight:500, color:"#111"}}>{CAT_ICONS[selectedCat]||"📋"} {selectedCat}</div>
                <span style={{fontSize:12, color:"#6b7280"}}>{catItems.filter(i => results[i.id] && results[i.id].statut).length}/{catItems.length}</span>
              </div>
              {catItems.map(item => renderItem(item, true, (customItems[item.zoneid]||[]).some(c => c.id === item.id)))}
              {zonesByCat.map(z => (
                <div key={z.id} style={{marginTop:8}}>
                  {showAddItemZone !== ("cat_"+z.id) ? (
                    <button onClick={() => { setShowAddItemZone("cat_"+z.id); setNewItemLabel(""); setNewItemCat(selectedCat); }}
                      style={{width:"100%", padding:"8px", borderRadius:8, border:"1.5px dashed #ED7D31", background:"none", color:"#ED7D31", cursor:"pointer", fontSize:11, fontWeight:500}}>
                      ✏️ Ajouter dans {z.label} / {selectedCat}
                    </button>
                  ) : (
                    <div style={{background:"#f9fafb", borderRadius:10, padding:"12px", border:"1px solid #ED7D31"}}>
                      <div style={{fontSize:13, fontWeight:500, color:"#111", marginBottom:10}}>Nouvel item — {z.label} / {selectedCat}</div>
                      <div style={{marginBottom:10}}>
                        <label style={{fontSize:12, color:"#6b7280", display:"block", marginBottom:3}}>Description</label>
                        <input type="text" value={newItemLabel} onChange={e => setNewItemLabel(e.target.value)}
                          placeholder="Ex: Vérification du registre"
                          onKeyDown={e => e.key==="Enter" && addCustomItem(z.id)}
                          style={{width:"100%", boxSizing:"border-box"}}/>
                      </div>
                      <div style={{display:"flex", gap:8}}>
                        <button onClick={() => addCustomItem(z.id)} disabled={!newItemLabel.trim()} style={{flex:2, padding:"9px", borderRadius:8, border:"none", background:"#ED7D31", color:"#fff", cursor:"pointer", fontWeight:500, opacity:!newItemLabel.trim()?0.5:1}}>Ajouter</button>
                        <button onClick={() => { setShowAddItemZone(null); setNewItemLabel(""); }} style={{flex:1, padding:"9px", borderRadius:8, border:"0.5px solid #e5e7eb", background:"none", color:"#6b7280", cursor:"pointer"}}>Annuler</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>);
          })()}
          <div style={{marginTop:12}}><button onClick={saveAudit} style={{width:"100%", padding:"10px", borderRadius:8, border:"none", background:"#16a34a", color:"#fff", cursor:"pointer", fontWeight:500}}>Terminer et sauvegarder</button></div>
        </>)}
      </div>
    );
  }

  // ── SUMMARY ────────────────────────────────────────────────────────────
  if (page === "summary") {
    const a = audits[0]; const sc = a ? scoreOf(a.results) : 0; const c = (a&&a.counts)||{};
    return (<div style={{maxWidth:480, margin:"0 auto", padding:"2rem 1rem"}}>
      <Toast toast={toast}/>
      <div style={{textAlign:"center", marginBottom:20}}><div style={{fontSize:52, fontWeight:500, color:scoreColor(sc), lineHeight:1}}>{sc}%</div><div style={{fontSize:14, color:"#6b7280", marginTop:4}}>Score de conformité</div><div style={{fontSize:12, color:"#16a34a", marginTop:2}}>Audit sauvegardé</div></div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:20}}>{STATUTS.map(s => <div key={s.val} style={{background:s.bg, borderRadius:8, padding:"10px 4px", textAlign:"center"}}><div style={{fontSize:18}}>{s.short}</div><div style={{fontSize:22, fontWeight:500, color:s.color}}>{c[s.val]||0}</div><div style={{fontSize:10, color:s.color}}>{s.label}</div></div>)}</div>
      <div style={{display:"flex", flexDirection:"column", gap:8}}>
        <button onClick={() => a && setReportAudit(a)} style={{padding:"11px", borderRadius:8, border:"none", background:"#ED7D31", color:"#fff", fontWeight:500, cursor:"pointer", fontSize:14}}>📄 Voir le rapport complet</button>
        <button onClick={() => a && downloadCSV(toCSVSingle(a), "Audit_"+(a.magasin||"").replace(/\s+/g,"_")+"_"+a.date+".csv")} style={{padding:"11px", borderRadius:8, border:"0.5px solid #ED7D31", background:"none", color:"#ED7D31", fontWeight:500, cursor:"pointer", fontSize:14}}>📊 Télécharger CSV</button>
        <button onClick={() => setPage("actions")} style={{padding:"11px", borderRadius:8, border:"0.5px solid #e5e7eb", background:"#f9fafb", color:"#111", cursor:"pointer", fontSize:14}}>🔧 Actions correctives</button>
        <button onClick={() => setPage("home")} style={{padding:"11px", borderRadius:8, border:"none", background:"none", color:"#6b7280", cursor:"pointer", fontSize:13}}>← Retour</button>
      </div>
    </div>);
  }

  // ── HISTORY ────────────────────────────────────────────────────────────
  if (page === "history") {
    if (dbPage === "db") {
      const listeFiltre = filterMag === "tous" ? audits : audits.filter(a => a.magasin === filterMag);
      return (<div style={{maxWidth:640, margin:"0 auto", padding:"1.5rem 1rem"}}>
        <Toast toast={toast}/>
        <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:14}}><button onClick={() => setPage("home")} style={{background:"none", border:"none", cursor:"pointer", fontSize:18, padding:0, color:"#6b7280"}}>←</button><div style={{fontSize:17, fontWeight:500, color:"#111"}}>Base de données consolidée</div></div>
        <div style={{display:"flex", gap:6, overflowX:"auto", paddingBottom:6, marginBottom:14, WebkitOverflowScrolling:"touch"}}>{["tous", ...magasinsInDB].map(m => (<button key={m} onClick={() => setFilterMag(m)} style={{flexShrink:0, padding:"5px 12px", borderRadius:20, fontSize:12, border:"1.5px solid "+(filterMag===m?"#ED7D31":"#e5e7eb"), background:filterMag===m?"#ED7D31":"#fff", color:filterMag===m?"#fff":"#6b7280", cursor:"pointer", fontWeight:filterMag===m?500:400}}>{m==="tous"?"Tous":m}</button>))}</div>
        {listeFiltre.length>0 && (() => { const scores=listeFiltre.map(a => scoreOf(a.results)); const avg=Math.round(scores.reduce((a,b) => a+b,0)/scores.length); return (<div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14}}>{[{l:"Score moyen", v:avg+"%", c:scoreColor(avg)}, {l:"Meilleur", v:Math.max(...scores)+"%", c:scoreColor(Math.max(...scores))}, {l:"Plus bas", v:Math.min(...scores)+"%", c:scoreColor(Math.min(...scores))}].map(s => (<div key={s.l} style={{background:"#f9fafb", borderRadius:8, padding:"10px 8px", textAlign:"center"}}><div style={{fontSize:20, fontWeight:500, color:s.c}}>{s.v}</div><div style={{fontSize:11, color:"#6b7280"}}>{s.l}</div></div>))}</div>); })()}
        {listeFiltre.length===0 ? <div style={{textAlign:"center", padding:"2rem", color:"#6b7280"}}>Aucun audit pour ce magasin</div> : (<div style={{overflowX:"auto", marginBottom:14}}><table style={{width:"100%", borderCollapse:"collapse", fontSize:12}}><thead><tr style={{background:"#ED7D31", color:"#fff"}}>{["Magasin","Date","Superviseur","Score","S","M","NS","NA"].map(h => <th key={h} style={{padding:"8px 10px", textAlign:"left", whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead><tbody>{listeFiltre.map((a,i) => { const sc=scoreOf(a.results); const c=a.counts||{}; return (<tr key={a.id} onClick={() => { setViewAudit(a); setDbPage("detail"); }} style={{background:i%2===0?"#fff":"#f9fafb", cursor:"pointer"}}><td style={{padding:"7px 10px", maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{a.magasin}</td><td style={{padding:"7px 10px", whiteSpace:"nowrap"}}>{a.date}</td><td style={{padding:"7px 10px", whiteSpace:"nowrap"}}>{a.superviseur}</td><td style={{padding:"7px 10px", fontWeight:500, color:scoreColor(sc)}}>{sc}%</td><td style={{padding:"7px 10px", color:"#16a34a"}}>{c.S||0}</td><td style={{padding:"7px 10px", color:"#d97706"}}>{c.M||0}</td><td style={{padding:"7px 10px", color:"#dc2626"}}>{c.NS||0}</td><td style={{padding:"7px 10px", color:"#6b7280"}}>{c.NA||0}</td></tr>); })}</tbody></table></div>)}
        <div style={{display:"flex", gap:8, flexWrap:"wrap", marginBottom:10}}>
          <button onClick={() => downloadCSV(toCSVConsolide(audits,null), "Synthese_Prosuma_"+today()+".csv")} style={{flex:1, minWidth:140, padding:"10px", borderRadius:8, border:"none", background:"#ED7D31", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:500}}>Synthèse tous</button>
          <button onClick={() => downloadCSV(toCSVDetail(audits,null), "Detail_Prosuma_"+today()+".csv")} style={{flex:1, minWidth:140, padding:"10px", borderRadius:8, border:"0.5px solid #ED7D31", background:"none", color:"#ED7D31", cursor:"pointer", fontSize:13, fontWeight:500}}>Détail tous</button>
          {filterMag !== "tous" && <><button onClick={() => downloadCSV(toCSVConsolide(audits,filterMag), "Synthese_"+filterMag.replace(/\s+/g,"_")+"_"+today()+".csv")} style={{flex:1, minWidth:140, padding:"10px", borderRadius:8, border:"none", background:"#ED7D31", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:500}}>Synthèse {filterMag}</button><button onClick={() => downloadCSV(toCSVDetail(audits,filterMag), "Detail_"+filterMag.replace(/\s+/g,"_")+"_"+today()+".csv")} style={{flex:1, minWidth:140, padding:"10px", borderRadius:8, border:"0.5px solid #ED7D31", background:"none", color:"#ED7D31", cursor:"pointer", fontSize:13, fontWeight:500}}>Détail {filterMag}</button></>}
        </div>
        <div style={{padding:"10px 14px", background:"#f9fafb", borderRadius:8, fontSize:12, color:"#6b7280"}}><strong style={{color:"#111"}}>Excel :</strong> Fichier → Ouvrir → .csv → UTF-8 → séparateur virgule.</div>
      </div>);
    }
    if (dbPage === "detail" && viewAudit) {
      const sc = scoreOf(viewAudit.results); const c = viewAudit.counts||{};
      const vz = ZONES.map(z => ({...z, items: [...(z.items||[]), ...((viewAudit.customItems||{})[z.id]||[])]}));
      const issues = [];
      vz.forEach(z => z.items.forEach(item => { const r=(viewAudit.results||{})[item.id]||{}; if (r.statut&&r.statut!=="S"&&r.statut!=="NA") issues.push({zone:z.label, icon:z.icon, item:item.label, r}); }));
      return (<div style={{maxWidth:540, margin:"0 auto", padding:"1.5rem 1rem"}}>
        <Toast toast={toast}/>
        <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:14}}><button onClick={() => setDbPage("list")} style={{background:"none", border:"none", cursor:"pointer", fontSize:18, padding:0, color:"#6b7280"}}>←</button><div style={{fontSize:17, fontWeight:500, color:"#111"}}>Détail de l'audit</div></div>
        <div style={{background:"#f9fafb", borderRadius:10, padding:"12px 14px", marginBottom:14}}><div style={{display:"flex", alignItems:"center", gap:12}}><ScoreCircle score={sc} size={48}/><div><div style={{fontSize:14, fontWeight:500, color:"#111"}}>{viewAudit.magasin}</div><div style={{fontSize:12, color:"#6b7280"}}>{viewAudit.date} {viewAudit.heure||""} — {viewAudit.superviseur}</div><div style={{fontSize:12, color:"#6b7280"}}>Gérant : {viewAudit.responsable}</div></div></div></div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:14}}>{STATUTS.map(s => <div key={s.val} style={{background:s.bg, borderRadius:8, padding:"8px 4px", textAlign:"center"}}><div style={{fontSize:15}}>{s.short}</div><div style={{fontSize:18, fontWeight:500, color:s.color}}>{c[s.val]||0}</div><div style={{fontSize:10, color:s.color}}>{s.label}</div></div>)}</div>
        {issues.length>0 && (<><div style={{fontSize:14, fontWeight:500, marginBottom:8, color:"#111"}}>Points non conformes ({issues.length})</div>{issues.map((iss,i) => { const st2=STATUTS.find(s => s.val===iss.r.statut); const dl=getDeadlineBadge(iss.r); const resolved=iss.r.resolved; return (<div key={i} style={{border:"0.5px solid #e5e7eb", borderRadius:8, padding:"10px 12px", marginBottom:6, background:resolved?"#f0fdf4":"#fff"}}><div style={{display:"flex", gap:6, flexWrap:"wrap", alignItems:"center", marginBottom:4}}>{st2&&<Badge bg={st2.bg} color={st2.color}>{st2.label}</Badge>}{resolved&&<Badge bg="#dcfce7" color="#16a34a">Résolue</Badge>}{dl&&<Badge bg={dl.bg} color={dl.color}>{dl.text}</Badge>}</div><div style={{fontSize:12, color:"#6b7280", marginBottom:2}}>{iss.icon} {iss.zone}</div><div style={{fontSize:13, color:"#111"}}>{iss.item}</div>{iss.r.action&&<div style={{fontSize:12, color:"#d97706", marginTop:4}}>Action : {iss.r.action}</div>}</div>);})}</>)}
        <div style={{display:"flex", gap:8, marginTop:14}}>
          <button onClick={() => setReportAudit(viewAudit)} style={{flex:1, padding:"10px", borderRadius:8, border:"none", background:"#ED7D31", color:"#fff", fontWeight:500, cursor:"pointer", fontSize:13}}>📄 Rapport</button>
          <button onClick={() => downloadCSV(toCSVSingle(viewAudit), "Audit_"+(viewAudit.magasin||"").replace(/\s+/g,"_")+"_"+viewAudit.date+".csv")} style={{flex:1, padding:"10px", borderRadius:8, border:"0.5px solid #ED7D31", background:"none", color:"#ED7D31", cursor:"pointer", fontSize:13}}>📊 CSV</button>
          <button onClick={() => deleteAudit(viewAudit.id)} style={{padding:"10px 14px", borderRadius:8, border:"0.5px solid #fca5a5", background:"none", color:"#dc2626", cursor:"pointer", fontSize:13}}>🗑️</button>
        </div>
      </div>);
    }
    return (<div style={{maxWidth:480, margin:"0 auto", padding:"1.5rem 1rem"}}>
      <Toast toast={toast}/>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14}}><div style={{display:"flex", alignItems:"center", gap:10}}><button onClick={() => setPage("home")} style={{background:"none", border:"none", cursor:"pointer", fontSize:18, padding:0, color:"#6b7280"}}>←</button><div style={{fontSize:17, fontWeight:500, color:"#111"}}>Historique</div></div><div style={{display:"flex", gap:8, alignItems:"center"}}><span style={{fontSize:12, color:"#6b7280"}}>{audits.length} audit{audits.length>1?"s":""}</span>{audits.length>0 && <button onClick={() => setDbPage("db")} style={{fontSize:12, padding:"5px 10px", borderRadius:8, border:"0.5px solid #ED7D31", background:"none", color:"#ED7D31", cursor:"pointer"}}>Base DB</button>}</div></div>
      {audits.length===0 && <div style={{textAlign:"center", padding:"3rem 1rem", color:"#6b7280"}}><div style={{fontSize:36, marginBottom:8}}>📋</div><div>Aucun audit enregistré</div></div>}
      {audits.map(a => (<div key={a.id} style={{display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:10, border:"0.5px solid #e5e7eb", background:"#fff", marginBottom:8}}>
        <div onClick={() => { setViewAudit(a); setDbPage("detail"); }} style={{display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0, cursor:"pointer"}}>
          <ScoreCircle score={scoreOf(a.results)}/>
          <div style={{flex:1, minWidth:0}}><div style={{fontSize:13, fontWeight:500, color:"#111", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{a.magasin}</div><div style={{fontSize:12, color:"#6b7280"}}>{a.date} — {a.superviseur}</div></div>
          <div style={{display:"flex", gap:4}}>{(a.counts&&a.counts.NS&&a.counts.NS>0)?<Badge bg="#fee2e2" color="#dc2626">{a.counts.NS} NS</Badge>:null}{(a.counts&&a.counts.M&&a.counts.M>0)?<Badge bg="#fef3c7" color="#d97706">{a.counts.M} M</Badge>:null}</div>
          <span style={{color:"#6b7280", fontSize:16}}>›</span>
        </div>
        <button onClick={() => deleteAudit(a.id)} style={{padding:"6px 10px", borderRadius:8, border:"0.5px solid #fca5a5", background:"none", color:"#dc2626", cursor:"pointer", fontSize:13, flexShrink:0}}>🗑️</button>
      </div>))}
    </div>);
  }

  // ── ACTIONS ────────────────────────────────────────────────────────────
  if (page === "actions") {
    const immediat = allActions.filter(a => a.deadlineType === "immediat");
    const overdue = allActions.filter(a => a.deadlineType === "date" && daysDiff(a.deadline) < 0);
    const urgent = allActions.filter(a => a.deadlineType === "date" && daysDiff(a.deadline) >= 0 && daysDiff(a.deadline) <= 3);
    const continu = allActions.filter(a => a.deadlineType === "continu");
    const upcoming = allActions.filter(a => a.deadlineType === "date" && daysDiff(a.deadline) > 3);
    const noDate = allActions.filter(a => !a.deadlineType);
    function ACard({act}) {
      const st = STATUTS.find(s => s.val === act.statut); const dl = getDeadlineBadge(act);
      return (<div style={{border:"0.5px solid "+(act.deadlineType==="immediat"||(dl&&dl.urgent)?"#fca5a5":act.deadlineType==="continu"?"#c4b5fd":"#e5e7eb"), borderRadius:10, padding:"10px 12px", marginBottom:8, background:"#fff"}}>
        <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8, marginBottom:4}}><div style={{flex:1, minWidth:0}}><div style={{fontSize:11, color:"#6b7280", marginBottom:2}}>{act.zoneIcon} {act.zone} · {act.cat}</div><div style={{fontSize:13, color:"#111", lineHeight:1.4}}>{act.item}</div></div>{st&&<Badge bg={st.bg} color={st.color}>{st.label}</Badge>}</div>
        <div style={{fontSize:11, color:"#6b7280", marginBottom:4}}>{act.magasin} — {act.auditDate}</div>
        {act.comment&&<div style={{fontSize:12, color:"#6b7280", marginBottom:2}}>{act.comment}</div>}
        {act.action&&<div style={{fontSize:12, color:"#d97706", marginBottom:6}}>Action : {act.action}</div>}
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:6, flexWrap:"wrap"}}>{dl&&<Badge bg={dl.bg} color={dl.color}>{dl.text}</Badge>}<button onClick={() => resolveAction(act.auditId, act.itemId)} style={{fontSize:12, padding:"5px 12px", borderRadius:8, border:"0.5px solid #16a34a", background:"none", color:"#16a34a", cursor:"pointer", whiteSpace:"nowrap", marginLeft:"auto"}}>Résolue</button></div>
      </div>);
    }
    function Sec({title, bg, color, items, icon}) { if (!items.length) return null; return (<div style={{marginBottom:16}}><div style={{display:"flex", alignItems:"center", gap:6, padding:"7px 12px", borderRadius:8, background:bg, marginBottom:8}}><span style={{fontSize:16}}>{icon}</span><span style={{fontSize:13, fontWeight:500, color}}>{title}</span><span style={{marginLeft:"auto", fontSize:12, fontWeight:500, color}}>{items.length}</span></div>{items.map((a,i) => <ACard key={i} act={a}/>)}</div>); }
    return (<div style={{maxWidth:560, margin:"0 auto", padding:"1.5rem 1rem"}}>
      <Toast toast={toast}/>
      <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:14}}><button onClick={() => setPage("home")} style={{background:"none", border:"none", cursor:"pointer", fontSize:18, padding:0, color:"#6b7280"}}>←</button><div style={{fontSize:17, fontWeight:500, color:"#111"}}>Actions correctives</div>{allActions.length>0&&<Badge bg="#fef3c7" color="#d97706">{allActions.length} en cours</Badge>}</div>
      {allActions.length===0 && <div style={{textAlign:"center", padding:"3rem 1rem"}}><div style={{fontSize:40, marginBottom:8}}>✅</div><div style={{fontSize:15, fontWeight:500, color:"#111"}}>Aucune action en cours</div></div>}
      <Sec title="Action immédiate" bg="#fee2e2" color="#dc2626" items={immediat} icon="🚨"/>
      <Sec title="Deadlines dépassées" bg="#fee2e2" color="#b91c1c" items={overdue} icon="⛔"/>
      <Sec title="Urgentes — dans 3 jours ou moins" bg="#fef3c7" color="#d97706" items={urgent} icon="⚠️"/>
      <Sec title="Surveillance en continu" bg="#ede9fe" color="#7c3aed" items={continu} icon="🔄"/>
      <Sec title="À venir — plus de 3 jours" bg="#f0fdf4" color="#16a34a" items={upcoming} icon="📅"/>
      <Sec title="Sans deadline" bg="#f9fafb" color="#6b7280" items={noDate} icon="⏳"/>
    </div>);
  }

  return null;
}
