import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("ui-card rounded-lg border border-border bg-card text-card-foreground shadow-sm", className)} {...props} />;
}

export function CardHeader({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-card-header flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className = "", ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("ui-card-title text-base font-semibold tracking-tight", className)} {...props} />;
}

export function CardDescription({ className = "", ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("ui-card-description text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-card-content p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-card-footer flex items-center p-6 pt-0", className)} {...props} />;
}
