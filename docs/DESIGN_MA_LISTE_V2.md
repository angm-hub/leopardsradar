# DESIGN — Ma Liste v2

Sprint 1 du chantier refonte (cf. audit `Ma Liste — sévère`, session 2026-05-16).

Source de vérité pour la nouvelle DA de la feature **Ma Liste** (`/ma-liste`).
Tout composant qui sort de ce périmètre doit pointer ici. Tout désaccord
remonte à Alexandre.

---

## Thèse créative en une phrase

> Une page. Un terrain. Ton équipe. Posée en 60 secondes.

L'utilisateur ouvre, comprend immédiatement ce qu'on lui demande, joue avec
les joueurs comme avec des cartes Panini, et partage sans friction. Aucune
décision cognitive parasite. Aucun écran de transition. Aucun wizard.

---

## Position dans la matrice frontend-masters

**Famille primaire : Cinematic Dark** (cf. `frontend-masters` 9 familles canoniques).

Sous-influence : **Neo-editorial** (typo expressive + densité contrôlée) +
**Data-Dense Pro** (lisibilité chiffres + grille tactique).

**Anti-références explicites** (qu'on ne ressemble PAS à) :
- FUT 24 EA SPORTS (trop gamer, trop saturé)
- ESPN+ / Bleacher Report (trop SaaS sport US, trop hero-metric)
- Pickem / Sleeper apps (trop fantasy bro)
- Wikipedia (trop sec, sans personnalité éditoriale)
- Tinder / Bumble swipe (trop ludo-app)

**Références d'inspiration** (la lisibilité + la tribune + la noirceur cinéma) :
- The Athletic — Match Centre + Tactics Board
- Premier League digital programme PDF
- PSG Heritage zine (palette deep blue + or)
- Apple Music Now Playing screen (Liquid Glass, atmosphère)
- Linear Roadmap (densité minimaliste, motion calme)
- fbref player profile (compacité data)
- Off-White wiki (typo arsenal)

---

## Palette OKLCH

Étend la palette Cobalt v2 du site (Void / Cobalt / Bone / Star / Blood)
sans la trahir. Ajoute deux atmosphères spécifiques au builder.

### Couleurs racine (héritage v2 — ne pas casser)

| Token | OKLCH | Usage |
|---|---|---|
| `--void` | `oklch(0.08 0.005 252)` | Background principal builder |
| `--void-deeper` | `oklch(0.05 0.005 252)` | Background pitch (atmosphère stadium) |
| `--cobalt` | `oklch(0.46 0.16 252)` | Accent unique — capitaine, état actif, CTA primaire |
| `--cobalt-haze` | `oklch(0.46 0.16 252 / 0.12)` | Glow halo capitaine, hover slot |
| `--bone` | `oklch(0.94 0.012 84)` | Texte principal sur void |
| `--bone-mute` | `oklch(0.94 0.012 84 / 0.62)` | Texte secondaire, captions |
| `--star` | `oklch(0.78 0.14 86)` | Accent jaune drapeau RDC, étoile capitaine |
| `--blood` | `oklch(0.58 0.20 28)` | Rouge drapeau RDC, état destructif (remove) |

### Atmosphères dédiées Ma Liste v2

| Atmosphère | OKLCH | Quand |
|---|---|---|
| **Jade tribune** | `oklch(0.18 0.04 158)` | Halo subtil autour du pitch (rappel chlorophylle stade) |
| **Dawn** | `oklch(0.22 0.03 35)` | État "complete" — XI plein, transition vers share |
| **Torch** | `oklch(0.16 0.02 252)` | Sticky bottom CTA partager (cobalt assourdi) |

### Color strategy (cf. impeccable shared design laws)

**Restrained.** Tinted neutrals + un seul accent (cobalt) ≤ 10% surface.
Le jaune `--star` n'apparaît QUE sur l'étoile capitaine et le drapeau RDC.
Le rouge `--blood` n'apparaît QUE sur action destructive et bande drapeau.

**Interdits absolus** :
- `#000` pur (utiliser `--void`)
- `#fff` pur (utiliser `--bone`)
- Gradient text (`bg-clip-text text-transparent`)
- Glassmorphism par défaut (pas de `backdrop-blur` sauf cas justifié)
- Plus d'un accent saturé visible simultanément

---

## Typographie

### Stack final (décision Alexandre 2026-05-16 : zéro coût, full Google Fonts)

| Rôle | Famille | Poids | Source |
|---|---|---|---|
| **Display / titres principaux** | **Bricolage Grotesque** (variable) | 200-800 | Google Fonts gratuit, distinctive expérimentale brutaliste — jamais vu sur fantasy app |
| **Body / interface** | **Inter Tight** (variable) | 400, 500, 700 | Google Fonts gratuit — version compressée d'Inter, plus serrée, moins SaaS générique |
| **Mono / data** | **JetBrains Mono** | 400, 600 | Gratuit OFL — pour stats, IDs, codes formation |
| **Accent numéros maillot** | **Bricolage Grotesque** weight 800 | 800 | Réutilise display, donne signature sport via weight maxi |

**Justification anti-slop kAIra** (`feedback_typo-anti-claude` memory) :
- ❌ Fraunces (trop wedding/restaurant)
- ❌ Inter standard (trop SaaS — Inter Tight est différent, plus expressif)
- ❌ DM Sans (trop content marketing)
- ❌ Cormorant (trop magazine luxe wannabe)
- ❌ Space Mono / Söhne Mono (trop "agence design")
- ✅ Bricolage Grotesque = signature distinctive expérimentale, jamais vu sur fantasy/sport app, variable
- ✅ Inter Tight = version serrée d'Inter, lisible, plus rythmée
- ✅ JetBrains Mono = data légitime

**Trade-off acté** : on perd la signature éditoriale PP Editorial New mais on gagne 0€ de coût + distinctivité via Bricolage Grotesque qui reste rare en prod.

### Échelle (clamp fluide mobile-first)

| Token | Tailwind clamp | Usage |
|---|---|---|
| `text-d1` | `clamp(2.5rem, 6vw, 4.5rem)` | Titre page builder (1 seul par page) |
| `text-d2` | `clamp(1.75rem, 3.5vw, 2.5rem)` | Sous-titres section (formation, pioche) |
| `text-h3` | `clamp(1.125rem, 1.8vw, 1.375rem)` | Headers card joueur, libellés zones pitch |
| `text-body` | `1rem` (16px) | Body, copy général |
| `text-cap` | `0.75rem` (12px) | Captions, labels mono uppercase |
| `text-num` | `clamp(1.5rem, 2.4vw, 2rem)` | Numéro maillot sur joueur placé |

**Règles** :
- Line-height body : 1.55 (lecture confortable)
- Line-height titres display : 0.92 (italic = serré, signature)
- Tracking display italic : `-0.025em` (compact)
- Tracking caption uppercase : `0.08em` (lisible mais pas SaaS)
- **Plus jamais de `text-balance` Pretty** sur les titres > 2 lignes — ça produit du flou IA générique

---

## Spacing et rythme

Échelle 4px (grille kAIra standard). Utilise les rythmes 4/8/12/16/24/32/48/64/96.

### Densités spécifiques builder

- **Pitch** : aspect-ratio fixe `5/7` desktop, `4/5` mobile. Padding inner 4% du width.
- **Pioche (library)** : item joueur 56px height + 8px gap = densité haute volontaire (lister 20+ joueurs sans scroll obligatoire).
- **Bench strip** : hauteur 80px, 15 slots affichés en flex-wrap, gap 6px.
- **Sticky top bar** : 56px height.
- **Sticky bottom CTA** : 72px height (touch 44px + padding).
- **Toast undo** : floats top-right, 8px du bord, max-width 320px.

---

## Composition de la page (1 seul écran, scroll vertical minimal)

```
┌──────────────────────────────────────────────────────────────┐
│ STICKY TOP BAR (56px)                                        │
│  [logo Léopards]            [4-3-3] [4-2-3-1] [3-5-2]   [×] │
├──────────────────────────────────────────────────────────────┤
│  Ton sélectionneur intérieur.        (display d1 italic)     │
│  11 titulaires · 15 remplaçants · 1 capitaine  (cap mono)    │
│                                                              │
│  ┌──────────────────────────┐  ┌─────────────────────────┐  │
│  │       PITCH (5:7)        │  │   PIOCHE (sticky)       │  │
│  │                          │  │   [search ⌘K]           │  │
│  │       ╔══════════╗       │  │   ── Roster (28) ──     │  │
│  │       ║   +    + ║       │  │   ▢ Chancel Mbemba      │  │
│  │       ║+  +  +  +║       │  │   ▢ Yoane Wissa         │  │
│  │       ║  +  +  + ║       │  │   ▢ Cédric Bakambu      │  │
│  │       ║     +    ║       │  │   ...                   │  │
│  │       ╚══════════╝       │  │   ── Radar (45) ──      │  │
│  │   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │  │   ▢ ... (Léopards diaspora) │
│  │   ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢▢│  │                         │  │
│  │     bench 15             │  │                         │  │
│  └──────────────────────────┘  └─────────────────────────┘  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ STICKY BOTTOM CTA (72px)                                     │
│  [progress XI 7/11 ── 4 slots]            ► PARTAGER MA LISTE│
└──────────────────────────────────────────────────────────────┘
```

### Grille desktop
- Container max 1280px
- 12 colonnes : pitch occupe col 1-7 (58%), pioche col 8-12 (42%)
- Gap 32px entre les deux zones
- Marges horizontales 32px desktop, 16px mobile

### Mobile (≤ 640px)
- Stack vertical
- Pitch full width, aspect-ratio 4/5
- Pioche = **drawer bottom sheet** ouvrable via tap sur slot ou CTA "+ Ajouter au banc"
- Sticky top bar visible, sticky bottom CTA visible
- Bench strip horizontal scrollable sous le pitch

---

## Pitch — l'élément signature de la page

Le pitch n'est PAS le placeholder vert standard FUT/EA. C'est une
**interprétation éditoriale du terrain RDC**.

### Style visuel
- Fond `--void-deeper` `oklch(0.05 0.005 252)` (pas vert clair, pas wireframe)
- Halo radial subtil `--jade-tribune` au centre (rappel chlorophylle stade)
- Lignes terrain SVG : stroke `oklch(0.94 0.012 84 / 0.18)` width 1.5px (presque invisibles, juste suggérées)
- Surface de but rectangulaires en haut et bas, cercle central, ligne médiane
- **Drapeau RDC subliminal en bas** : 3 bandes verticales très atténuées (`star` jaune / `cobalt` bleu / `blood` rouge) opacité 8%, sur le tiers inférieur uniquement

### Slots joueur
- Vide : cercle `64px` diamètre, border `dashed 1.5px oklch(0.94 0.012 84 / 0.2)`, icône `+` plus 16px centré
- Hover : border solid `--cobalt`, halo `--cobalt-haze` blur 24px, scale 1.04
- Drag-over compatible : border solid `--cobalt`, fond `--cobalt-haze`, scale 1.06
- **Drag-over INCOMPATIBLE** : border solid `--blood`, opacité réduite, **shake animation 200ms** (vs "ignore silencieusement" actuel — fix friction)
- Joueur placé : photo cercle 64px + numéro maillot dessus (PP Sans Rounded), étoile capitaine `--star` 24px en haut-droite si captain

### Numéros et poste sous chaque slot
- Caption mono uppercase `oklch(0.94 0.012 84 / 0.6)` : nom abrégé poste (GK, LB, ST...)
- Sur placement, le caption devient le nom de famille du joueur en GT America Medium

---

## Library (Pioche) — sticky, toujours visible

Plus de drawer modal. La library est **toujours là à droite** desktop,
ouvrable en bottom sheet mobile.

### Structure
```
┌────────────────────────────────┐
│ [🔍 Cherche un nom, un club...]│  ← input ⌘K focusable
├────────────────────────────────┤
│ ▼ ROSTER · 28 joueurs           │
│ [Mbemba]  PSG  · DEF · 75 caps  │  ← item draggable, click = ajout au slot actif
│ [Wissa]   Brentford · FW · 11   │
│ ...                             │
├────────────────────────────────┤
│ ▼ RADAR · 45 joueurs            │
│ [Nzinga] PSG U23 · MID · radar  │
│ ...                             │
└────────────────────────────────┘
```

### Item joueur (compact 56px height)
- Avatar 36px cercle gauche
- Nom GT America Medium 14px + ligne info JetBrains Mono 11px (`CLUB · POSTE · CAPS/RADAR`)
- Si joueur déjà placé dans XI ou banc : opacity 0.35 + checkmark `--cobalt` 14px à droite, non-cliquable
- Drag : grab cursor + ghost preview
- Click sur item : si un slot est actif (sélectionné en attente) → place dans ce slot. Sinon → ajoute au banc si banc pas plein.

### Search
- Input transparent sur fond `--void-deeper`, border bottom 1px `--bone-mute`
- Focus : border bottom `--cobalt` 2px
- Placeholder typo italic `--bone-mute`
- Shortcut `⌘K` indiqué dans le placeholder à droite

---

## Motion

### Principes (cf. impeccable shared design laws)
- **Pas de spring rebond, pas d'élastique**
- Ease-out exponentiel partout : `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-quart)
- Transitions < 240ms (jamais plus, sinon l'app sent lente)
- Pas d'animation sur les propriétés layout (`width`, `height`, `padding`...) — uniquement transform + opacity

### Transitions clés
- Slot vide → joueur placé : `scale(0.7) → scale(1)` 220ms + photo fade 180ms
- Drag-over compatible : highlight slot 120ms
- Drag-over INCOMPATIBLE : shake `translateX(-3px → 3px → 0)` 200ms + flash border `--blood` 200ms
- Toast undo apparition : slide-down 200ms + fade-in
- Toast undo disparition (après 5s ou action) : slide-up 160ms + fade-out
- Formation switch : pitch crossfade 200ms (positions slots morph via FLIP technique)

### Pas de motion pour pas de motion
- Pas d'auto-pulsing CTA
- Pas de particules cobalt qui flottent
- Pas de scroll-triggered animations sur cette page (single screen)
- Pas de hover scale partout (uniquement sur slots du pitch + items library en drag preview)

---

## États (cf. impeccable harden/onboard)

### Empty (premier visit)
- Pitch avec slots vides + dashed border
- Library pré-chargée avec Roster en premier
- Sticky CTA bottom **désactivé** + texte `"Choisis 11 joueurs pour commencer"`
- **Pas d'onboarding obligatoire**, pas de tour produit. L'interface s'explique seule par convention FUT-like (slot vide = clique pour remplir).

### Loading initial (fetch players)
- Pitch et library en skeleton : cercles `--bone-mute` opacity 0.15, pulse léger
- Pas de spinner centré, pas de "Loading…" texte
- Le skeleton respecte la grille finale → pas de layout shift à l'arrivée des data

### Saving (auto-save background)
- Indicateur **discret** : un point `--cobalt` 6px de diamètre en haut-droite du sticky top bar, animation pulse 1.2s
- Tooltip au survol : `Sauvegarde locale · OK il y a 2 sec`
- **Pas de toast bruyant** à chaque save

### Error (Supabase down, network fail)
- Toast bottom-left : `Hors ligne. Ta liste est en sécurité ici.` + icône cobalt
- Persiste tant que la connexion n'est pas rétablie
- L'app reste 100% utilisable hors ligne grâce au localStorage

### Success (liste complète + share déclenché)
- CTA bottom devient `Posée. Partage.`
- Pitch reçoit un **glow doux** `--cobalt-haze` 2s puis disparaît
- Modal share apparaît avec les 3 actions : Insta + X + Lien (pas plus)
- **Pas de confettis, pas de "Bravo !"** — la sobriété renforce le premium

### Comparaison "vs Desabre" (futur)
Quand sélection officielle publiée :
- Bouton secondaire dans sticky top : `Comparer avec Desabre`
- Pitch split-view : ta liste à gauche, Desabre à droite
- Highlights : `--cobalt` pour les joueurs en commun, `--blood` pour ceux qui diffèrent

---

## Signature visuelle (la chose qu'on ne fait nulle part ailleurs)

**Numéros maillot en PP Sans Rounded sur les joueurs placés**, alignés à
la verticale du nom de famille, en gris très clair `oklch(0.94 0.012 84 / 0.45)`.
Ça crée une typographie "maillot RDC" reconnaissable.

**Drapeau RDC subliminal** dans le pitch (8% opacity sur le tiers
inférieur) — invisible au premier coup d'œil, présent au second.

**Photo joueur en cercle avec halo cobalt sur le capitaine uniquement**.
Pas d'icône couronne, pas de "C" en badge. Le halo dit tout.

---

## Anti-patterns absolus (refus catégorique pour ce projet)

(Cf. `impeccable absolute bans` + `frontend-masters` anti-slop manifesto + `feedback_humanize-text-obligatoire-sur-tout-copy`)

1. ❌ **Gradient text** sur "26", "Léopards", "Mondial" ou n'importe quel titre
2. ❌ **Glassmorphism par défaut** : pas de `backdrop-blur-*` sauf justification (le sticky top bar peut avoir un blur 8px sur fond translucide `--void / 0.85`, et c'est tout)
3. ❌ **Pill badge "Nouveau · Mondial 2026"** avec Sparkles icon
4. ❌ **Hero metric template** : 4 stats cards "RADAR · ÂGE · VALEUR · FORMATION" alignées
5. ❌ **Identical card grids** pour les formations (3 cards identiques 4-3-3 / 4-2-3-1 / 3-5-2) — remplacé par toggle pills dans la top bar
6. ❌ **Confetti / sparkle animation** sur completion
7. ❌ **Modal as first thought** — drawer player selector qui cohabite avec sidebar
8. ❌ **Fake social proof** : `247 listes déjà composées` hardcoded
9. ❌ **Em-dash dans le copy** — `—` interdit, utiliser virgule, deux-points, point ou parenthèses
10. ❌ **"Bravo, ta liste est prête !"** type cheering — remplacé par sobriété éditoriale
11. ❌ **`text-balance` Pretty** sur titres longs — produit du flou visuel
12. ❌ **Hard-coded popularity %** sur les formations (vrais chiffres aggregate BDD ou rien)
13. ❌ **`window.confirm()` natif** — remplacé par toast undo
14. ❌ **Progress dots "5 étapes"** — il n'y a plus 5 étapes, il y en a UNE

---

## Curseurs taste-skill pour ce projet

Cf. `taste-skill` Tier 1 kAIra UI :
- `DESIGNVARIANCE = 0.75` (forte variance créative, on assume une DA distinctive)
- `MOTIONINTENSITY = 0.3` (motion discrète, jamais show-off, sobriété cinéma)
- `VISUAL_DENSITY = 0.7` (dense côté library + bench, aéré côté pitch)

---

## Mapping skills mobilisés (cf. skills-governance.md)

| Phase | Skills Tier 1 kAIra | Skills 1.5 / 2 complémentaires |
|---|---|---|
| Direction artistique | `taste-skill` + `senior-ui-engineer` | `frontend-masters` (Cinematic Dark + Neo-editorial) + `brand-masters` (positionnement Léopards) + `font-pairing` |
| Conception composants | `senior-ui-engineer` | `impeccable shape` puis `craft` |
| Animation + états | `senior-ui-engineer` | `impeccable animate` + `harden` + `onboard` |
| Polish final | `taste-skill` | `impeccable critique` + `polish` + `delight` |
| Copy / micro-copy | `kaira-identite` | `copywriting` + `impeccable clarify` puis `humanize-text` |
| QA pré-ship 4 passes | — | `web-quality/web-quality-audit` (Lighthouse) + `playwright-skill` (screenshots multi-viewports) + `impeccable critique/polish` + `humanize-text` |

---

## Métriques de validation (mesurables Lighthouse + Playwright)

### Performance
- **Lighthouse Performance ≥ 95** mobile
- **LCP ≤ 2.0s** mobile (cible ambitieuse, hard standard kAIra)
- **INP ≤ 150ms** (interaction drag & drop fluide)
- **CLS ≤ 0.05** (le skeleton respecte la grille finale)

### Accessibilité
- **Lighthouse Accessibility = 100**
- **WCAG 2.2 AA** contrast ratio sur tout texte ≥ 4.5:1, ≥ 3:1 grand texte
- Touch targets ≥ 44px sur mobile (slots, items library, buttons)
- Navigation keyboard complète (Tab, Enter, Esc, ⌘K search, arrow keys pour navigation slots)
- Screen reader : chaque slot annoncé `Poste {SLOT}, {ÉTAT}` + chaque item library `{Nom}, {Club}, {Poste}, {CAPS}`

### UX
- **Time to first selection** : ≤ 5 sec (mesuré Playwright avec interaction simulée)
- **Time to share** (XI + bench + capitaine + click partager) : ≤ 60 sec
- **Zero browser native confirm()** dans tout le flow

### SEO
- **Lighthouse SEO ≥ 95**
- Meta description ≤ 160 chars, sans em-dash
- OG image dynamique par liste partagée (route `/api/og?slug=...` ou static export par submit)

---

## Décisions actées (2026-05-16, Alexandre)

1. ✅ **Pseudo input** = après save uniquement, dans la modal share, optionnel. Submit anonyme possible.
2. ✅ **Mode "vs Desabre"** = v2 (feature flag activé quand sélection officielle publiée en BDD)
3. ✅ **Mode "remix" liste partagée** = v1 dès ship initial (URL state + auto-load gratuits techniquement)
4. ✅ **Typo** = full Google Fonts gratuit (Bricolage Grotesque + Inter Tight + JetBrains Mono)
5. ⏳ **Mobile gesture** : à trancher au Sprint 5 (tests Playwright multi-viewports). Reco : tap = inline menu (1 niveau d'interaction).

---

## Workflow d'implémentation (Sprint 2 → Sprint 6)

Sprint 1 ✅ — ce DESIGN.md, validé par Alexandre.

Sprint 2 — Refonte architecture
- `src/pages/MaListe.tsx` : 1 page, suppression wizard
- `src/store/maListeStore.ts` : ajouter URL state sync + auto-save indicator
- Suppression `IntroScreen.tsx`, `FormationPicker.tsx`, `MaListeProgress.tsx`, `PlayerSelectionDrawer.tsx`

Sprint 3 — UI atomique nouvelle
- `src/components/ma-liste/v2/Pitch.tsx` (SVG terrain + slots)
- `src/components/ma-liste/v2/Library.tsx` (sticky sidebar/bottom sheet)
- `src/components/ma-liste/v2/TopBar.tsx` (logo + formation toggle + save indicator)
- `src/components/ma-liste/v2/BenchStrip.tsx`
- `src/components/ma-liste/v2/StickyShareCTA.tsx`
- `src/components/ma-liste/v2/ToastUndo.tsx`

Sprint 4 — Copy + i18n via kaira-identite + humanize-text

Sprint 5 — Motion + états (empty/loading/error/success)

Sprint 6 — QA 4 passes pré-ship

---

## Voir aussi
- Audit complet : conversation session 2026-05-16, message "Ma Liste — sévère"
- Workflow UI 10 étapes kAIra : `/Users/alexandrengomo/kAIra/CLAUDE.md`
- Standard frontend minimum (étalon inam-flow-studio + nur-inampilates) :
  memory `feedback_standard-frontend-minimum`
- Règle humanize-text obligatoire : memory `feedback_humanize-text-obligatoire-sur-tout-copy`
- Patterns AI slop à bannir : `frontend-masters` + `impeccable` absolute bans
