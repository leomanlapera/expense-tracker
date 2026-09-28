const PHP_FORMATTER = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

export function formatPhp(amountMinor: number | bigint): string {
  const minor = typeof amountMinor === "bigint" ? Number(amountMinor) : amountMinor;
  return PHP_FORMATTER.format(minor / 100);
}

// "1,250.5" / "₱1250.50" / "1250" → 125050n. Throws on invalid input.
export function parseMinor(input: string): bigint {
  const cleaned = input.replace(/[₱,\s]/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) {
    throw new Error("Enter a positive amount with up to 2 decimals.");
  }
  const [whole, frac = ""] = cleaned.split(".");
  const paddedFrac = (frac + "00").slice(0, 2);
  const value = BigInt(whole) * 100n + BigInt(paddedFrac);
  if (value <= 0n) throw new Error("Amount must be greater than zero.");
  return value;
}
