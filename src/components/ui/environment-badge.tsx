import { cn } from "@/lib/utils";
import { ENV_COLORS, ENV_LABELS, EnvCode } from "@/types";

interface EnvironmentBadgeProps {
  environment: EnvCode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Environment badge component with color coding and accessibility
 *
 * Color scheme:
 * - DEV: Blue
 * - STAGING: Yellow
 * - PROD: Red
 */
export function EnvironmentBadge({
  environment,
  size = "md",
  className,
}: EnvironmentBadgeProps) {
  const colors = ENV_COLORS[environment];
  const label = ENV_LABELS[environment];

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-2.5 py-1.5 text-sm",
    lg: "px-3 py-2 text-base",
  };

  return (
    <span
      className={cn(
        // Base styles
        "inline-flex items-center rounded-full border font-medium",
        // Size variants
        sizeClasses[size],
        // Environment-specific colors
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
      aria-label={`Environment: ${label}`}
    >
      {environment}
    </span>
  );
}
