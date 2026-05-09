# fkdev.xyz

Prezentační web pro František Kalášek / TopBot PwnZ™ postavený jako statická
React aplikace nad Vite.

## Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS
- wouter pro klientské routování
- framer-motion pro animace
- Three.js / React Three Fiber pro hero pozadí
- Vercel Analytics a Speed Insights

## Lokální vývoj

```bash
npm install
npm run dev
```

Vývojový server běží na `http://localhost:5173`.

## Kontroly a build

```bash
npm run typecheck
npm run build
```

Build vytváří statické soubory do `dist/`.

## Struktura

- `src/App.tsx` - globální layout, routy a Vercel měření
- `src/pages/` - stránky webu
- `src/components/` - UI, layout, sekce, SEO a 3D komponenty
- `src/data/` - centralizovaná business data a seznam služeb
- `src/utils/` - SEO helpers, JSON-LD a utility
- `public/` - favicony, manifest, sitemap, robots a OG obrázek
- `vercel.json` - Vercel rewrite pro klientské routy Vite aplikace

## Deployment

Produkční doména: `https://fkdev.xyz`

Projekt používá npm jako package manager. Zdroj pravdy pro dependency strom je
`package-lock.json`.

### DNS

Doména je spravovaná mimo repozitář. Pro Vercel deployment ověř DNS záznamy ve
Vercel dashboardu nebo přes `vercel domains inspect fkdev.xyz`.

Obecná Vercel konfigurace pro apex doménu je:

- `A` záznam pro `@` na `76.76.21.21`
- volitelně `CNAME` pro `www` na hodnotu doporučenou Vercel dashboardem

Pokud jsou DNS záznamy změněné u registrátora, propagace může trvat až 24 hodin.
