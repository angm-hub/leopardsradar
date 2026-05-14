import { ExternalLink, ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion, Clock, FileCheck } from "lucide-react";
import type {
  DBPlayer,
  DBNationalityBasis,
  DBSelection,
  ComputedEligibilityStatus,
  Confidence,
  Basis,
  SelectionCategory,
} from "@/types/dbPlayer";
import { cn } from "@/lib/utils";

interface PlayerEligibilityBlockProps {
  player: DBPlayer;
  bases: DBNationalityBasis[];
  selections: DBSelection[];
}

// ─────────────────────────────────────────────────────────────────────
// Visual mapping
// ─────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ComputedEligibilityStatus,
  { label: string; icon: typeof ShieldCheck; color: string; bgColor: string; ringColor: string }
> = {
  SELECTED: {
    label: "Sélectionné",
    icon: ShieldCheck,
    color: "text-emerald-300",
    bgColor: "bg-emerald-500/15",
    ringColor: "ring-emerald-500/30",
  },
  ELIGIBLE: {
    label: "Éligible",
    icon: ShieldCheck,
    color: "text-sky-300",
    bgColor: "bg-sky-500/15",
    ringColor: "ring-sky-500/30",
  },
  POTENTIALLY: {
    label: "Potentiellement éligible",
    icon: ShieldQuestion,
    color: "text-orange-300",
    bgColor: "bg-orange-500/15",
    ringColor: "ring-orange-500/30",
  },
  SWITCHABLE: {
    label: "Switch FIFA possible",
    icon: ShieldAlert,
    color: "text-yellow-300",
    bgColor: "bg-yellow-500/15",
    ringColor: "ring-yellow-500/30",
  },
  INELIGIBLE: {
    label: "Inéligible (cap-tied)",
    icon: ShieldX,
    color: "text-rose-300",
    bgColor: "bg-rose-500/15",
    ringColor: "ring-rose-500/30",
  },
};

const BASIS_LABEL: Record<Basis, string> = {
  BIRTH: "Né en RDC",
  FATHER: "Père né en RDC",
  MOTHER: "Mère née en RDC",
  GRANDPARENT_PATERNAL_GRANDFATHER: "Grand-père paternel né en RDC",
  GRANDPARENT_PATERNAL_GRANDMOTHER: "Grand-mère paternelle née en RDC",
  GRANDPARENT_MATERNAL_GRANDFATHER: "Grand-père maternel né en RDC",
  GRANDPARENT_MATERNAL_GRANDMOTHER: "Grand-mère maternelle née en RDC",
  RESIDENCE_5Y: "Résidence ≥ 5 ans en RDC",
  NATURALIZATION: "Naturalisation",
  UNKNOWN: "Base à instruire",
};

const CATEGORY_LABEL: Record<SelectionCategory, string> = {
  A_OFFICIAL: "A officiel",
  A_FRIENDLY: "A amical",
  U23: "U23",
  U21: "U21",
  U20: "U20",
  U19: "U19",
  U18: "U18",
  U17: "U17",
};

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  HIGH: "Élevée",
  MEDIUM: "Moyenne",
  LOW: "Faible",
};

const CONFIDENCE_COLOR: Record<Confidence, string> = {
  HIGH: "text-emerald-300",
  MEDIUM: "text-orange-300",
  LOW: "text-muted-light",
};

const SWITCH_WINDOW_LABEL: Record<string, string> = {
  OPEN: "Fenêtre ouverte",
  CONDITIONAL: "Switch conditionnel",
  CLOSED: "Fenêtre fermée",
};

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function formatDateFr(iso: string | null): string {
  if (!iso) return "?";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function blockerExplain(b: string): string {
  // Patterns : MAJOR_COMP_FRA, CAP_TIED_FRA_OFFICIAL_AGE_24, CAP_TIED_FRA_3PLUS_CAPS, CAP_OTHER_FRA_PRE21_2x
  const major = b.match(/^MAJOR_COMP_(\w+)$/);
  if (major) return `Participation à une grande compétition senior avec ${major[1]} (CDM/CAN/EURO/CONCACAF/Asie/Conmebol). Cap-tied définitif.`;
  const cap_age = b.match(/^CAP_TIED_(\w+)_OFFICIAL_AGE_(\d+)$/);
  if (cap_age) return `${cap_age[1]} A officiel à ${cap_age[2]} ans (≥ 21). Règle FIFA <21 ans non remplie.`;
  const cap_3 = b.match(/^CAP_TIED_(\w+)_3PLUS_CAPS$/);
  if (cap_3) return `≥ 3 caps A officielles avec ${cap_3[1]}. Cap-tied 3-cap rule.`;
  const cap_pre21 = b.match(/^CAP_OTHER_(\w+)_PRE21_(\d+)x$/);
  if (cap_pre21) return `${cap_pre21[2]} caps A officiel ${cap_pre21[1]} avant 21 ans. Switch FIFA encore possible.`;
  return b;
}

function basisProcedure(player: DBPlayer): string | null {
  const status = player.computed_eligibility_status;
  if (status === "ELIGIBLE") {
    return "Procédure FECOFA : (1) accord écrit du joueur, (2) vérifier passeport RDC actif, (3) déposer demande FIFA 60 jours avant convocation.";
  }
  if (status === "SWITCHABLE") {
    return "Switch FIFA : (1) accord écrit du joueur, (2) passeport RDC actif, (3) délai de 3 ans depuis le dernier match international, (4) dossier déposé par la FECOFA.";
  }
  if (status === "POTENTIALLY") {
    return "Profil à instruire avant approche : documenter la base juridique (parent/grand-parent né en RDC) avec source vérifiable.";
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export function PlayerEligibilityBlock({ player, bases, selections }: PlayerEligibilityBlockProps) {
  const status = player.computed_eligibility_status as ComputedEligibilityStatus | null;
  const config = status ? STATUS_CONFIG[status] : null;
  const Icon = config?.icon ?? ShieldQuestion;

  const rdcBases = bases.filter((b) => b.nationality_code === "COD");
  const otherSelections = selections.filter((s) => s.federation_code !== "COD");
  const rdcSelections = selections.filter((s) => s.federation_code === "COD");
  const procedure = basisProcedure(player);
  const sources = Array.from(
    new Set(rdcBases.map((b) => b.evidence_url).filter((u): u is string => Boolean(u)))
  );

  return (
    <section className="container-site py-12 border-t border-border">
      <div className="mb-8">
        <h2 className="font-serif text-3xl text-foreground">Statut d'éligibilité FIFA.</h2>
        <p className="mt-2 text-sm text-muted-light max-w-2xl">
          Calculé selon les Statuts FIFA art. 5 à 9 (refonte 2020). Mise à jour à
          chaque nouvelle sélection ou base juridique enregistrée.
        </p>
      </div>

      {/* Statut principal */}
      <div className={cn(
        "rounded-card border border-border p-6 md:p-8 ring-1",
        config?.bgColor ?? "bg-card",
        config?.ringColor ?? "ring-transparent",
      )}>
        <div className="flex items-start gap-4">
          <Icon className={cn("h-10 w-10 flex-shrink-0", config?.color ?? "text-muted")} />
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted font-mono">
              Statut calculé
            </p>
            <h3 className={cn("mt-1 font-serif text-3xl", config?.color ?? "text-foreground")}>
              {config?.label ?? "Inconnu"}
            </h3>
            {player.computed_confidence ? (
              <p className="mt-2 text-sm">
                <span className="text-muted">Confiance : </span>
                <span className={cn("font-semibold", CONFIDENCE_COLOR[player.computed_confidence])}>
                  {CONFIDENCE_LABEL[player.computed_confidence]}
                </span>
              </p>
            ) : null}
          </div>
          {player.switch_window ? (
            // Desktop : right-aligned aside.
            <div className="hidden md:block text-right">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted font-mono">
                Fenêtre switch FIFA
              </p>
              <div className="mt-1 flex items-center gap-1.5 justify-end">
                <Clock className="h-3.5 w-3.5 text-muted-light" />
                <span className="text-sm font-mono text-foreground">
                  {SWITCH_WINDOW_LABEL[player.switch_window] ?? player.switch_window}
                </span>
              </div>
            </div>
          ) : null}
        </div>
        {player.switch_window ? (
          // Mobile : full-width row below the status, separated by a divider.
          // Was hidden entirely on mobile before — so a critical FIFA detail
          // ("can this player still switch ?") was invisible on phones.
          <div className="md:hidden mt-4 pt-4 border-t border-border/50 flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted font-mono">
              Fenêtre switch FIFA
            </p>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-light" />
              <span className="text-sm font-mono text-foreground">
                {SWITCH_WINDOW_LABEL[player.switch_window] ?? player.switch_window}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Bases juridiques */}
      {rdcBases.length > 0 ? (
        <div className="mt-6 rounded-card border border-border bg-card p-6 md:p-8">
          <h4 className="text-[11px] uppercase tracking-[0.22em] text-muted font-mono mb-4">
            Bases juridiques RDC ({rdcBases.length})
          </h4>
          <ul className="space-y-3">
            {rdcBases.map((b) => (
              <li key={b.id} className="flex items-start gap-3">
                <FileCheck
                  className={cn(
                    "h-4 w-4 mt-1 flex-shrink-0",
                    b.confidence === "HIGH" ? "text-emerald-300" :
                    b.confidence === "MEDIUM" ? "text-orange-300" : "text-muted-light/60"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">
                      {BASIS_LABEL[b.basis as Basis] ?? b.basis}
                    </span>
                    <span className={cn("text-[10px] font-mono uppercase tracking-wider", CONFIDENCE_COLOR[b.confidence])}>
                      {CONFIDENCE_LABEL[b.confidence]}
                    </span>
                  </div>
                  {b.evidence_quote ? (
                    <p className="mt-1 text-xs text-muted-light leading-relaxed">{b.evidence_quote}</p>
                  ) : null}
                  {b.evidence_url ? (
                    <a
                      href={b.evidence_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary/85 hover:text-primary"
                    >
                      Source <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Verrous / blockers */}
      {player.computed_eligibility_blockers && player.computed_eligibility_blockers.length > 0 ? (
        <div className="mt-6 rounded-card border border-rose-500/20 bg-rose-500/5 p-6 md:p-8">
          <h4 className="text-[11px] uppercase tracking-[0.22em] text-rose-300 font-mono mb-4">
            Verrous identifiés ({player.computed_eligibility_blockers.length})
          </h4>
          <ul className="space-y-2">
            {player.computed_eligibility_blockers.map((b, i) => (
              <li key={i} className="text-sm text-foreground/85 leading-relaxed">
                <span className="text-rose-300 mr-2">→</span>
                {blockerExplain(b)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Engagements internationaux */}
      {selections.length > 0 ? (
        <div className="mt-6 rounded-card border border-border bg-card p-6 md:p-8">
          <h4 className="text-[11px] uppercase tracking-[0.22em] text-muted font-mono mb-4">
            Engagements internationaux ({selections.length})
          </h4>
          <ul className="space-y-2 text-sm">
            {selections.slice(0, 12).map((s) => (
              <li
                key={s.id}
                className={cn(
                  "flex items-baseline gap-3 py-1.5",
                  s.federation_code === "COD" ? "" : "opacity-90"
                )}
              >
                <span className="font-mono text-[11px] text-muted whitespace-nowrap">
                  {formatDateFr(s.match_date)}
                </span>
                <span className="font-mono text-[11px] text-foreground bg-card-hover px-1.5 py-0.5 rounded">
                  {s.federation_code}
                </span>
                <span className="text-[11px] text-muted-light">{CATEGORY_LABEL[s.category]}</span>
                {s.is_major_competition ? (
                  <span className="text-[10px] uppercase tracking-wider text-rose-300 font-mono">
                    Major
                  </span>
                ) : null}
                <span className="flex-1 text-xs text-foreground/75 truncate">
                  {s.competition || (s.opponent ? `vs ${s.opponent}` : "")}
                </span>
              </li>
            ))}
            {selections.length > 12 ? (
              <li className="text-[11px] text-muted pt-2 italic">
                + {selections.length - 12} autres sélections
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {/* Procédure FECOFA */}
      {procedure ? (
        <div className="mt-6 rounded-card border border-primary/20 bg-primary/5 p-6 md:p-8">
          <h4 className="text-[11px] uppercase tracking-[0.22em] text-primary/85 font-mono mb-3">
            Procédure FECOFA
          </h4>
          <p className="text-sm text-foreground/90 leading-relaxed">{procedure}</p>
        </div>
      ) : null}

      {/* Sources */}
      {sources.length > 0 ? (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="text-[11px] uppercase tracking-[0.22em] text-muted font-mono">
            Sources :
          </span>
          {sources.map((url, i) => {
            try {
              const host = new URL(url).hostname.replace("www.", "");
              return (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-primary/85 hover:text-primary inline-flex items-center gap-1"
                >
                  {host}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              );
            } catch {
              return null;
            }
          })}
        </div>
      ) : null}

      {/* Méta */}
      <div className="mt-8 pt-4 border-t border-border-soft flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-muted">
        <span>Caps RDC officielles : {rdcSelections.filter((s) => s.category === "A_OFFICIAL").length}</span>
        {player.computed_at ? (
          <span>Recalculé le {formatDateFr(player.computed_at)}</span>
        ) : null}
      </div>
    </section>
  );
}
