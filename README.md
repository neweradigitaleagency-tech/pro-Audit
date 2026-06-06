# Audit Prosuma

Application mobile-first d'audit de supervision pour les supermarchés **Prosuma**. Fonctionne entièrement hors-ligne (stockage `localStorage`), sans backend.

## Fonctionnalités

- **12 zones d'audit** prédéfinies (Bâtiment, Parking, Terrasse, Surface de vente, Ligne de caisse, Secteur Sec, Secteur Frais, Bureaux, Réception, Réserves & chambres froides, Sécurité générale, Items personnalisés)
- **Double mode de navigation** : par zone ou par catégorie (Hygiène, Sécurité, Personnel, etc.)
- **Évaluation** : Satisfaisant ✅ / Moyen ⚠️ / Non satisfaisant ❌ / N/A —
- **Commentaires, plans d'action, délais** (Immédiat, En continu, Date fixée)
- **Upload de photos** en base64
- **Items personnalisés** par zone
- **Auto-sauvegarde** toutes les 30 secondes
- **Brouillons** : reprendre ou supprimer
- **Score** calculé automatiquement
- **Rapport visuel** copiable vers Word/Google Docs
- **Corps d'email** généré automatiquement avec actions correctives
- **Export CSV** : audit individuel, synthèse consolidée, détail consolidé
- **Tableau de bord actions correctives** : classement par urgence (Immédiat, Dépassé, Urgent, Continu, À venir, Sans deadline)
- **Base de données consolidée** : historique, filtres par magasin, statistiques (moyen, meilleur, plus bas)

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer en développement
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173).

## Build production

```bash
npm run build
npm run preview
```

## Structure

```
audit-supermarche/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
├── src/
│   ├── main.tsx          # Point d'entrée
│   └── App.tsx           # Application complète
└── audit_supermarche 2026.tsx   # Référence originale Mandarine
```

## Personnalisation

### Magasins

Modifier `MAGASINS_DEFAUT` dans `src/App.tsx` (ligne ~55).

### Zones / critères d'audit

Modifier le tableau `ZONES` dans `src/App.tsx` (ligne ~4).

### Clés de stockage

`prosuma-audits`, `prosuma-drafts`, `prosuma-magasins` — visibles dans `localStorage` du navigateur (F12 → Application → Stockage local).

## Utilisation Next.js

Copier `src/App.tsx` dans `app/page.tsx` ou `pages/index.tsx` d'un projet Next.js.

## Technologie

- React 18 (fonctionnel, hooks)
- TypeScript
- Vite
- localStorage (pas de backend)
- Design mobile-first, responsive max-width 480-560px
- Pas de dépendances externes (React pur + stockage natif)
