# Migration Vercel — Léopards Radar

**Statut** : `vercel.json` pré-configuré. Migration prête, attend juste un clic.

## Pourquoi migrer

GitHub Pages ne sait pas faire de SPA rewrite côté serveur. Le hack
`public/404.html` actuel donne un beau redirect côté humain mais GH Pages
renvoie toujours HTTP 404 au serveur. Pour les bots et le link unfurling
Twitter / WhatsApp / Facebook, c'est mal géré.

Vercel a des SPA rewrites natifs (HTTP 200 sur tous les chemins),
preview deploys par PR, custom domain en 5 min, analytics intégrés,
edge functions disponibles si besoin.

Coût : **0 €** (Hobby tier — limite 100 GB bandwidth/mois, large pour le
trafic actuel).

## Ce qui est déjà prêt dans le repo

- `vercel.json` à la racine — rewrites SPA, cache headers fonts/assets,
  content-type sitemap/rss
- `package.json` `build` script déjà compatible Vercel (`vite build &&
  build-rss && build-sitemap`)
- `dist/` est bien le `outputDirectory`

## Étapes côté Alexandre (~10 min)

1. **Créer le compte Vercel** (gratuit, login GitHub) :
   <https://vercel.com/signup>

2. **Importer le repo** :
   - Dashboard Vercel → Add New… → Project
   - Sélectionner `angm-hub/leopardsradar`
   - Vercel détecte automatiquement Vite (le `vercel.json` confirme la config)
   - Click Deploy

3. **Variables d'environnement** :
   Dans Settings → Environment Variables, ajouter :
   - `VITE_SUPABASE_URL` = la valeur du `.env` local
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = la valeur du `.env` local

   Sans ça, `build-rss.mjs` et `build-sitemap.mjs` skipperont leur étape
   (warn non-fatal) et le site fonctionnera quand même.

4. **Re-déployer** une fois les env vars ajoutées :
   - Deployments → tip de main → ⋮ → Redeploy

5. **Vérifier** :
   - Le site live : `https://leopardsradar.vercel.app` (ou nom custom auto-généré)
   - Deep link : `https://leopardsradar.vercel.app/roster` doit renvoyer
     **HTTP 200** (et plus 404)
   - Sitemap : `https://leopardsradar.vercel.app/sitemap.xml`

## Étapes optionnelles (custom domain)

Si tu prends `leopardsradar.com` (12 €/an chez OVH ou Namecheap) :

1. Vercel → Settings → Domains → Add `leopardsradar.com`
2. Vercel donne 2 records DNS (A + CNAME) à configurer chez le registrar
3. Délai propagation 1-24h
4. SSL auto (Let's Encrypt) géré par Vercel
5. Mettre à jour les pages mentions légales / CGU / OG image URLs vers
   le nouveau domaine

## Conserver GitHub Pages en parallèle (optionnel)

Tant que le custom domain n'est pas en place, on peut garder GH Pages live
sur `angm-hub.github.io/leopardsradar` ET Vercel sur `leopardsradar.vercel.app`.
Les 2 sont régénérés à chaque push. Quand Vercel prend le relais comme URL
canonique, on peut désactiver GH Pages (Settings → Pages → Source = None).

## Rollback

Si Vercel pose problème, GH Pages reste fonctionnel — il suffit de :
- Désactiver Vercel ou supprimer le projet
- Repointer les communications sur `angm-hub.github.io/leopardsradar`
- Le repo n'a pas besoin de modification (le `vercel.json` n'affecte pas GH Pages)
