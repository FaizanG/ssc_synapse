export type InvoiceStatus = "DRAFT" | "ISSUED" | "VOID";
export type InvoiceType = "MANUAL" | "DEPOSIT" | "PROGRESS" | "FINAL";

export type InvoiceItem = {
  id?: string;
  lineNumber?: number;
  description: string;
  category: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  lineTotal?: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string | null;
  type: InvoiceType;
  status: InvoiceStatus;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  billingAddress: string | null;
  eventType: string | null;
  eventDate: string | null;
  venue: string | null;
  guestCount: number | null;
  menuPackage: string | null;
  currency: string;
  issueDate: string | null;
  dueDate: string | null;
  serviceChargeRate: string;
  serviceChargeAmount: string;
  taxRate: string;
  taxAmount: string;
  subtotalAmount: string;
  totalAmount: string;
  paidAmount: string;
  balanceAmount: string;
  paymentTerms: string | null;
  notes: string | null;
  version: number;
  issuedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; fullName: string };
  items: InvoiceItem[];
};

export type InvoiceDraft = {
  id?: string;
  invoiceNumber?: string | null;
  status: InvoiceStatus;
  type: InvoiceType;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  billingAddress: string;
  eventType: string;
  eventDate: string;
  venue: string;
  guestCount: string;
  menuPackage: string;
  currency: string;
  issueDate: string;
  dueDate: string;
  serviceChargeRate: string;
  taxRate: string;
  paymentTerms: string;
  notes: string;
  items: InvoiceItem[];
};

export type InvoiceTotals = {
  lineTotals: number[];
  subtotalAmount: number;
  serviceChargeAmount: number;
  taxAmount: number;
  totalAmount: number;
};

export const EMPTY_ITEM: InvoiceItem = {
  description: "",
  category: "",
  quantity: "1",
  unit: "",
  unitPrice: "0",
};

function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function createEmptyDraft(): InvoiceDraft {
  const issueDate = new Date();
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 7);
  return {
    status: "DRAFT",
    type: "MANUAL",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    billingAddress: "",
    eventType: "",
    eventDate: "",
    venue: "",
    guestCount: "",
    menuPackage: "",
    currency: "PKR",
    issueDate: dateInputValue(issueDate),
    dueDate: dateInputValue(dueDate),
    serviceChargeRate: "0",
    taxRate: "0",
    paymentTerms:
      "50% deposit required before the event. Remaining balance is due before the event date.",
    notes:
      "Thank you for trusting Siddique Sons Caterers with your special occasion.",
    items: [{ ...EMPTY_ITEM }],
  };
}

export function invoiceToDraft(invoice: Invoice): InvoiceDraft {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    type: invoice.type,
    customerName: invoice.customerName,
    customerPhone: invoice.customerPhone ?? "",
    customerEmail: invoice.customerEmail ?? "",
    billingAddress: invoice.billingAddress ?? "",
    eventType: invoice.eventType ?? "",
    eventDate: invoice.eventDate ?? "",
    venue: invoice.venue ?? "",
    guestCount: invoice.guestCount === null ? "" : String(invoice.guestCount),
    menuPackage: invoice.menuPackage ?? "",
    currency: invoice.currency,
    issueDate: invoice.issueDate ?? "",
    dueDate: invoice.dueDate ?? "",
    serviceChargeRate: invoice.serviceChargeRate,
    taxRate: invoice.taxRate,
    paymentTerms: invoice.paymentTerms ?? "",
    notes: invoice.notes ?? "",
    items: invoice.items.map((item) => ({
      ...item,
      category: item.category ?? "",
      unit: item.unit ?? "",
    })),
  };
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateDraftTotals(draft: InvoiceDraft): InvoiceTotals {
  const lineTotals = draft.items.map((item) =>
    roundMoney(
      Math.max(0, Number(item.quantity) || 0) *
        Math.max(0, Number(item.unitPrice) || 0),
    ),
  );
  const subtotalAmount = roundMoney(
    lineTotals.reduce((sum, amount) => sum + amount, 0),
  );
  const serviceChargeAmount = roundMoney(
    subtotalAmount * (Math.max(0, Number(draft.serviceChargeRate) || 0) / 100),
  );
  const taxAmount = roundMoney(
    subtotalAmount * (Math.max(0, Number(draft.taxRate) || 0) / 100),
  );
  return {
    lineTotals,
    subtotalAmount,
    serviceChargeAmount,
    taxAmount,
    totalAmount: roundMoney(subtotalAmount + serviceChargeAmount + taxAmount),
  };
}

export function formatMoney(amount: number | string, currency = "PKR") {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}
