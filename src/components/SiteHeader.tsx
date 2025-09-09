"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function SiteHeaderInner() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const { user, signOut } = useAuth();
  const [query, setQuery] = useState<string>(params.get("q") || "");

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/dashboard?q=${encodeURIComponent(query)}`);
    else router.push("/dashboard");
  };

  const hideNav = pathname === "/login";

  const initials = useMemo(() => {
    if (!user) return "";
    const src = user.displayName || user.email || "";
    const parts = src
      .replace(/[^a-zA-Z ]/g, "")
      .trim()
      .split(" ");
    if (parts.length >= 2)
      return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
    return src.slice(0, 2).toUpperCase();
  }, [user]);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href={user ? "/dashboard" : "/login"}
            className="flex items-center gap-2 font-semibold"
          >
            <Image
              src="/deadline_favicon_64.png"
              alt=""
              aria-hidden
              width={28}
              height={28}
              priority
              sizes="28px"
              className="h-7 w-7 object-contain select-none"
            />
            <span className="text-lg leading-none tracking-tight hidden sm:inline">
              DEADLINE
            </span>
          </Link>
          {!hideNav && (
            <nav className="hidden md:flex items-center gap-4 text-sm">
              {[
                { href: "/dashboard", label: "Dashboard" },
                { href: "/workspaces", label: "Workspaces" },
                { href: "/docs", label: "Docs" },
                { href: "/settings", label: "Settings" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "px-1 py-0.5",
                    pathname?.startsWith(item.href)
                      ? "font-medium text-foreground border-b-2 border-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {!hideNav && (
          <div className="flex items-center gap-3">
            <form onSubmit={onSearch} className="hidden md:block">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-64"
              />
            </form>
            {user ? (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                  {initials || ""}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await signOut();
                    router.push("/login");
                  }}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button asChild size="sm">
                <Link href="/login">Login</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export function SiteHeader() {
  // Wrap route hooks usage with Suspense to satisfy Next.js static bailouts
  return (
    <Suspense fallback={null}>
      <SiteHeaderInner />
    </Suspense>
  );
}
