"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faUserSecret } from "@fortawesome/free-solid-svg-icons";
import {
  Banknote,
  BarChart3,
  CreditCard,
  Landmark,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  TrendingUp,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { ProfileSwitcher } from "@/components/profile-switcher";
import {
  PrivacyModeProvider,
  usePrivacyMode,
} from "@/components/privacy-mode";
import { cn } from "@/lib/utils";
import type { AppSettings } from "@/types/domain";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/expenses", label: "Spese", icon: CreditCard },
  { href: "/loans", label: "Mutui", icon: Landmark },
  { href: "/incomes", label: "Entrate", icon: Banknote },
  { href: "/investments", label: "Investimenti", icon: TrendingUp },
  { href: "/one-time-payments", label: "Extra", icon: ReceiptText },
  { href: "/settings", label: "Impostazioni", icon: Settings },
];

const brandLogoSrc = "/brand/menu-icon.png";

export function AppShell({
  settings,
  demoMode,
  initialPrivacyMode,
  children,
}: {
  settings: AppSettings;
  demoMode: boolean;
  initialPrivacyMode: boolean;
  children: React.ReactNode;
}) {
  return (
    <PrivacyModeProvider initialEnabled={initialPrivacyMode}>
      <AppShellContent settings={settings} demoMode={demoMode}>
        {children}
      </AppShellContent>
    </PrivacyModeProvider>
  );
}

function AppShellContent({
  settings,
  demoMode,
  children,
}: {
  settings: AppSettings;
  demoMode: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "common";
  const [mobileOpen, setMobileOpen] = useState(false);
  const { enabled: privacyEnabled, toggle: togglePrivacyMode } = usePrivacyMode();

  function hrefWithView(href: string) {
    return `${href}?view=${view}`;
  }

  const sidebarContent = (
    <div className="flex h-full flex-col gap-5 p-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={hrefWithView("/dashboard")}
          className="flex min-w-0 items-center gap-3"
          onClick={() => setMobileOpen(false)}
        >
          <Image src={brandLogoSrc} alt="" width={40} height={40} className="h-10 w-10 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold tracking-normal text-slate-50">Spese Tracker</p>
            <p className="truncate text-sm text-slate-500">Ricorrenti di coppia</p>
          </div>
        </Link>
        <Button
          size="icon"
          variant="ghost"
          type="button"
          aria-label={privacyEnabled ? "Disattiva modalità incognito" : "Attiva modalità incognito"}
          aria-pressed={privacyEnabled}
          title={privacyEnabled ? "Disattiva modalità incognito" : "Attiva modalità incognito"}
          onClick={togglePrivacyMode}
          className={cn(
            "hidden shrink-0 lg:inline-flex",
            privacyEnabled && "bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-300/20",
          )}
        >
          <FontAwesomeIcon
            icon={privacyEnabled ? faUserSecret : faEye}
            className="h-4 w-4"
            aria-hidden
          />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          type="button"
          title="Chiudi menu"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ProfileSwitcher settings={settings} />

      {demoMode ? (
        <div className="rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs leading-5 text-amber-200">
          Demo locale: configura MongoDB per salvare le modifiche.
        </div>
      ) : null}

      <nav className="grid gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={hrefWithView(item.href)}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-50",
                active && "bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-300/20",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <form action={logoutAction} className="mt-auto">
        <Button variant="ghost" type="submit" className="w-full justify-start">
          <LogOut className="h-4 w-4" />
          Esci
        </Button>
      </form>
    </div>
  );

  return (
    <div
      data-privacy-mode={privacyEnabled ? "true" : "false"}
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_28rem),#020617] text-slate-100"
    >
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href={hrefWithView("/dashboard")} className="flex min-w-0 flex-1 items-center gap-3">
            <Image src={brandLogoSrc} alt="" width={36} height={36} className="h-9 w-9 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-50">Spese Tracker</p>
              <p className="truncate text-xs text-slate-500">Ricorrenti di coppia</p>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              type="button"
              aria-label={privacyEnabled ? "Disattiva modalità incognito" : "Attiva modalità incognito"}
              aria-pressed={privacyEnabled}
              title={privacyEnabled ? "Disattiva modalità incognito" : "Attiva modalità incognito"}
              onClick={togglePrivacyMode}
              className={cn(
                privacyEnabled && "bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-300/20",
              )}
            >
              <FontAwesomeIcon
                icon={privacyEnabled ? faUserSecret : faEye}
                className="h-4 w-4"
                aria-hidden
              />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              type="button"
              title="Apri menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Chiudi menu"
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative ml-auto h-dvh w-[min(340px,calc(100vw-2rem))] border-l border-white/10 bg-slate-950 shadow-2xl shadow-black">
            {sidebarContent}
          </aside>
        </div>
      ) : null}

      <div className="lg:grid lg:min-h-screen lg:grid-cols-[296px_1fr]">
        <aside className="sticky top-0 hidden h-dvh border-r border-white/10 bg-slate-950/80 backdrop-blur lg:block">
          {sidebarContent}
        </aside>

        <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
