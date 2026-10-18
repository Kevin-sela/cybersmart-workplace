import type { HTMLAttributes } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "muted" | "success" };

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  return <span className={`ui-badge ui-badge-${variant} ${className}`} {...props} />;
}
