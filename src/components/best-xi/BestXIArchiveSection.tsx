import { useBestXIEditions } from "@/hooks/useBestXIEditions";

/** Formate une date ISO en "15 mai 2026" — format éditorial français. */
function formatEditionDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Carte d'une édition passée du Best XI.
 *
 * WHY noop sur le clic : on n'a pas encore de route /best-xi/[id].
 * Le curseur et la bordure hover signalent l'intention future sans
 * créer de lien mort.
 */
function EditionCard({
  edition,
}: {
  edition: {
    id: string;
    edition: number | null;
    formation: string | null;
    published_at: string | null;
    title: string | null;
    editorial_note: string | null;
  };
}) {
  return (
    <article
      className="cursor-pointer rounded-card border border-border bg-card p-5 flex flex-col gap-3 transition-[border-color,box-shadow] duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
      aria-label={edition.title ?? `Édition #${edition.edition}`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {edition.edition !== null ? (
          <span className="font-mono text-xs uppercase tracking-[0.22em] text-foreground/50">
            Édition #{edition.edition}
          </span>
        ) : null}
        {edition.formation ? (
          <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase text-muted">
            {edition.formation}
          </span>
        ) : null}
      </div>

      {edition.published_at ? (
        <time
          dateTime={edition.published_at}
          className="font-serif text-sm italic text-muted-light"
        >
          {formatEditionDate(edition.published_at)}
        </time>
      ) : null}

      {edition.title ? (
        <p className="font-serif text-base font-semibold text-foreground leading-snug line-clamp-2">
          {edition.title}
        </p>
      ) : null}

      {edition.editorial_note ? (
        <p className="font-serif text-sm italic text-muted-light/80 leading-relaxed line-clamp-2">
          {edition.editorial_note}
        </p>
      ) : null}
    </article>
  );
}

/**
 * BestXIArchiveSection — historique des éditions passées du Best XI.
 *
 * WHY section séparée : le Best XI courant est au-dessus, l'historique
 * est un contenu complémentaire qui ne doit pas alourdir le fold.
 *
 * Masquée automatiquement si :
 *  - la table best_xi est vide ou inaccessible
 *  - il n'existe pas encore d'édition précédente (< 2 entrées en base)
 */
export function BestXIArchiveSection() {
  const { editions, loading } = useBestXIEditions();

  // Rien à afficher → on ne monte pas la section du tout.
  if (!loading && editions.length === 0) return null;

  return (
    <section className="container-site pb-16">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-success/85">
          Éditions précédentes
        </p>
        <h2 className="mt-2 font-serif text-2xl md:text-3xl text-foreground tracking-tight">
          L'historique des onze.
        </h2>
        <p className="mt-1.5 text-sm text-muted-light max-w-lg">
          Une compo par dimanche depuis le lancement. Voir comment le onze
          évolue.
        </p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-card bg-card border border-border"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {editions.map((ed) => (
            <EditionCard key={ed.id} edition={ed} />
          ))}
        </div>
      )}
    </section>
  );
}
