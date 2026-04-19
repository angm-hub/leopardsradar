import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BrowserFrameProps {
  children: ReactNode;
  url?: string;
  theme?: "mac" | "minimal";
  className?: string;
}

export function BrowserFrame({
  children,
  url,
  theme = "mac",
  className,
}: BrowserFrameProps) {
  const displayUrl = url ?? "leopardsradar.com/radar";

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden border border-border bg-card shadow-2xl",
        className,
      )}
    >
      {/* Top bar */}
      <div className="h-10 bg-[#1F1F24] flex items-center px-4 gap-3 border-b border-border">
        {theme === "mac" && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: "#FF5F57" }}
              aria-hidden
            />
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: "#FFBD2E" }}
              aria-hidden
            />
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: "#28C840" }}
              aria-hidden
            />
          </div>
        )}

        {/* URL pill */}
        <div className="flex-1 flex justify-center">
          <div className="bg-background px-4 py-1 rounded-full text-xs text-muted font-mono max-w-[80%] truncate">
            🔒 {displayUrl}
          </div>
        </div>

        {/* Spacer to balance traffic lights */}
        {theme === "mac" && <div className="w-[54px] shrink-0" aria-hidden />}
      </div>

      {/* Content */}
      <div className="relative overflow-hidden bg-background">{children}</div>
    </div>
  );
}

export default BrowserFrame;
