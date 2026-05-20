export interface PersonNameInput {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  suffix?: string | null;
  fallbackName?: string | null;
}

function cleanPart(value?: string | null): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function formatPersonName(input: PersonNameInput): string {
  const firstName = cleanPart(input.firstName);
  const middleName = cleanPart(input.middleName);
  const lastName = cleanPart(input.lastName);
  const suffix = cleanPart(input.suffix);
  const fallbackName = cleanPart(input.fallbackName);

  const baseName = [firstName, middleName, lastName].filter(Boolean).join(" ").trim();

  if (baseName) {
    return suffix ? `${baseName} ${suffix}`.trim() : baseName;
  }

  return fallbackName;
}

export interface OwnerNameInput {
  ownerFirstName?: string | null;
  ownerMiddleName?: string | null;
  ownerLastName?: string | null;
  ownerSuffix?: string | null;
  ownerName?: string | null;
}

export function formatOwnerName(input: OwnerNameInput): string {
  return formatPersonName({
    firstName: input.ownerFirstName,
    middleName: input.ownerMiddleName,
    lastName: input.ownerLastName,
    suffix: input.ownerSuffix,
    fallbackName: input.ownerName,
  });
}
