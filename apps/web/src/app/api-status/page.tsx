import { Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { publicEnvironment } from "@/lib/env";

async function getApiStatus() {
  const internalHost = process.env.API_INTERNAL_HOST;
  const internalPort = process.env.API_INTERNAL_PORT ?? "4000";
  const baseUrl = internalHost
    ? `http://${internalHost}:${internalPort}`
    : publicEnvironment.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, "");
  try {
    const response = await fetch(`${baseUrl}/health/ready`, {
      cache: "no-store",
    });
    return response.ok ? "Operational" : "Unavailable";
  } catch {
    return "Unavailable";
  }
}

export default async function ApiStatusPage() {
  const status = await getApiStatus();
  const operational = status === "Operational";

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl items-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-6 sm:py-16">
      <section className="w-full rounded-[1.5rem] border bg-surface p-5 shadow-xl shadow-brand-primary/5 sm:rounded-[2rem] sm:p-10">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-sm font-semibold text-muted hover:text-brand-primary"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>
        <div className="mt-7 flex items-start gap-3 sm:mt-10 sm:gap-4">
          <div
            className={`grid size-11 shrink-0 place-items-center rounded-2xl sm:size-12 ${operational ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}
          >
            <Activity className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-muted">API readiness</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              {status}
            </h1>
            <p className="mt-3 leading-7 text-muted">
              {operational
                ? "The SSC Synapse API and database are ready to serve requests."
                : "The API is not reachable or is still starting. Check the backend environment and database connection."}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
