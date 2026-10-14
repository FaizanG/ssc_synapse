import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";

const capabilities = [
  {
    icon: CalendarDays,
    label: "Event operations",
    copy: "Plan every booking from inquiry to completion.",
  },
  {
    icon: UtensilsCrossed,
    label: "Menu intelligence",
    copy: "Create grounded menus with deterministic costing.",
  },
  {
    icon: ChartNoAxesCombined,
    label: "Financial clarity",
    copy: "Track quotations, invoices, collections, and margin.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-10">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          aria-label="SSC Synapse home"
          className="rounded-xl px-1 py-1 transition hover:bg-brand-gold-soft/60"
        >
          <BrandLogo priority className="h-20 w-auto sm:h-24" />
        </Link>
        <Button asChild variant="secondary" size="sm">
          <Link href="/login">Sign in</Link>
        </Button>
      </header>

      <section className="grid flex-1 items-center gap-16 py-20 lg:grid-cols-[1.08fr_0.92fr]">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold-soft px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">
            <span className="size-1.5 rounded-full bg-brand-gold" />
            Catering intelligence, connected
          </div>
          <h1 className="max-w-4xl font-display text-5xl font-extrabold leading-[1.04] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-7xl">
            Run remarkable events with sharper decisions.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-muted">
            One secure workspace for customers, events, AI-assisted menus,
            quotations, invoices, and the operational detail behind every
            celebration.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/login">
                Enter workspace{" "}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/api-status">Check system status</Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-brand-gold-soft via-brand-primary-soft to-transparent blur-2xl" />
          <div className="overflow-hidden rounded-[2rem] border border-brand-gold/20 bg-surface/90 p-3 shadow-2xl shadow-brand-primary/10 backdrop-blur">
            <div className="rounded-[1.5rem] bg-brand-primary-dark p-7 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gold-bright">
                    Foundation status
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-bold">
                    Ready for the first workflow
                  </h2>
                </div>
                <div className="grid size-14 place-items-center rounded-2xl bg-white/10 p-2">
                  <BrandLogo compact decorative className="size-full" />
                </div>
              </div>
              <div className="mt-8 grid gap-3">
                {capabilities.map(({ icon: Icon, label, copy }) => (
                  <div
                    key={label}
                    className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4"
                  >
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-gold/15 text-brand-gold-bright">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{label}</h3>
                      <p className="mt-1 text-sm leading-6 text-white/65">
                        {copy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="flex flex-col gap-2 border-t border-border py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BrandLogo compact decorative className="size-7" />
          <p>SSC Synapse · AI-powered catering and event intelligence</p>
        </div>
        <p>Secure by design · Human-approved operations</p>
      </footer>
    </main>
  );
}
