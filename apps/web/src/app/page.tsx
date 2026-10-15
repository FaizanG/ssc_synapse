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
    <main className="mx-auto flex min-h-dvh max-w-7xl flex-col overflow-hidden px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:py-8 lg:px-10">
      <header className="flex items-center justify-between gap-3">
        <Link
          href="/"
          aria-label="SSC Synapse home"
          className="min-w-0 rounded-xl px-1 py-1 transition hover:bg-brand-gold-soft/60"
        >
          <BrandLogo priority className="h-16 w-auto max-w-full sm:h-24" />
        </Link>
        <Button
          asChild
          variant="secondary"
          size="sm"
          className="h-11 shrink-0 px-4 sm:h-9 sm:px-3"
        >
          <Link href="/login">Sign in</Link>
        </Button>
      </header>

      <section className="grid min-w-0 flex-1 items-center gap-10 py-12 sm:gap-14 sm:py-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:py-20">
        <div className="min-w-0">
          <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold-soft px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-brand-primary sm:mb-7 sm:text-xs sm:tracking-[0.16em]">
            <span className="size-1.5 rounded-full bg-brand-gold" />
            Catering intelligence, connected
          </div>
          <h1 className="max-w-4xl font-display text-4xl font-extrabold leading-[1.04] tracking-[-0.04em] text-foreground sm:text-6xl lg:text-7xl lg:tracking-[-0.045em]">
            Run remarkable events with sharper decisions.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:mt-7 sm:text-lg sm:leading-8">
            One secure workspace for customers, events, AI-assisted menus,
            quotations, invoices, and the operational detail behind every
            celebration.
          </p>
          <div className="mt-8 grid gap-3 sm:mt-9 sm:flex sm:flex-wrap">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/login">
                Enter workspace{" "}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="w-full sm:w-auto"
            >
              <Link href="/api-status">Check system status</Link>
            </Button>
          </div>
        </div>

        <div className="relative min-w-0">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-gold-soft via-brand-primary-soft to-transparent blur-2xl sm:-inset-8 sm:rounded-[3rem]" />
          <div className="overflow-hidden rounded-[1.5rem] border border-brand-gold/20 bg-surface/90 p-2 shadow-2xl shadow-brand-primary/10 backdrop-blur sm:rounded-[2rem] sm:p-3">
            <div className="rounded-[1.125rem] bg-brand-primary-dark p-5 text-white sm:rounded-[1.5rem] sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gold-bright">
                    Foundation status
                  </p>
                  <h2 className="mt-2 font-display text-xl font-bold sm:text-2xl">
                    Ready for the first workflow
                  </h2>
                </div>
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 p-2 sm:size-14">
                  <BrandLogo compact decorative className="size-full" />
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:mt-8">
                {capabilities.map(({ icon: Icon, label, copy }) => (
                  <div
                    key={label}
                    className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 sm:gap-4 sm:p-4"
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

      <footer className="flex flex-col gap-3 border-t border-border py-5 text-sm leading-6 text-muted sm:flex-row sm:items-center sm:justify-between sm:py-6">
        <div className="flex items-start gap-2 sm:items-center">
          <BrandLogo
            compact
            decorative
            className="mt-0.5 size-7 shrink-0 sm:mt-0"
          />
          <p>SSC Synapse · AI-powered catering and event intelligence</p>
        </div>
        <p>Secure by design · Human-approved operations</p>
      </footer>
    </main>
  );
}
