import type { AddressOption } from "@/lib/address-types";

async function readAddressResponse(response: Response): Promise<AddressOption[]> {
  const payload = (await response.json().catch(() => null)) as AddressOption[] | { error?: string } | null;
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload && payload.error
      ? payload.error
      : "Address list could not be loaded. Please try again.";
    throw new Error(message);
  }
  return Array.isArray(payload) ? payload : [];
}

export async function loadCountries(): Promise<AddressOption[]> {
  const response = await fetch("/api/address/countries", { cache: "no-store" });
  return readAddressResponse(response);
}

export async function loadStates(countryCode: string): Promise<AddressOption[]> {
  const response = await fetch(`/api/address/states?countryCode=${encodeURIComponent(countryCode)}`, {
    cache: "no-store",
  });
  return readAddressResponse(response);
}

export async function loadCities(countryCode: string, stateCode: string): Promise<AddressOption[]> {
  const response = await fetch(
    `/api/address/cities?countryCode=${encodeURIComponent(countryCode)}&stateCode=${encodeURIComponent(stateCode)}`,
    { cache: "no-store" }
  );
  return readAddressResponse(response);
}