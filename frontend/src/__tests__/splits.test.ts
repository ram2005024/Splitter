import { describe, it, expect } from "vitest";

describe("Expense Split Strategies (Section 19)", () => {
  it("should divide amount equally with exact penny rounding", () => {
    const totalAmount = 100.0;
    const numPeople = 3;
    const baseShare = Math.floor((totalAmount / numPeople) * 100) / 100; // 33.33
    const totalBase = baseShare * numPeople; // 99.99
    const remainderCents = Math.round((totalAmount - totalBase) * 100); // 1 cent

    const shares = Array(numPeople).fill(baseShare);
    for (let i = 0; i < remainderCents; i++) {
      shares[i] = Math.round((shares[i] + 0.01) * 100) / 100;
    }

    expect(shares).toEqual([33.34, 33.33, 33.33]);
    const sum = shares.reduce((a, b) => a + b, 0);
    expect(sum).toBe(100.0);
  });

  it("should validate that exact splits sum exactly to total amount", () => {
    const totalAmount = 1000.0;
    const splits = [
      { user: "Ram", amount: 400.0 },
      { user: "John", amount: 300.0 },
      { user: "Hari", amount: 300.0 },
    ];

    const sum = splits.reduce((acc, s) => acc + s.amount, 0);
    expect(sum).toBe(totalAmount);
    expect(Math.abs(sum - totalAmount)).toBeLessThanOrEqual(0.001);
  });

  it("should validate that percentage splits sum to 100%", () => {
    const percentages = [
      { user: "Ram", pct: 50 },
      { user: "John", pct: 30 },
      { user: "Hari", pct: 20 },
    ];

    const totalPct = percentages.reduce((acc, p) => acc + p.pct, 0);
    expect(totalPct).toBe(100);
  });
});
