/**
 * Stories — données statiques de la couche éditoriale.
 *
 * Volontairement en TypeScript et pas en Supabase : on commence par 3
 * articles maison pour valider le pattern éditorial. Migration vers une
 * table `stories` quand le rythme de publication justifie la friction
 * d'un CMS.
 *
 * Format `body` : tableau de blocs typés. Permet du rendu structuré
 * sans pousser un parser MDX (kicker, paragraph, quote, h2). Cohérent
 * avec le ton kAIra : pas de magie, juste ce qui résout le problème.
 */

export type StoryCategory =
  | "Investigation"
  | "Profil"
  | "Analyse"
  | "Diaspora"
  | "Histoire";

export type StoryBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string; cite?: string };

export interface Story {
  slug: string;
  title: string;
  /** sous-titre éditorial sous le titre */
  subtitle: string;
  /** chapeau court pour les cards de liste (1-2 phrases) */
  excerpt: string;
  category: StoryCategory;
  author: string;
  publishedAt: string; // YYYY-MM-DD
  /** temps de lecture en minutes — calculé à la louche */
  readingMinutes: number;
  /** featured = mis en hero sur la page liste */
  featured?: boolean;
  body: StoryBlock[];
}

export const STORIES: Story[] = [
  {
    slug: "leopards-oublies-5-talents-rdc",
    title: "Les Léopards oubliés.",
    subtitle:
      "Cinq talents que la RDC n'a pas su retenir, et ce que ça nous dit sur les années qui viennent.",
    excerpt:
      "À chaque cycle, des binationaux choisissent une autre sélection. Pas par mépris — par défaut de structure. Enquête sur cinq cas qui auraient dû finir Léopards.",
    category: "Investigation",
    author: "Léopards Radar",
    publishedAt: "2026-04-22",
    readingMinutes: 7,
    featured: true,
    body: [
      {
        type: "p",
        text: "On a tous une liste en tête. Le défenseur central qui finit chez les Diables Rouges. L'attaquant qui choisit la France après deux convocations en équipe espoirs. Le milieu qui n'a jamais reçu le moindre coup de fil. Cinq histoires, cinq opportunités manquées — pas par hasard.",
      },
      {
        type: "h2",
        text: "Ce qui se joue avant la convocation",
      },
      {
        type: "p",
        text: "La concurrence pour un binational ne commence pas avec une feuille de match. Elle commence avec un message WhatsApp à 17 ans, un déplacement d'un sélectionneur adjoint, une fiche tenue par une fédération dans un dossier partagé. Tout ce qu'on appelle, dans d'autres industries, du back-office.",
      },
      {
        type: "quote",
        text: "On a appris l'éligibilité du joueur trois mois après son premier match en A avec une autre nation.",
        cite: "Un ancien dirigeant fédéral, sous couvert d'anonymat",
      },
      {
        type: "h2",
        text: "Cinq cas concrets — et un pattern",
      },
      {
        type: "p",
        text: "On les nomme dans le rapport long format réservé aux abonnés de la newsletter. Mais le pattern, lui, est public : à chaque fois, le joueur n'a pas été contacté avant le moment où il a dû arbitrer. À chaque fois, l'autre fédération avait déjà une fiche, un référent, un calendrier de relance. À chaque fois, la RDC arrive après l'engagement.",
      },
      {
        type: "h2",
        text: "Ce qu'on peut en faire pour les années qui viennent",
      },
      {
        type: "p",
        text: "Ce radar existe pour ça. Pas pour pleurer les départs — pour cartographier les arrivées possibles avant qu'elles ne soient des départs. Cinq cas sont déjà sur le radar 2026-2030. Vous les retrouverez tous, par poste, par tier, par championnat, dans la section Radar.",
      },
    ],
  },
  {
    slug: "wissa-patience-leopard",
    title: "Wissa, la patience d'un Léopard.",
    subtitle:
      "Comment Newcastle a redonné à la RDC son grand 9, sept ans après son premier coup d'œil.",
    excerpt:
      "Yoane Wissa a mis le temps. Brentford, Premier League, Newcastle. À 29 ans, il devient ce que personne n'avait osé prédire en 2018 : la pointe assumée des Léopards.",
    category: "Profil",
    author: "Léopards Radar",
    publishedAt: "2026-04-15",
    readingMinutes: 5,
    body: [
      {
        type: "p",
        text: "On l'appelait l'attaquant à tout faire. Trop technique pour un pivot pur, trop lent pour un ailier inversé, trop petit pour porter l'attaque seul. Pendant cinq ans, Wissa a porté toutes les étiquettes — sauf celle qui compte : titulaire en sélection.",
      },
      {
        type: "h2",
        text: "Ce que Newcastle a vu que les autres avaient manqué",
      },
      {
        type: "p",
        text: "À Newcastle, le projet est différent. On lui demande de fixer la défense, de redescendre, de remettre. Pas de courir derrière des ballons longs. Le résultat : ses premières statistiques de 9 dans un grand championnat. Et derrière, la sélection qui suit.",
      },
      {
        type: "quote",
        text: "Il a la patience d'un joueur qui sait qu'on ne l'attend nulle part. Et l'application d'un joueur qui sait qu'il n'aura pas deux fois la chance.",
      },
      {
        type: "h2",
        text: "Ce qu'il change pour les Léopards",
      },
      {
        type: "p",
        text: "Wissa permet enfin de ne pas demander à Bakambu d'avoir 32 ans pour la troisième fois. Il libère Mbemba sur la profondeur. Il rend crédibles trois schémas tactiques que le sélectionneur n'osait pas tester sans pivot. Bref, il déverrouille un onze que tout le monde voit depuis trois ans sans pouvoir le poser.",
      },
    ],
  },
  {
    slug: "best-xi-15-tournant",
    title: "Pourquoi le Best XI #15 marque un tournant.",
    subtitle:
      "Lavia en métronome, Lukeba en patron, Wissa en pointe : la première compo qui assume une génération.",
    excerpt:
      "Pour la première fois depuis le début de notre Best XI hebdomadaire, le onze ne pioche pas dans deux générations en concurrence. Il en assume une. Et ça change tout.",
    category: "Analyse",
    author: "Léopards Radar",
    publishedAt: "2026-04-19",
    readingMinutes: 4,
    body: [
      {
        type: "p",
        text: "On a fait quinze Best XI en quinze semaines. Sur les quatorze premiers, on tergiverse toujours sur trois places : un trio défensif qui mélange l'expérience et l'avenir, un milieu qui hésite entre cadres et nouvelles têtes, et une pointe qui n'arrive pas à se décider. Cette semaine, on tranche.",
      },
      {
        type: "h2",
        text: "Le métronome qu'on attendait",
      },
      {
        type: "p",
        text: "Roméo Lavia. 22 ans, Chelsea, formation City. C'est le joueur qui transforme un milieu de transition en milieu de possession. Le seul de la liste qui sait recevoir dos au jeu, pivoter et casser une ligne dans le même geste. À ce poste, on n'avait personne. Maintenant on a un titulaire indiscutable.",
      },
      {
        type: "h2",
        text: "Le patron qui assume",
      },
      {
        type: "p",
        text: "Castello Lukeba. 23 ans, Leipzig. Pas le plus rapide. Pas le plus puissant. Le plus calme. Et c'est exactement ce qu'il manquait à une charnière qui défendait par anticipation parce qu'elle ne défendait pas par lecture. Lukeba lit. Lukeba parle. Lukeba commande.",
      },
      {
        type: "h2",
        text: "Ce que ce onze libère pour la suite",
      },
      {
        type: "p",
        text: "Pour la première fois, on ne pose pas un onze qu'on rééquilibre à chaque trêve. On pose une base. Les huit prochaines semaines diront si elle tient. Mais le simple fait de pouvoir l'écrire — c'est déjà un changement.",
      },
    ],
  },
];

export function getStoryBySlug(slug: string): Story | undefined {
  return STORIES.find((s) => s.slug === slug);
}

export function getRelatedStories(slug: string, limit = 3): Story[] {
  const current = getStoryBySlug(slug);
  if (!current) return STORIES.slice(0, limit);
  return STORIES.filter(
    (s) => s.slug !== slug && s.category === current.category,
  )
    .concat(STORIES.filter((s) => s.slug !== slug && s.category !== current.category))
    .slice(0, limit);
}
