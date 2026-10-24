import { CalendarDays, MapPin, UsersRound } from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";

import {
  type InvoiceDraft,
  type InvoiceTotals,
  formatMoney,
} from "./invoice-types";

type InvoicePreviewProps = {
  businessName: string;
  draft: InvoiceDraft;
  totals: InvoiceTotals;
  authoritative?: boolean;
};

function displayDate(value: string) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function detailValue(value: string | number | undefined) {
  return value === "" || value === undefined ? "—" : value;
}

export function InvoicePreview({
  businessName,
  draft,
  totals,
  authoritative = false,
}: InvoicePreviewProps) {
  return (
    <article
      id="invoice-print-area"
      className="invoice-document overflow-hidden rounded-[1.75rem] border border-[#ead9c9] bg-[#fff9f1] text-[#35231d] shadow-2xl shadow-[#5e2119]/10"
    >
      <div className="px-5 py-7 sm:px-9 sm:py-9 lg:px-11">
        <header className="grid items-start gap-7 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="font-serif text-base font-semibold leading-tight text-[#6f4c40] sm:text-lg">
              Premium Catering
              <br />
              &amp; Event Service
            </p>
            <h2 className="mt-7 font-serif text-5xl leading-none tracking-[-0.055em] text-[#4a2c22] sm:mt-10 sm:text-7xl lg:text-[5.5rem]">
              INVOICE
            </h2>
          </div>
          <div className="flex items-start justify-between gap-5 sm:block sm:text-right">
            <BrandLogo
              priority
              className="h-20 w-auto max-w-[12rem] sm:ml-auto sm:h-24"
            />
            <div className="mt-3 sm:mt-5">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.16em] ${
                  draft.status === "ISSUED"
                    ? "bg-[#e5f1df] text-[#37612d]"
                    : "bg-[#f7ddc7] text-[#7d3827]"
                }`}
              >
                {draft.status === "ISSUED" ? "Issued" : "Draft"}
              </span>
              <p className="mt-2 text-xs font-semibold text-[#82685d]">
                {draft.invoiceNumber ?? "Number assigned on issue"}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-7 rounded-[1.4rem] bg-[#f7cdb8] px-5 py-6 sm:mt-10 sm:grid-cols-2 sm:px-7 sm:py-7">
          <div>
            <h3 className="font-serif text-2xl font-bold">Event details</h3>
            <dl className="mt-3 space-y-2 text-sm leading-5">
              <div className="flex gap-2">
                <UsersRound className="mt-0.5 size-4 shrink-0 opacity-60" />
                <dt className="w-24 shrink-0 font-semibold">Guests</dt>
                <dd>{detailValue(draft.guestCount)}</dd>
              </div>
              <div className="flex gap-2">
                <CalendarDays className="mt-0.5 size-4 shrink-0 opacity-60" />
                <dt className="w-24 shrink-0 font-semibold">Event date</dt>
                <dd>{displayDate(draft.eventDate)}</dd>
              </div>
              <div className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 opacity-60" />
                <dt className="w-24 shrink-0 font-semibold">Venue</dt>
                <dd className="min-w-0 break-words">
                  {detailValue(draft.venue)}
                </dd>
              </div>
              <div className="flex gap-2">
                <span className="w-4 shrink-0" />
                <dt className="w-24 shrink-0 font-semibold">Package</dt>
                <dd>{detailValue(draft.menuPackage)}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="font-serif text-2xl font-bold">Bill to</h3>
            <dl className="mt-3 grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-2 text-sm leading-5">
              <dt className="font-semibold">Client</dt>
              <dd className="break-words">{detailValue(draft.customerName)}</dd>
              <dt className="font-semibold">Phone</dt>
              <dd>{detailValue(draft.customerPhone)}</dd>
              <dt className="font-semibold">Event</dt>
              <dd>{detailValue(draft.eventType)}</dd>
              <dt className="font-semibold">Invoice date</dt>
              <dd>{displayDate(draft.issueDate)}</dd>
              <dt className="font-semibold">Due date</dt>
              <dd>{displayDate(draft.dueDate)}</dd>
            </dl>
          </div>
        </section>

        <section className="mt-8">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-y border-[#e7cbbd]">
                  <th className="py-3 pr-4 font-bold">Description</th>
                  <th className="px-3 py-3 font-bold">Package / item</th>
                  <th className="px-3 py-3 text-right font-bold">Qty</th>
                  <th className="px-3 py-3 text-right font-bold">Unit price</th>
                  <th className="py-3 pl-3 text-right font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {draft.items.map((item, index) => (
                  <tr key={item.id ?? index} className="align-top">
                    <td className="py-3 pr-4 font-medium">
                      {item.description || "New item"}
                    </td>
                    <td className="px-3 py-3 text-[#765e54]">
                      {item.category || "—"}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {item.quantity || "0"} {item.unit}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {formatMoney(item.unitPrice, draft.currency)}
                    </td>
                    <td className="py-3 pl-3 text-right font-semibold tabular-nums">
                      {formatMoney(
                        totals.lineTotals[index] ?? 0,
                        draft.currency,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ml-auto mt-5 w-full max-w-sm border-t border-[#e7cbbd] pt-3">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="font-semibold">Subtotal</dt>
                <dd className="font-bold tabular-nums">
                  {formatMoney(totals.subtotalAmount, draft.currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="font-semibold">
                  Service charge ({draft.serviceChargeRate || "0"}%)
                </dt>
                <dd className="font-bold tabular-nums">
                  {formatMoney(totals.serviceChargeAmount, draft.currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="font-semibold">Tax ({draft.taxRate || "0"}%)</dt>
                <dd className="font-bold tabular-nums">
                  {formatMoney(totals.taxAmount, draft.currency)}
                </dd>
              </div>
              <div className="flex items-end justify-between gap-4 border-t border-[#d5b6a5] pt-4">
                <dt className="font-serif text-2xl font-bold">Grand total</dt>
                <dd className="text-xl font-black tabular-nums text-[#681b1a]">
                  {formatMoney(totals.totalAmount, draft.currency)}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-right text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#94786c]">
              {authoritative
                ? "Calculated and saved by SSC Synapse"
                : "Live estimate · save for authoritative totals"}
            </p>
          </div>
        </section>
      </div>

      <footer className="m-4 mt-0 grid gap-6 rounded-[1.4rem] bg-[#f7cdb8] px-5 py-6 sm:m-6 sm:mt-0 sm:grid-cols-[1.4fr_0.6fr] sm:px-7 sm:py-7 lg:m-8 lg:mt-0">
        <div className="space-y-5">
          <div>
            <h3 className="font-serif text-2xl font-bold">Payment terms</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-6">
              {draft.paymentTerms || "Payment terms will appear here."}
            </p>
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold">Notes</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-6">
              {draft.notes || "Thank you for choosing us."}
            </p>
          </div>
        </div>
        <div className="flex min-h-32 items-center justify-center rounded-2xl border border-[#6f4c40]/45 px-5 text-center">
          <div>
            <BrandLogo compact decorative className="mx-auto size-12" />
            <p className="mt-2 font-serif text-lg font-bold">{businessName}</p>
            <p className="mt-1 text-xs text-[#765e54]">
              Crafted with care for remarkable events
            </p>
          </div>
        </div>
      </footer>
    </article>
  );
}
