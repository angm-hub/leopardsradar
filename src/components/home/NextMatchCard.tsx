import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useNextMatch } from "@/hooks/useNextMatch";

function formatCountdown(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  return { days, hours };
}

function formatDateFR(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function NextMatchCard() {
  const { match, isResult, loading } = useNextMatch();

  if (loading) {
    return (
      <div className="h-full p-6 flex flex-col justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
          Prochain match
        </span>
        <div className="h-12 w-2/3 rounded bg-card-hover animate-pulse" />
        <div className="h-4 w-1/2 rounded bg-card-hover animate-pulse" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="h-full p-6 flex flex-col justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
          Prochain match
        </span>
        <div>
          <p className="font-serif text-2xl text-foreground leading-tight">
            Calendrier à venir
          </p>
          <p className="mt-2 text-xs text-muted">
            On annonce ici dès qu'un match officiel ou amical est confirmé.
          </p>
        </div>
        <div />
      </div>
    );
  }

  // Aucun match programmé : on montre le dernier résultat plutôt qu'une
  // case vide. Score en gros, verdict lisible, lien vers le bilan si c'est
  // un match de Coupe du Monde.
  if (isResult) {
    const scoreRdc = match.score_rdc ?? 0;
    const scoreOpp = match.score_opponent ?? 0;
    const verdict =
      scoreRdc > scoreOpp ? "Victoire" : scoreRdc === scoreOpp ? "Nul" : "Défaite";
    const verdictColor =
      scoreRdc > scoreOpp
        ? "text-emerald-400"
        : scoreRdc === scoreOpp
          ? "text-amber-400"
          : "text-red-400";
    const isMondial = match.competition.toLowerCase().includes("coupe du monde");
    const location = [match.venue, match.city].filter(Boolean).join(" · ");

    return (
      <div className="h-full p-6 flex flex-col justify-between gap-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
            Dernier match
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary text-right truncate">
            {match.competition}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🇨🇩</span>
            <span className="font-serif text-lg text-foreground">RDC</span>
            <span className="font-mono text-2xl font-bold text-foreground">
              {scoreRdc}
              <span className="text-muted mx-1">·</span>
              {scoreOpp}
            </span>
            <span className="font-serif text-lg text-foreground">
              {match.opponent_code ?? match.opponent_name}
            </span>
            {match.opponent_flag ? (
              <span className="text-2xl">{match.opponent_flag}</span>
            ) : null}
          </div>
          <span
            className={`font-mono text-[11px] uppercase tracking-[0.2em] ${verdictColor}`}
          >
            {verdict}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-muted gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            <span>{formatDateFR(match.kickoff_at)}</span>
          </div>
          {isMondial ? (
            <Link
              to="/mondial-2026"
              className="group inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
            >
              Le bilan du Mondial
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : location ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const kickoff = new Date(match.kickoff_at);
  const { days, hours } = formatCountdown(kickoff);
  const location = [match.venue, match.city].filter(Boolean).join(" · ");

  return (
    <div className="h-full p-6 flex flex-col justify-between gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
          Prochain match
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-primary text-right truncate">
          {match.competition}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🇨🇩</span>
            <span className="font-serif text-lg text-foreground">RDC</span>
          </div>
          <span className="font-mono text-xs text-muted">vs</span>
          <div className="flex items-center gap-2">
            {match.opponent_flag ? (
              <span className="text-2xl">{match.opponent_flag}</span>
            ) : null}
            <span className="font-serif text-lg text-foreground">
              {match.opponent_code ?? match.opponent_name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-foreground leading-none">
              {days}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-muted mt-1">
              jours
            </span>
          </div>
          <span className="text-muted">:</span>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-foreground leading-none">
              {hours}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-muted mt-1">
              heures
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          <span>{formatDateFR(match.kickoff_at)}</span>
        </div>
        {location ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default NextMatchCard;
