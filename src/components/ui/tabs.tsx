"use client";
import { cn } from "@/lib/utils";
import * as React from "react";

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

export interface TabsProps {
  value: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(value);
  React.useEffect(() => setInternalValue(value), [value]);
  const setValue = (v: string) => {
    setInternalValue(v);
    onValueChange?.(v);
  };
  return (
    <TabsContext.Provider value={{ value: internalValue, setValue }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger must be used within Tabs");
  const active = ctx.value === value;
  // Environment-aware active styles
  const envActiveClass =
    value === "DEV"
      ? "bg-blue-50 text-blue-950 border-2 border-blue-600 dark:bg-blue-500/10 dark:text-blue-100 dark:border-blue-400"
      : value === "STAGING"
      ? "bg-amber-50 text-amber-950 border-2 border-amber-600 dark:bg-amber-500/10 dark:text-amber-100 dark:border-amber-400"
      : value === "PROD"
      ? "bg-red-50 text-red-950 border-2 border-red-600 dark:bg-red-500/10 dark:text-red-100 dark:border-red-400"
      : "bg-primary/10 text-foreground border-2 border-primary";
  return (
    <button
      type="button"
      onClick={() => ctx.setValue(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        active ? envActiveClass : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be used within Tabs");
  if (ctx.value !== value) return null;
  return <div className={cn("mt-2", className)}>{children}</div>;
}
