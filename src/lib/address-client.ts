import type { AddressOption, BarangayLookupParams, BarangayOption } from "@/lib/address-types";

async function readAddressResponse<T extends AddressOption>(response: Response): Promise<T[]> {
  const payload = (await response.json().catch(() => null)) as T[] | { error?: string } | null;
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

export async function loadCities(countryCode: string, stateCode: string, stateName?: string): Promise<AddressOption[]> {
  const searchParams = new URLSearchParams({
    countryCode,
    stateCode,
  });

  if (stateName?.trim()) {
    searchParams.set("stateName", stateName.trim());
  }

  const response = await fetch(
    `/api/address/cities?${searchParams.toString()}`,
    { cache: "no-store" }
  );
  return readAddressResponse(response);
}

export async function loadBarangays(params: BarangayLookupParams): Promise<BarangayOption[]> {
  const searchParams = new URLSearchParams({ countryCode: params.countryCode });

  if (params.provinceName) searchParams.set("provinceName", params.provinceName);
  if (params.cityName) searchParams.set("cityName", params.cityName);
  if (params.provinceCode) searchParams.set("provinceCode", params.provinceCode);
  if (params.cityCode) searchParams.set("cityCode", params.cityCode);

  const response = await fetch(`/api/address/barangays?${searchParams.toString()}`, {
    cache: "no-store",
  });
  return readAddressResponse<BarangayOption>(response);
}