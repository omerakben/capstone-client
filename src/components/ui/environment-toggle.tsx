"use client";
import { cn } from "@/lib/utils";
import { ENV_COLORS, EnvCode } from "@/types";

interface EnvironmentToggleProps {
  env: EnvCode;
  checked: boolean;
  onChange: (next: boolean) => void;
  className?: string;
  size?: "sm" | "md";
}

// Minimal animated toggle styled using ENV_COLORS mapping
export function EnvironmentToggle({
  env,
  checked,
  onChange,
  className,
  size = "md",
}: EnvironmentToggleProps) {
  const colors = ENV_COLORS[env];
  const trackClasses = size === "sm" ? "h-5 w-10" : "h-6 w-12";
  const knobClasses = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border px-3 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 hover:shadow-sm",
        colors.border,
        checked ? colors.bg : "bg-muted",
        className
      )}
    >
      <span
        className={cn(
          "text-xs font-medium select-none",
          checked ? colors.text : "text-muted-foreground"
        )}
      >
        {env}
      </span>
      <span
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors ring-1 ring-transparent group-hover:ring-border",
          trackClasses,
          checked ? colors.bg : "bg-muted"
        )}
      >
        <span
          className={cn(
            "absolute left-0 top-0 flex items-center justify-center rounded-full bg-background shadow ring-1 ring-border transition-transform",
            knobClasses,
            checked ? "translate-x-full" : "translate-x-0"
          )}
        />
      </span>
    </button>
  );
}
