export function formatCurrency(cents: number, currency = "EUR") {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function parseCurrencyToCents(value: FormDataEntryValue | null) {
  const raw = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");

  const amount = Number(raw);

  if (!Number.isFinite(amount) || amount < 0) {
    return Number.NaN;
  }

  return Math.round(amount * 100);
}

export function parseSignedCurrencyToCents(value: FormDataEntryValue | null) {
  const raw = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");

  const amount = Number(raw);

  if (!Number.isFinite(amount)) {
    return Number.NaN;
  }

  return Math.round(amount * 100);
}

export function centsToInputValue(cents: number) {
  return (cents / 100).toFixed(2);
}
