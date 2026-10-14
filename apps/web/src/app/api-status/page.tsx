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
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section className="w-full rounded-[2rem] border bg-white p-8 shadow-xl shadow-slate-900/5 sm:p-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>
        <div className="mt-10 flex items-start gap-4">
          <div
            className={`grid size-12 place-items-center rounded-2xl ${operational ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}
          >
            <Activity className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">
              API readiness
            </p>
            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
              {status}
            </h1>
            <p className="mt-3 leading-7 text-slate-600">
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
