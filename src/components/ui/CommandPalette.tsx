import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import {
  Home, Users, Radar, Trophy, Mail, Info,
  Sparkles, Search, Send, Plus,
} from "lucide-react";
import { usePlayers } from "@/hooks/usePlayers";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAGES = [
  { label: "Accueil", href: "/", icon: Home },
  { label: "Roster", href: "/roster", icon: Users },
  { label: "Radar", href: "/radar", icon: Radar },
  { label: "Best XI", href: "/best-xi", icon: Trophy },
  { label: "Newsletter", href: "/newsletter", icon: Mail },
  { label: "À propos", href: "/a-propos", icon: Info },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  // Top 10 roster + top 5 radar from real Supabase data
  const { players: rosterTop } = usePlayers({
    category: "roster",
    limit: 10,
    orderBy: { column: "name", ascending: true },
  });
  const { players: radarTop } = usePlayers({
    category: "radar",
    limit: 5,
    orderBy: { column: "name", ascending: true },
  });

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
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
    setSearch("");
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
        <Command label="Command palette" className="flex flex-col" shouldFilter>
          <div className="flex items-center gap-3 px-4 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
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
              Aucun résultat.
            </Command.Empty>

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

            {rosterTop.length > 0 && (
              <Command.Group
                heading="Roster"
                className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2"
              >
                {rosterTop.map((p) => (
                  <PaletteItem
                    key={`r-${p.slug}`}
                    value={`roster ${p.name} ${p.current_club ?? ""}`}
                    icon={
                      <PlayerAvatar
                        name={p.name}
                        src={p.image_url}
                        className="h-6 w-6 rounded-full"
                        initialsClassName="text-[10px]"
                      />
                    }
                    label={p.name}
                    hint={p.current_club ?? undefined}
                    onSelect={() => go(`/player/${p.slug}`)}
                  />
                ))}
              </Command.Group>
            )}

            {radarTop.length > 0 && (
              <Command.Group
                heading="Radar"
                className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2"
              >
                {radarTop.map((p) => (
                  <PaletteItem
                    key={`rd-${p.slug}`}
                    value={`radar ${p.name}`}
                    icon={<Sparkles className="h-4 w-4 text-primary" />}
                    label={p.name}
                    hint={p.current_club ?? undefined}
                    onSelect={() => go(`/player/${p.slug}`)}
                  />
                ))}
              </Command.Group>
            )}

            <Command.Group
              heading="Actions"
              className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2"
            >
              <PaletteItem
                value="action newsletter abonner"
                icon={<Send className="h-4 w-4" />}
                label="S'abonner à la newsletter"
                onSelect={() => go("/newsletter")}
              />
              <PaletteItem
                value="action suggerer joueur"
                icon={<Plus className="h-4 w-4" />}
                label="Suggérer un joueur"
                onSelect={() => go("/radar")}
              />
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
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
      {hint && (
        <span className="text-xs text-muted-foreground normal-case tracking-normal truncate max-w-[40%]">
          {hint}
        </span>
      )}
    </Command.Item>
  );
}

export default CommandPalette;
