import { cn } from "@/lib/utils";
import * as React from "react";

export function Card({
  className,
  accent,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  accent?: "brand" | "amber" | "rose" | "sky";
}) {
  const accentClasses: Record<string, string> = {
    brand:
      "before:bg-gradient-to-r before:from-brand-500 before:to-brand-700",
    amber:
      "before:bg-gradient-to-r before:from-amber-300 before:to-amber-500",
    rose: "before:bg-gradient-to-r before:from-rose-400 before:to-rose-600",
    sky: "before:bg-gradient-to-r before:from-sky-400 before:to-sky-600",
  };

  return (
    <div
      className={cn(
        "relative rounded-xl border border-ink-200 bg-white",
        "shadow-[0_1px_2px_rgba(20,15,8,0.04),0_4px_12px_rgba(20,15,8,0.04)]",
        "overflow-hidden",
        accent && [
          "before:absolute before:top-0 before:inset-x-0 before:h-[3px]",
          accentClasses[accent],
        ],
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-5 py-4 border-b border-ink-100 flex items-start justify-between gap-3",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-[13.5px] font-semibold text-ink-900 tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-[12px] text-ink-500 mt-0.5 leading-relaxed", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-5 py-3 border-t border-ink-100 text-[12px] text-ink-500",
        className,
      )}
      {...props}
    />
  );
}

/** Label/value pair used inside cards. */
export function Field({
  label,
  value,
  className,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
  mono?: boolean;
}) {
  return (
    <div className={className}>
      <div className="text-[10.5px] font-medium text-ink-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div
        className={cn(
          "text-[13.5px] text-ink-900",
          mono && "font-mono tabular",
        )}
      >
        {value}
      </div>
    </div>
  );
}
