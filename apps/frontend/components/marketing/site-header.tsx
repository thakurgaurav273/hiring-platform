"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { PlatformLockup } from "@/components/brand";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/#features", label: "Product" },
  { href: "/#workflow", label: "Roles" },
  { href: "/#playground", label: "Brand playground" },
  { href: "/#security", label: "Trust" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  // Auth state lives in localStorage; render the signed-out variant until mounted
  // so server and client markup match.
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => setMounted(true), []);
  const signedIn = mounted && isAuthenticated;

  const primary = signedIn ? { href: "/dashboard", label: "Open dashboard" } : { href: "/login", label: "Sign in" };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Link href="/" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40" aria-label="Robin Talent home">
          <PlatformLockup />
        </Link>

        <nav aria-label="Primary" className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-[13.5px] font-medium text-muted-foreground transition hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href={primary.href}
            className="hidden h-9 items-center rounded-[var(--radius-control)] bg-primary px-4 text-[13.5px] font-semibold text-primary-foreground transition hover:bg-primary-hover sm:inline-flex"
          >
            {primary.label}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <nav
        id="mobile-nav"
        aria-label="Mobile"
        className={cn("border-t border-border bg-background px-5 py-3 md:hidden", open ? "block" : "hidden")}
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className="block rounded-md px-2 py-2.5 text-[14px] font-medium text-foreground hover:bg-secondary"
          >
            {item.label}
          </Link>
        ))}
        <Link
          href={primary.href}
          className="mt-2 flex h-10 items-center justify-center rounded-[var(--radius-control)] bg-primary text-[14px] font-semibold text-primary-foreground"
        >
          {primary.label}
        </Link>
      </nav>
    </header>
  );
}
