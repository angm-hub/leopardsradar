import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import {
  Home,
  Users,
  Radar,
  Trophy,
  Mail,
  Info,
  Search,
  Send,
  ListPlus,
  Sparkles,
  Loader2,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  BookOpen,
} from "lucide-react";
import { usePlayers } from "@/hooks/usePlayers";
import { usePlayerSearch } from "@/hooks/usePlayerSearch";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { flagFor, formatMarketValue } from "@/lib/playerHelpers";
import { cn } from "@/lib/utils";
import type { DBPlayer } from "@/types/dbPlayer";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAGES = [
  { label: "Accueil", href: "/", icon: Home },
  { label: "Roster", href: "/roster", icon: Users },
  { label: "Radar", href: "/radar", icon: Radar },
  { label: "Best XI", href: "/best-xi", icon: Trophy },
  { label: "Histoires", href: "/histoires", icon: BookOpen },
  { label: "Ma Liste", href: "/ma-liste", icon: ListPlus },
  { label: "Newsletter", href: "/newsletter", icon: Mail },
  { label: "À propos", href: "/a-propos", icon: Info },
];

const MIN_SEARCH_LENGTH = 2;

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const trimmed = search.trim();
  const isSearching = trimmed.length >= MIN_SEARCH_LENGTH;

  // Mode découverte : top 5 roster + top 5 radar par valeur marchande
  const { players: rosterTop } = usePlayers({
    category: "roster",
    excludeEligibilityStatus: "ineligible",
    limit: 5,
    orderBy: { column: "market_value_eur", ascending: false },
  });
  const { players: radarTop } = usePlayers({
    category: "radar",
    excludeEligibilityStatus: "ineligible",
    limit: 5,
    orderBy: { column: "market_value_eur", ascending: false },
  });

  // Mode recherche : Supabase ilike live (debounced)
  const { results: searchResults, loading: searchLoading } = usePlayerSearch({
    query: search,
    minLength: MIN_SEARCH_LENGTH,
    debounceMs: 200,
    limit: 8,
  });

  useEffect(() => {
    if (!open) {
      // Reset query au close pour ne pas garder la recherche au rouvrir
      const t = setTimeout(() => setSearch(""), 150);
      return () => clearTimeout(t);
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const go = (href: string) => {
    onOpenChange(false);
    navigate(href);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4"
      onClick={() => onOpenChange(false)}
    >
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />

      <div
        className="relative mt-32 w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          label="Command palette"
          className="flex flex-col"
          // Filtrage client uniquement en mode découverte.
          // En mode recherche, c'est Supabase qui filtre — cmdk doit tout afficher.
          shouldFilter={!isSearching}
        >
          <div className="flex items-center gap-3 px-4 border-b border-border">
            {searchLoading ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <Command.Input
              autoFocus
              value={search}
              onValueChange={setSearch}
              placeholder="Rechercher un joueur, un club, une page…"
              className="flex h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[420px] overflow-y-auto p-2">
            <Command.Empty className="py-10 text-center text-sm text-muted-foreground">
              {isSearching && !searchLoading
                ? `Aucun joueur trouvé pour "${trimmed}".`
                : "Aucun résultat."}
            </Command.Empty>

            {/* MODE RECHERCHE : résultats Supabase live */}
            {isSearching && searchResults.length > 0 ? (
              <Command.Group
                heading={`Joueurs (${searchResults.length})`}
                className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2"
              >
                {searchResults.map((p) => (
                  <PlayerItem key={p.slug} player={p} onSelect={() => go(`/player/${p.slug}`)} />
                ))}
              </Command.Group>
            ) : null}

            {/* MODE DÉCOUVERTE : pages + top par valeur */}
            {!isSearching ? (
              <>
                <Command.Group
                  heading="Pages"
                  className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2"
                >
                  {PAGES.map((p) => (
                    <PaletteItem
                      key={p.href}
                      value={`page ${p.label}`}
                      icon={<p.icon className="h-4 w-4" />}
                      label={p.label}
                      onSelect={() => go(p.href)}
                    />
                  ))}
                </Command.Group>

                {rosterTop.length > 0 ? (
                  <Command.Group
                    heading="Top Roster (par valeur)"
                    className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2"
                  >
                    {rosterTop.map((p) => (
                      <PlayerItem
                        key={`r-${p.slug}`}
                        player={p}
                        onSelect={() => go(`/player/${p.slug}`)}
                      />
                    ))}
                  </Command.Group>
                ) : null}

                {radarTop.length > 0 ? (
                  <Command.Group
                    heading="Top Radar (par valeur)"
                    className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2"
                  >
                    {radarTop.map((p) => (
                      <PlayerItem
                        key={`rd-${p.slug}`}
                        player={p}
                        prefix={<Sparkles className="h-3 w-3 text-primary" />}
                        onSelect={() => go(`/player/${p.slug}`)}
                      />
                    ))}
                  </Command.Group>
                ) : null}

                <Command.Group
                  heading="Actions"
                  className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2"
                >
                  <PaletteItem
                    value="action compose ma liste"
                    icon={<ListPlus className="h-4 w-4" />}
                    label="Compose ta sélection des 26"
                    hint="Ma Liste"
                    onSelect={() => go("/ma-liste")}
                  />
                  <PaletteItem
                    value="action best xi semaine"
                    icon={<Trophy className="h-4 w-4" />}
                    label="Voir le Best XI cette semaine"
                    onSelect={() => go("/best-xi")}
                  />
                  <PaletteItem
                    value="action newsletter abonnement"
                    icon={<Send className="h-4 w-4" />}
                    label="S'abonner à la newsletter"
                    onSelect={() => go("/newsletter")}
                  />
                </Command.Group>
              </>
            ) : null}
          </Command.List>

          {/* Footer raccourcis style Linear */}
          <div className="flex items-center justify-between gap-3 px-3 py-2 border-t border-border bg-card/60 text-[10px] font-mono text-muted-foreground">
            <div className="flex items-center gap-3">
              <KbdHint icon={<ArrowUp className="h-2.5 w-2.5" />} extra={<ArrowDown className="h-2.5 w-2.5" />} label="Naviguer" />
              <KbdHint icon={<CornerDownLeft className="h-2.5 w-2.5" />} label="Sélectionner" />
            </div>
            <span className="hidden sm:inline">
              {isSearching
                ? "Recherche live · 471 joueurs"
                : "Astuce : tape un nom pour chercher dans tout le radar"}
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}

function KbdHint({
  icon,
  extra,
  label,
}: {
  icon: React.ReactNode;
  extra?: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <kbd className="inline-flex items-center justify-center h-4 min-w-[16px] rounded border border-border bg-background px-1">
        {icon}
      </kbd>
      {extra ? (
        <kbd className="inline-flex items-center justify-center h-4 min-w-[16px] rounded border border-border bg-background px-1">
          {extra}
        </kbd>
      ) : null}
      {label}
    </span>
  );
}

interface PlayerItemProps {
  player: DBPlayer;
  prefix?: React.ReactNode;
  onSelect: () => void;
}

/**
 * PlayerItem — ligne de joueur enrichie : avatar + nom + drapeau + club + valeur.
 * Remplace le rendu pauvre précédent (juste avatar OU sparkles).
 */
function PlayerItem({ player, prefix, onSelect }: PlayerItemProps) {
  const flag = player.other_nationalities?.[0] ?? player.nationalities?.[0];
  return (
    <Command.Item
      value={`${player.name} ${player.current_club ?? ""} ${player.slug}`}
      onSelect={onSelect}
      className={cn(
        "flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer text-sm text-foreground",
        "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
      )}
    >
      <PlayerAvatar
        name={player.name}
        src={player.image_url}
        className="h-7 w-7 rounded-full shrink-0"
        initialsClassName="text-[10px]"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {prefix}
          <span className="truncate normal-case tracking-normal">{player.name}</span>
          {flag ? <span className="text-xs leading-none">{flagFor(flag)}</span> : null}
        </div>
        {player.current_club ? (
          <span className="text-[10px] text-muted-foreground normal-case tracking-normal truncate block">
            {player.current_club}
          </span>
        ) : null}
      </div>
      {player.market_value_eur && player.market_value_eur > 0 ? (
        <span className="text-[10px] font-mono text-primary/85 shrink-0">
          {formatMarketValue(player.market_value_eur)}
        </span>
      ) : null}
    </Command.Item>
  );
}

interface PaletteItemProps {
  value: string;
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onSelect: () => void;
}

function PaletteItem({ value, icon, label, hint, onSelect }: PaletteItemProps) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className={cn(
        "flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer text-sm text-foreground",
        "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
      )}
    >
      <span className="flex h-6 w-6 items-center justify-center text-foreground/80 shrink-0">
        {icon}
      </span>
      <span className="flex-1 truncate normal-case tracking-normal">{label}</span>
      {hint ? (
        <span className="text-xs text-muted-foreground normal-case tracking-normal truncate max-w-[40%]">
          {hint}
        </span>
      ) : null}
    </Command.Item>
  );
}

export default CommandPalette;
