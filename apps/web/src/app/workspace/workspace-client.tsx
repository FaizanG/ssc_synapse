"use client";

import {
  CalendarDays,
  ChevronRight,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  ReceiptText,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api-client";

type SessionProfile = {
  user: { id: string; email: string; fullName: string };
  business: { id: string; slug: string; name: string };
  membership: {
    id: string;
    roles: Array<{ id: string; key: string; name: string }>;
  };
  permissions: string[];
};

const nextModules = [
  {
    name: "Invoices",
    description: "Create, calculate, issue, and print customer invoices",
    icon: ReceiptText,
    href: "/workspace/invoices" as const,
  },
  {
    name: "Customers",
    description: "Customer records and relationship history",
    icon: Users,
  },
  {
    name: "Events & bookings",
    description: "Inquiries, calendars, and event lifecycles",
    icon: CalendarDays,
  },
];

export function WorkspaceClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<SessionProfile>();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    apiRequest<SessionProfile>("/auth/me")
      .then((current) => {
        if (active) setProfile(current);
      })
      .catch(() => {
        if (active) router.replace("/login");
      });
    return () => {
      active = false;
    };
  }, [router]);

  async function signOut() {
    setSigningOut(true);
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  if (!profile) {
    return (
      <main className="grid min-h-dvh place-items-center bg-brand-cream px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        <div
          className="flex items-center gap-3 text-sm font-semibold text-muted"
          role="status"
        >
          <LoaderCircle className="size-5 animate-spin text-brand-primary" />
          Verifying your secure workspace…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-brand-cream px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex items-center justify-between gap-3 rounded-[1.25rem] border bg-surface px-4 py-3 shadow-sm sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="min-w-0 rounded-xl px-1 py-1">
              <BrandLogo priority className="h-12 w-auto max-w-full sm:h-16" />
            </div>
            <p className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-muted md:block">
              {profile.business.name}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-foreground">
                {profile.user.fullName}
              </p>
              <p className="text-xs text-muted">
                {profile.membership.roles.map((role) => role.name).join(", ")}
              </p>
            </div>
            <Button
              className="h-11 px-3 sm:px-5"
              variant="secondary"
              onClick={signOut}
              disabled={signingOut}
              aria-label="Sign out"
            >
              {signingOut ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              <span className="hidden min-[380px]:inline">Sign out</span>
            </Button>
          </div>
        </header>

        <section className="mt-5 grid min-w-0 gap-4 sm:mt-8 sm:gap-5 lg:grid-cols-[1.4fr_1fr]">
          <article className="min-w-0 rounded-2xl border bg-surface p-5 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-brand-gold-soft text-brand-primary">
                <LayoutDashboard className="size-5" />
              </div>
              <span className="rounded-full bg-brand-primary-soft px-3 py-1 text-xs font-bold text-brand-primary">
                Foundation active
              </span>
            </div>
            <h1 className="mt-7 max-w-xl font-display text-2xl font-extrabold tracking-tight sm:mt-8 sm:text-4xl">
              Welcome back, {profile.user.fullName.split(" ")[0]}.
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-muted">
              Your secure business workspace is connected to the live SSC
              Synapse API. Customer and event workflows are the next vertical
              slice.
            </p>
            <div className="mt-7 flex items-start gap-3 rounded-xl border border-brand-gold/25 bg-brand-gold-soft px-4 py-3 text-sm leading-6 text-brand-primary sm:mt-8 sm:items-center">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-gold sm:mt-0" />
              <span>
                {profile.permissions.length} permissions active for this session
              </span>
            </div>
          </article>

          <aside className="min-w-0 rounded-2xl bg-brand-primary-dark p-5 text-white shadow-xl shadow-brand-primary/10 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-gold-bright">
              Business tools
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold">
              Run the next workflow
            </h2>
            <div className="mt-6 space-y-3">
              {nextModules.map((module) => {
                const Icon = module.icon;
                const content = (
                  <>
                    <Icon className="size-5 shrink-0 text-brand-gold-bright" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{module.name}</p>
                      <p className="mt-1 text-xs leading-5 text-white/60">
                        {module.description}
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-white/35" />
                  </>
                );
                return module.href ? (
                  <Link
                    key={module.name}
                    href={module.href}
                    className="flex min-h-16 items-center gap-3 rounded-xl border border-brand-gold/25 bg-white/10 p-3.5 transition hover:border-brand-gold/55 hover:bg-white/[0.14] sm:p-4"
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    key={module.name}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 opacity-70 sm:p-4"
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
