import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  options: SelectOption[];
}

export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <label className={cn("relative inline-flex items-center", className)}>
      {label ? (
        <span className="sr-only">{label}</span>
      ) : null}
      <select
        {...props}
        className={cn(
          "appearance-none bg-card border border-border text-foreground",
          "rounded-button pl-4 pr-10 py-2 text-sm cursor-pointer",
          "hover:border-border-hover focus:border-primary focus:outline-none",
          "transition-colors",
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-card text-foreground">
            {label ? `${label} : ${opt.label}` : opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-muted" />
    </label>
  );
}

export default Select;
