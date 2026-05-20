import { NextResponse } from "next/server";

import type { AddressApiErrorResponse, AddressOption } from "@/lib/address-types";

export const ADDRESS_API_REQUEST_FAILED_MESSAGE =
  "Address list could not be loaded. Please try again.";

export const ADDRESS_API_NOT_CONFIGURED_MESSAGE =
  "Address API key is missing. Configure COUNTRY_STATE_CITY_API_KEY on the server.";

export function getCountryStateCityApiKey(): string | null {
  return (
    process.env.COUNTRY_STATE_CITY_API_KEY?.trim() ||
    process.env.COUNTRYSTATECITY_API_KEY?.trim() ||
    null
  );
}

export function jsonAddressError(status: number, error: string) {
  return NextResponse.json({ error } satisfies AddressApiErrorResponse, { status });
}

export function normalizeCountryStateCityCountry(country: {
  name?: string;
  iso2?: string;
}): AddressOption | null {
  if (typeof country.name !== "string" || typeof country.iso2 !== "string") {
    return null;
  }

  const name = country.name.trim();
  const code = country.iso2.trim().toUpperCase();
  if (!name || !code) {
    return null;
  }

  return { label: name, value: code, code, iso2: code, name };
}

export function normalizeCountryStateCityState(state: {
  name?: string;
  iso2?: string;
}): AddressOption | null {
  if (typeof state.name !== "string" || typeof state.iso2 !== "string") {
    return null;
  }

  const name = state.name.trim();
  const code = state.iso2.trim().toUpperCase();
  if (!name || !code) {
    return null;
  }

  return { label: name, value: code, code, iso2: code, name };
}

export function normalizeCountryStateCityCity(city: { name?: string }): AddressOption | null {
  if (typeof city.name !== "string") {
    return null;
  }

  const name = city.name.trim();
  if (!name) {
    return null;
  }

  return { label: name, value: name, code: name, name };
}