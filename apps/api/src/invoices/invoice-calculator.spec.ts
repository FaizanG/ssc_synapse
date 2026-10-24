import { describe, expect, it } from "vitest";

import { calculateInvoiceTotals } from "./invoice-calculator.js";

describe("calculateInvoiceTotals", () => {
  it("calculates line totals, service charge, tax, and grand total", () => {
    const result = calculateInvoiceTotals(
      [
        { quantity: "150", unitPrice: "25" },
        { quantity: "150", unitPrice: "3" },
        { quantity: "1", unitPrice: "300" },
        { quantity: "5", unitPrice: "50" },
        { quantity: "1", unitPrice: "200" },
      ],
      "5",
      "10",
    );

    expect(result.lineTotals.map(String)).toEqual([
      "3750",
      "450",
      "300",
      "250",
      "200",
    ]);
    expect(String(result.subtotalAmount)).toBe("4950");
    expect(String(result.serviceChargeAmount)).toBe("247.5");
    expect(String(result.taxAmount)).toBe("495");
    expect(String(result.totalAmount)).toBe("5692.5");
  });

  it("rounds money to two decimal places using half-up rounding", () => {
    const result = calculateInvoiceTotals(
      [{ quantity: "3", unitPrice: "10.005" }],
      "0",
      "0",
    );

    expect(result.lineTotals[0]?.toFixed(2)).toBe("30.02");
    expect(result.totalAmount.toFixed(2)).toBe("30.02");
  });

  it("rejects invalid quantities and percentages", () => {
    expect(() =>
      calculateInvoiceTotals([{ quantity: "0", unitPrice: "10" }]),
    ).toThrow("quantity");
    expect(() =>
      calculateInvoiceTotals([{ quantity: "1", unitPrice: "10" }], "101"),
    ).toThrow("between 0 and 100");
  });
});
