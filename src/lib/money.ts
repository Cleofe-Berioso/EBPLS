type MoneyLike = {
  toNumber: () => number;
};

export function toMoneyNumber(
  value: MoneyLike | number | string | null | undefined
): number {
  if (value === null || value === undefined) return 0;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = value.toNumber();
  return Number.isFinite(parsed) ? parsed : 0;
}