import { Prisma } from "../generated/prisma/client.js";

export type InvoiceCalculationLine = {
  quantity: string;
  unitPrice: string;
};

export type InvoiceCalculation = {
  lineTotals: Prisma.Decimal[];
  subtotalAmount: Prisma.Decimal;
  serviceChargeAmount: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
};

const ZERO = new Prisma.Decimal(0);
const ONE_HUNDRED = new Prisma.Decimal(100);

function money(value: Prisma.Decimal) {
  return value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

function percentage(value: string | undefined) {
  const parsed = new Prisma.Decimal(value ?? 0);
  if (parsed.isNegative() || parsed.greaterThan(ONE_HUNDRED)) {
    throw new Error("Percentage values must be between 0 and 100.");
  }
  return parsed;
}

export function calculateInvoiceTotals(
  lines: InvoiceCalculationLine[],
  serviceChargeRate = "0",
  taxRate = "0",
): InvoiceCalculation {
  if (lines.length === 0) {
    throw new Error("An invoice must contain at least one line item.");
  }

  const lineTotals = lines.map((line) => {
    const quantity = new Prisma.Decimal(line.quantity);
    const unitPrice = new Prisma.Decimal(line.unitPrice);
    if (quantity.lessThanOrEqualTo(ZERO)) {
      throw new Error("Line item quantity must be greater than zero.");
    }
    if (unitPrice.isNegative()) {
      throw new Error("Line item unit price cannot be negative.");
    }
    return money(quantity.times(unitPrice));
  });

  const subtotalAmount = money(
    lineTotals.reduce((total, lineTotal) => total.plus(lineTotal), ZERO),
  );
  const serviceChargeAmount = money(
    subtotalAmount.times(percentage(serviceChargeRate)).dividedBy(100),
  );
  const taxAmount = money(
    subtotalAmount.times(percentage(taxRate)).dividedBy(100),
  );
  const totalAmount = money(
    subtotalAmount.plus(serviceChargeAmount).plus(taxAmount),
  );

  return {
    lineTotals,
    subtotalAmount,
    serviceChargeAmount,
    taxAmount,
    totalAmount,
  };
}
