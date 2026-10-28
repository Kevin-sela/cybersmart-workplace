import * as React from "react";

import { cn } from "@/lib/utils";

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & { value: number; label: string; className?: string };

export function Progress({ value, label, className = "", ...props }: ProgressProps) {
  const boundedValue = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={boundedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <span
        className="block h-full rounded-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${boundedValue}%` }}
      />
    </div>
  );
}
