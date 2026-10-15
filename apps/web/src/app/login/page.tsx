import { ArrowLeft, LockKeyhole } from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[0.92fr_1.08fr]">
      <section className="flex min-w-0 flex-col bg-brand-primary-dark px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] text-white sm:px-8 sm:py-10 lg:px-14 lg:py-8">
        <Link
          href="/"
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg pr-3 text-sm font-semibold text-white/65 hover:text-brand-gold-bright"
        >
          <ArrowLeft className="size-4" /> Home
        </Link>
        <div className="my-7 min-w-0 max-w-xl py-1 sm:my-10 sm:py-4 lg:my-auto lg:py-16">
          <div className="inline-flex max-w-full rounded-2xl border border-brand-gold/25 bg-white/95 p-2.5 shadow-2xl shadow-black/20 sm:p-3">
            <BrandLogo
              priority
              className="h-20 w-auto max-w-full sm:h-28 lg:h-36"
            />
          </div>
          <h1 className="mt-6 font-display text-3xl font-extrabold leading-tight tracking-[-0.035em] sm:mt-7 sm:text-4xl lg:text-5xl">
            One calm command center for every event.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-white/65 sm:mt-5 sm:text-lg sm:leading-8">
            Secure access to customer, booking, menu, quotation, invoice, and
            operational intelligence.
          </p>
          <div className="mt-6 flex items-start gap-3 text-sm leading-6 text-white/65 sm:mt-10 sm:items-center">
            <LockKeyhole className="mt-1 size-4 shrink-0 text-brand-gold-bright sm:mt-0" />
            Encrypted sessions and role-based access
          </div>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
          Siddique Sons Caterers
        </p>
      </section>

      <section className="flex min-w-0 items-center justify-center bg-brand-cream px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-10 sm:px-10 sm:py-16">
        <div className="w-full max-w-md">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-primary">
            Welcome back
          </p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Sign in to Synapse
          </h2>
          <p className="mt-3 leading-7 text-muted">
            Use the account provided by your business administrator.
          </p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
