"use client";

import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleDollarSign,
  FilePenLine,
  FileText,
  LoaderCircle,
  Plus,
  Printer,
  ReceiptText,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  useEffect,
  useMemo,
  useState,
} from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { ApiError, apiRequest } from "@/lib/api-client";

import { InvoicePreview } from "./invoice-preview";
import {
  EMPTY_ITEM,
  type Invoice,
  type InvoiceDraft,
  type InvoiceItem,
  calculateDraftTotals,
  createEmptyDraft,
  formatMoney,
  invoiceToDraft,
} from "./invoice-types";

type SessionProfile = {
  user: { id: string; email: string; fullName: string };
  business: { id: string; slug: string; name: string };
  membership: {
    id: string;
    roles: Array<{ id: string; key: string; name: string }>;
  };
  permissions: string[];
};

type View = "list" | "editor" | "preview";

const inputClass =
  "mt-2 h-11 w-full rounded-xl border bg-white px-3 text-base text-foreground outline-none transition placeholder:text-muted/55 focus:border-brand-gold focus:ring-4 focus:ring-brand-gold-soft";

function Field({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-foreground">
      {label}
      {hint ? (
        <span className="ml-1 font-normal text-muted">{hint}</span>
      ) : null}
      <input className={inputClass} {...props} />
    </label>
  );
}

function TextAreaField({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block text-sm font-semibold text-foreground">
      {label}
      <textarea
        className="mt-2 min-h-28 w-full resize-y rounded-xl border bg-white px-3 py-3 text-base leading-6 text-foreground outline-none transition placeholder:text-muted/55 focus:border-brand-gold focus:ring-4 focus:ring-brand-gold-soft"
        {...props}
      />
    </label>
  );
}

function displayDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function InvoiceClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<SessionProfile>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [view, setView] = useState<View>("list");
  const [draft, setDraft] = useState<InvoiceDraft>(() => createEmptyDraft());
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [confirmIssue, setConfirmIssue] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const totals = useMemo(() => calculateDraftTotals(draft), [draft]);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest<SessionProfile>("/auth/me"),
      apiRequest<Invoice[]>("/invoices"),
    ])
      .then(([currentProfile, records]) => {
        if (!active) return;
        setProfile(currentProfile);
        setInvoices(records);
      })
      .catch(() => {
        if (active) router.replace("/login");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  function clearMessages() {
    setError(undefined);
    setNotice(undefined);
  }

  function newInvoice() {
    clearMessages();
    setDraft(createEmptyDraft());
    setDirty(false);
    setView("editor");
  }

  function openInvoice(invoice: Invoice, nextView: View) {
    clearMessages();
    setDraft(invoiceToDraft(invoice));
    setDirty(false);
    setView(nextView);
  }

  function updateDraft<K extends keyof InvoiceDraft>(
    key: K,
    value: InvoiceDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    setDirty(true);
    clearMessages();
  }

  function updateItem<K extends keyof InvoiceItem>(
    index: number,
    key: K,
    value: InvoiceItem[K],
  ) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
    setDirty(true);
    clearMessages();
  }

  function addItem() {
    setDraft((current) => ({
      ...current,
      items: [...current.items, { ...EMPTY_ITEM }],
    }));
    setDirty(true);
  }

  function removeItem(index: number) {
    if (draft.items.length === 1) return;
    setDraft((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
    setDirty(true);
  }

  function validateDraft() {
    if (!draft.customerName.trim()) return "Enter the customer name.";
    if (draft.items.length === 0) return "Add at least one invoice item.";
    if (!/^[A-Z]{3}$/.test(draft.currency.trim().toUpperCase())) {
      return "Currency must use a three-letter code such as PKR.";
    }
    for (const [index, item] of draft.items.entries()) {
      if (!item.description.trim()) {
        return `Enter a description for item ${index + 1}.`;
      }
      if (!(Number(item.quantity) > 0)) {
        return `Quantity for item ${index + 1} must be greater than zero.`;
      }
      if (
        Number(item.unitPrice) < 0 ||
        !Number.isFinite(Number(item.unitPrice))
      ) {
        return `Enter a valid price for item ${index + 1}.`;
      }
    }
    if (draft.issueDate && draft.dueDate && draft.dueDate < draft.issueDate) {
      return "Due date cannot be before the invoice date.";
    }
    return undefined;
  }

  function optional(value: string) {
    return value.trim() || undefined;
  }

  function payload() {
    return {
      customerName: draft.customerName.trim(),
      customerPhone: optional(draft.customerPhone),
      customerEmail: optional(draft.customerEmail),
      billingAddress: optional(draft.billingAddress),
      eventType: optional(draft.eventType),
      eventDate: optional(draft.eventDate),
      venue: optional(draft.venue),
      guestCount: draft.guestCount ? Number(draft.guestCount) : undefined,
      menuPackage: optional(draft.menuPackage),
      type: draft.type,
      currency: draft.currency.trim().toUpperCase(),
      issueDate: optional(draft.issueDate),
      dueDate: optional(draft.dueDate),
      serviceChargeRate: draft.serviceChargeRate || "0",
      taxRate: draft.taxRate || "0",
      paymentTerms: optional(draft.paymentTerms),
      notes: optional(draft.notes),
      items: draft.items.map((item) => ({
        description: item.description.trim(),
        category: optional(item.category),
        quantity: item.quantity,
        unit: optional(item.unit),
        unitPrice: item.unitPrice || "0",
      })),
    };
  }

  function replaceInvoice(saved: Invoice) {
    setInvoices((current) => {
      const exists = current.some((invoice) => invoice.id === saved.id);
      return exists
        ? current.map((invoice) => (invoice.id === saved.id ? saved : invoice))
        : [saved, ...current];
    });
  }

  async function persistDraft() {
    const validationMessage = validateDraft();
    if (validationMessage) {
      setError(validationMessage);
      return undefined;
    }
    setSaving(true);
    clearMessages();
    try {
      const saved = await apiRequest<Invoice>(
        draft.id ? `/invoices/${draft.id}` : "/invoices",
        {
          method: draft.id ? "PATCH" : "POST",
          body: JSON.stringify(payload()),
        },
      );
      replaceInvoice(saved);
      setDraft(invoiceToDraft(saved));
      setDirty(false);
      setNotice(draft.id ? "Invoice changes saved." : "Invoice draft created.");
      return saved;
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "The invoice could not be saved.",
      );
      return undefined;
    } finally {
      setSaving(false);
    }
  }

  async function issueInvoice() {
    setConfirmIssue(false);
    setIssuing(true);
    clearMessages();
    try {
      let invoiceId = draft.id;
      if (dirty || !invoiceId) {
        const saved = await persistDraft();
        if (!saved) return;
        invoiceId = saved.id;
      }
      if (!invoiceId) return;
      const issued = await apiRequest<Invoice>(`/invoices/${invoiceId}/issue`, {
        method: "POST",
        body: JSON.stringify({
          issueDate: draft.issueDate || undefined,
          dueDate: draft.dueDate || undefined,
        }),
      });
      replaceInvoice(issued);
      setDraft(invoiceToDraft(issued));
      setDirty(false);
      setNotice(`${issued.invoiceNumber} was issued successfully.`);
      setView("preview");
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "The invoice could not be issued.",
      );
    } finally {
      setIssuing(false);
    }
  }

  if (loading || !profile) {
    return (
      <main className="grid min-h-dvh place-items-center bg-brand-cream px-4">
        <div className="flex items-center gap-3 text-sm font-semibold text-muted">
          <LoaderCircle className="size-5 animate-spin text-brand-primary" />
          Loading invoices…
        </div>
      </main>
    );
  }

  const issuedInvoices = invoices.filter(
    (invoice) => invoice.status === "ISSUED",
  );
  const issuedTotal = issuedInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.totalAmount),
    0,
  );
  const draftCount = invoices.filter(
    (invoice) => invoice.status === "DRAFT",
  ).length;
  const canIssue = profile.permissions.includes("invoices.issue");

  return (
    <main className="min-h-dvh bg-brand-cream px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="print-hidden flex items-center justify-between gap-3 rounded-[1.25rem] border bg-surface px-4 py-3 shadow-sm sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <BrandLogo
              priority
              className="h-11 w-auto max-w-[9rem] sm:h-14 sm:max-w-none"
            />
            <div className="hidden h-8 w-px bg-border sm:block" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-primary">
                Finance workspace
              </p>
              <h1 className="truncate font-display text-lg font-extrabold sm:text-xl">
                Invoices
              </h1>
            </div>
          </div>
          <Button onClick={newInvoice} className="h-11 shrink-0 px-3 sm:px-5">
            <Plus className="size-4" />
            <span className="hidden min-[390px]:inline">New invoice</span>
          </Button>
        </header>

        {view === "list" ? (
          <InvoiceList
            invoices={invoices}
            issuedTotal={issuedTotal}
            draftCount={draftCount}
            onNew={newInvoice}
            onOpen={(invoice) => openInvoice(invoice, "preview")}
            onEdit={(invoice) => openInvoice(invoice, "editor")}
          />
        ) : (
          <div className="mt-4 sm:mt-6">
            <div className="print-hidden mb-4 flex flex-col gap-3 rounded-2xl border bg-surface p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="flex min-w-0 items-center gap-2">
                <Button
                  variant="ghost"
                  className="h-11 px-3"
                  onClick={() => setView("list")}
                >
                  <ArrowLeft className="size-4" /> Back
                </Button>
                <div className="min-w-0 border-l pl-3">
                  <p className="truncate text-sm font-bold">
                    {draft.invoiceNumber ??
                      (draft.id ? "Saved draft" : "New invoice")}
                  </p>
                  <p className="text-xs text-muted">
                    {dirty ? "Unsaved changes" : "All changes saved"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                {draft.status === "DRAFT" ? (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setView(view === "editor" ? "preview" : "editor")
                    }
                  >
                    {view === "editor" ? (
                      <FileText className="size-4" />
                    ) : (
                      <FilePenLine className="size-4" />
                    )}
                    {view === "editor" ? "Preview" : "Edit"}
                  </Button>
                ) : null}
                <Button variant="secondary" onClick={() => window.print()}>
                  <Printer className="size-4" /> Print
                </Button>
                {draft.status === "DRAFT" && view === "editor" ? (
                  <Button onClick={() => void persistDraft()} disabled={saving}>
                    {saving ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Save draft
                  </Button>
                ) : null}
                {draft.status === "DRAFT" && canIssue ? (
                  <Button
                    onClick={() => setConfirmIssue(true)}
                    disabled={issuing || saving}
                    className="bg-[#35231d] hover:bg-[#4c332a]"
                  >
                    {issuing ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    Issue invoice
                  </Button>
                ) : null}
              </div>
            </div>

            {error || notice ? (
              <div
                className={`print-hidden mb-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                  error
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                }`}
                role={error ? "alert" : "status"}
              >
                {error ? (
                  <X className="mt-0.5 size-4 shrink-0" />
                ) : (
                  <Check className="mt-0.5 size-4 shrink-0" />
                )}
                {error ?? notice}
              </div>
            ) : null}

            {view === "editor" ? (
              <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(600px,1.08fr)]">
                <InvoiceEditor
                  draft={draft}
                  totals={totals}
                  onChange={updateDraft}
                  onItemChange={updateItem}
                  onAddItem={addItem}
                  onRemoveItem={removeItem}
                />
                <div className="min-w-0 xl:sticky xl:top-5 xl:self-start">
                  <InvoicePreview
                    businessName={profile.business.name}
                    draft={draft}
                    totals={totals}
                    authoritative={!dirty && Boolean(draft.id)}
                  />
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-5xl">
                <InvoicePreview
                  businessName={profile.business.name}
                  draft={draft}
                  totals={totals}
                  authoritative={!dirty && Boolean(draft.id)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {confirmIssue ? (
        <div className="print-hidden fixed inset-0 z-50 grid place-items-center bg-[#24110d]/55 p-4 backdrop-blur-sm">
          <section
            className="w-full max-w-md rounded-3xl border border-white/20 bg-surface p-6 shadow-2xl sm:p-7"
            role="dialog"
            aria-modal="true"
            aria-labelledby="issue-title"
          >
            <div className="grid size-12 place-items-center rounded-2xl bg-brand-gold-soft text-brand-primary">
              <Send className="size-5" />
            </div>
            <h2
              id="issue-title"
              className="mt-5 font-display text-2xl font-extrabold"
            >
              Issue this invoice?
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              SSC Synapse will save the latest details, assign the next invoice
              number, and freeze the line items and total.
            </p>
            <div className="mt-5 rounded-2xl bg-brand-primary-soft px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-primary">
                Final amount
              </p>
              <p className="mt-1 text-2xl font-black text-brand-primary">
                {formatMoney(totals.totalAmount, draft.currency)}
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={() => setConfirmIssue(false)}
              >
                Keep editing
              </Button>
              <Button onClick={() => void issueInvoice()}>Confirm issue</Button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

type InvoiceListProps = {
  invoices: Invoice[];
  issuedTotal: number;
  draftCount: number;
  onNew: () => void;
  onOpen: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
};

function InvoiceList({
  invoices,
  issuedTotal,
  draftCount,
  onNew,
  onOpen,
  onEdit,
}: InvoiceListProps) {
  return (
    <div className="print-hidden mt-5 sm:mt-7">
      <div className="mb-5">
        <Link
          href="/workspace"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl pr-3 text-sm font-semibold text-muted hover:text-brand-primary"
        >
          <ArrowLeft className="size-4" /> Workspace
        </Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">
              Billing command center
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Customer invoices
            </h2>
            <p className="mt-2 max-w-2xl leading-7 text-muted">
              Build accurate invoices, keep drafts editable, and issue a
              polished customer document when every detail is approved.
            </p>
          </div>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={ReceiptText}
          label="All invoices"
          value={String(invoices.length).padStart(2, "0")}
          copy="Draft and issued records"
        />
        <SummaryCard
          icon={FilePenLine}
          label="Drafts"
          value={String(draftCount).padStart(2, "0")}
          copy="Ready for review"
        />
        <SummaryCard
          icon={CircleDollarSign}
          label="Issued value"
          value={formatMoney(issuedTotal, "PKR")}
          copy="Current issued invoices"
          compact
        />
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border bg-surface shadow-sm sm:mt-6">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-4 sm:px-6">
          <div>
            <h3 className="font-display text-lg font-extrabold">
              Invoice register
            </h3>
            <p className="mt-1 text-xs text-muted">
              Latest records appear first
            </p>
          </div>
          <span className="rounded-full bg-brand-primary-soft px-3 py-1 text-xs font-bold text-brand-primary">
            {invoices.length} records
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="grid min-h-72 place-items-center px-5 py-12 text-center">
            <div>
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-gold-soft text-brand-primary">
                <ReceiptText className="size-6" />
              </div>
              <h3 className="mt-5 font-display text-xl font-extrabold">
                Create your first invoice
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                Add the customer, event details, items, quantities, and prices.
                SSC Synapse will calculate the complete total.
              </p>
              <Button className="mt-5" onClick={onNew}>
                <Plus className="size-4" /> Start an invoice
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {invoices.map((invoice) => (
              <article
                key={invoice.id}
                className="grid gap-4 px-4 py-4 transition hover:bg-brand-cream/60 sm:grid-cols-[1fr_0.8fr_0.7fr_auto] sm:items-center sm:px-6"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-bold">{invoice.customerName}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-wider ${
                        invoice.status === "ISSUED"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted">
                    {invoice.invoiceNumber ?? "Draft · number pending"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:block">
                  <div>
                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted sm:hidden">
                      Event
                    </p>
                    <p className="truncate text-sm font-semibold">
                      {invoice.eventType || "General catering"}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {displayDate(invoice.eventDate)}
                    </p>
                  </div>
                  <div className="text-right sm:hidden">
                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted">
                      Total
                    </p>
                    <p className="mt-1 font-black text-brand-primary">
                      {formatMoney(invoice.totalAmount, invoice.currency)}
                    </p>
                  </div>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="font-black text-brand-primary">
                    {formatMoney(invoice.totalAmount, invoice.currency)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Due {displayDate(invoice.dueDate)}
                  </p>
                </div>
                <div className="flex gap-2 sm:justify-end">
                  {invoice.status === "DRAFT" ? (
                    <Button
                      variant="secondary"
                      className="h-10 flex-1 px-3 sm:flex-none"
                      onClick={() => onEdit(invoice)}
                    >
                      <FilePenLine className="size-4" /> Edit
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    className="h-10 flex-1 px-3 sm:flex-none"
                    onClick={() => onOpen(invoice)}
                  >
                    View <ChevronRight className="size-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type SummaryCardProps = {
  icon: typeof ReceiptText;
  label: string;
  value: string;
  copy: string;
  compact?: boolean;
};

function SummaryCard({
  icon: Icon,
  label,
  value,
  copy,
  compact,
}: SummaryCardProps) {
  return (
    <article className="rounded-2xl border bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-muted">
            {label}
          </p>
          <p
            className={`mt-2 truncate font-display font-extrabold text-foreground ${compact ? "text-xl sm:text-2xl" : "text-3xl"}`}
          >
            {value}
          </p>
          <p className="mt-1 text-xs text-muted">{copy}</p>
        </div>
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-gold-soft text-brand-primary">
          <Icon className="size-5" />
        </div>
      </div>
    </article>
  );
}

type InvoiceEditorProps = {
  draft: InvoiceDraft;
  totals: ReturnType<typeof calculateDraftTotals>;
  onChange: <K extends keyof InvoiceDraft>(
    key: K,
    value: InvoiceDraft[K],
  ) => void;
  onItemChange: <K extends keyof InvoiceItem>(
    index: number,
    key: K,
    value: InvoiceItem[K],
  ) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
};

function InvoiceEditor({
  draft,
  totals,
  onChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
}: InvoiceEditorProps) {
  const value =
    <K extends keyof InvoiceDraft>(key: K) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(key, event.target.value as InvoiceDraft[K]);

  return (
    <form
      className="print-hidden min-w-0 space-y-4"
      onSubmit={(event) => event.preventDefault()}
    >
      <EditorSection
        eyebrow="Customer"
        title="Who are you billing?"
        copy="These details appear in the Bill To section."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Customer name"
            required
            value={draft.customerName}
            onChange={value("customerName")}
            placeholder="e.g. Muhammad Ali"
          />
          <Field
            label="Phone"
            type="tel"
            value={draft.customerPhone}
            onChange={value("customerPhone")}
            placeholder="+92 300 0000000"
          />
          <Field
            label="Email"
            type="email"
            value={draft.customerEmail}
            onChange={value("customerEmail")}
            placeholder="customer@example.com"
          />
          <Field
            label="Billing address"
            value={draft.billingAddress}
            onChange={value("billingAddress")}
            placeholder="City or complete address"
          />
        </div>
      </EditorSection>

      <EditorSection
        eyebrow="Event"
        title="Event and invoice details"
        copy="Add enough context for the customer to recognize the occasion."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Event type"
            value={draft.eventType}
            onChange={value("eventType")}
            placeholder="Wedding reception"
          />
          <Field
            label="Venue"
            value={draft.venue}
            onChange={value("venue")}
            placeholder="Venue or hall"
          />
          <Field
            label="Event date"
            type="date"
            value={draft.eventDate}
            onChange={value("eventDate")}
          />
          <Field
            label="Guests"
            type="number"
            min="0"
            step="1"
            value={draft.guestCount}
            onChange={value("guestCount")}
            placeholder="150"
          />
          <Field
            label="Menu package"
            value={draft.menuPackage}
            onChange={value("menuPackage")}
            placeholder="Premium buffet"
          />
          <label className="block text-sm font-semibold text-foreground">
            Invoice type
            <select
              className={inputClass}
              value={draft.type}
              onChange={(event) =>
                onChange("type", event.target.value as InvoiceDraft["type"])
              }
            >
              <option value="MANUAL">Manual</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="PROGRESS">Progress</option>
              <option value="FINAL">Final</option>
            </select>
          </label>
          <Field
            label="Invoice date"
            type="date"
            value={draft.issueDate}
            onChange={value("issueDate")}
          />
          <Field
            label="Due date"
            type="date"
            value={draft.dueDate}
            onChange={value("dueDate")}
          />
        </div>
      </EditorSection>

      <EditorSection
        eyebrow="Items"
        title="What are you charging for?"
        copy="Quantity × unit price is calculated automatically."
      >
        <div className="space-y-3">
          {draft.items.map((item, index) => (
            <article
              key={item.id ?? index}
              className="rounded-2xl border bg-brand-cream/55 p-3 sm:p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-primary">
                  Item {index + 1}
                </p>
                <button
                  type="button"
                  className="grid size-10 place-items-center rounded-xl text-muted transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-35"
                  onClick={() => onRemoveItem(index)}
                  disabled={draft.items.length === 1}
                  aria-label={`Remove item ${index + 1}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Description"
                  required
                  value={item.description}
                  onChange={(event) =>
                    onItemChange(index, "description", event.target.value)
                  }
                  placeholder="Buffet catering package"
                />
                <Field
                  label="Package / category"
                  value={item.category}
                  onChange={(event) =>
                    onItemChange(index, "category", event.target.value)
                  }
                  placeholder="Premium menu"
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field
                  label="Quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantity}
                  onChange={(event) =>
                    onItemChange(index, "quantity", event.target.value)
                  }
                />
                <Field
                  label="Unit"
                  value={item.unit}
                  onChange={(event) =>
                    onItemChange(index, "unit", event.target.value)
                  }
                  placeholder="Pax"
                />
                <Field
                  label="Unit price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(event) =>
                    onItemChange(index, "unitPrice", event.target.value)
                  }
                />
                <div>
                  <p className="text-sm font-semibold">Line total</p>
                  <div className="mt-2 flex h-11 items-center justify-end rounded-xl bg-brand-primary-soft px-3 font-black tabular-nums text-brand-primary">
                    {formatMoney(totals.lineTotals[index] ?? 0, draft.currency)}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          className="mt-4 w-full border-dashed"
          onClick={onAddItem}
        >
          <Plus className="size-4" /> Add another item
        </Button>
      </EditorSection>

      <EditorSection
        eyebrow="Totals"
        title="Charges and complete price"
        copy="Tax is calculated on the subtotal, matching the supplied invoice style."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Currency"
            maxLength={3}
            value={draft.currency}
            onChange={(event) =>
              onChange("currency", event.target.value.toUpperCase())
            }
          />
          <Field
            label="Service charge"
            hint="%"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={draft.serviceChargeRate}
            onChange={value("serviceChargeRate")}
          />
          <Field
            label="Tax"
            hint="%"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={draft.taxRate}
            onChange={value("taxRate")}
          />
        </div>
        <div className="mt-5 rounded-2xl bg-brand-primary-dark p-5 text-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-gold-bright">
                Complete price
              </p>
              <p className="mt-2 text-xs text-white/55">
                Subtotal, service charge, and tax included
              </p>
            </div>
            <p className="text-right text-2xl font-black tabular-nums sm:text-3xl">
              {formatMoney(totals.totalAmount, draft.currency)}
            </p>
          </div>
        </div>
      </EditorSection>

      <EditorSection
        eyebrow="Customer note"
        title="Terms and finishing details"
        copy="These statements are printed on the final invoice."
      >
        <div className="grid gap-4">
          <TextAreaField
            label="Payment terms"
            value={draft.paymentTerms}
            onChange={value("paymentTerms")}
          />
          <TextAreaField
            label="Notes"
            value={draft.notes}
            onChange={value("notes")}
          />
        </div>
      </EditorSection>
    </form>
  );
}

function EditorSection({
  eyebrow,
  title,
  copy,
  children,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-surface p-4 shadow-sm sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-primary">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-xl font-extrabold sm:text-2xl">
        {title}
      </h2>
      <p className="mt-1 text-sm leading-6 text-muted">{copy}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}
