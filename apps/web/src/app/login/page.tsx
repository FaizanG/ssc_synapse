import { ArrowLeft, LockKeyhole } from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
      <section className="flex flex-col bg-brand-primary-dark px-6 py-8 text-white sm:px-10 lg:px-14">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-white/60 hover:text-brand-gold-bright"
        >
          <ArrowLeft className="size-4" /> Home
        </Link>
        <div className="my-auto max-w-xl py-16">
          <div className="inline-flex rounded-2xl border border-brand-gold/25 bg-white/95 p-3 shadow-2xl shadow-black/20">
            <BrandLogo priority className="h-28 w-auto sm:h-36" />
          </div>
          <h1 className="mt-7 font-display text-4xl font-extrabold leading-tight tracking-[-0.035em] sm:text-5xl">
            One calm command center for every event.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-white/65">
            Secure access to customer, booking, menu, quotation, invoice, and
            operational intelligence.
          </p>
          <div className="mt-10 flex items-center gap-3 text-sm text-white/65">
            <LockKeyhole className="size-4 text-brand-gold-bright" />
            Encrypted sessions and role-based access
          </div>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
          Siddique Sons Caterers
        </p>
      </section>

      <section className="flex items-center justify-center bg-brand-cream px-6 py-16 sm:px-10">
        <div className="w-full max-w-md">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-primary">
            Welcome back
          </p>
          <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-foreground">
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
