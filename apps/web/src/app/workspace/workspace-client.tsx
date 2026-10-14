"use client";

import {
  CalendarDays,
  ChevronRight,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
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
      <main className="grid min-h-screen place-items-center bg-slate-100">
        <div
          className="flex items-center gap-3 text-sm font-semibold text-slate-600"
          role="status"
        >
          <LoaderCircle className="size-5 animate-spin text-indigo-600" />
          Verifying your secure workspace…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 rounded-2xl border bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-[#f3f0e6] px-2 py-1">
              <BrandLogo priority className="h-14 w-auto sm:h-16" />
            </div>
            <p className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 md:block">
              {profile.business.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-slate-900">
                {profile.user.fullName}
              </p>
              <p className="text-xs text-slate-500">
                {profile.membership.roles.map((role) => role.name).join(", ")}
              </p>
            </div>
            <Button variant="secondary" onClick={signOut} disabled={signingOut}>
              {signingOut ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              Sign out
            </Button>
          </div>
        </header>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <article className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between">
              <div className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <LayoutDashboard className="size-5" />
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                Foundation active
              </span>
            </div>
            <h1 className="mt-8 max-w-xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Welcome back, {profile.user.fullName.split(" ")[0]}.
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Your secure business workspace is connected to the live SSC
              Synapse API. Customer and event workflows are the next vertical
              slice.
            </p>
            <div className="mt-8 flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm text-indigo-900">
              <ShieldCheck className="size-5 shrink-0 text-indigo-600" />
              <span>
                {profile.permissions.length} permissions active for this session
              </span>
            </div>
          </article>

          <aside className="rounded-2xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-300">
              Next vertical slice
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold">
              CRM and event intake
            </h2>
            <div className="mt-6 space-y-3">
              {nextModules.map((module) => {
                const Icon = module.icon;
                return (
                  <div
                    key={module.name}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <Icon className="size-5 shrink-0 text-indigo-300" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{module.name}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {module.description}
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-slate-500" />
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
