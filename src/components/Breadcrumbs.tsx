"use client";

import Link from "next/link";

export interface CrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export function Breadcrumbs({ items }: { items: CrumbItem[] }) {
  if (!items?.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
      <ol className="flex items-center gap-1">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <span className="text-muted-foreground">/</span>}
            {item.href && !item.current ? (
              <Link href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

