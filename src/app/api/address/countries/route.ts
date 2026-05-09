import { NextResponse } from "next/server";

import type { AddressApiErrorResponse, AddressOption, CountryStateCityCountry } from "@/lib/address-types";

export const dynamic = "force-dynamic";

function jsonError(status: number, error: string) {
  return NextResponse.json({ error } satisfies AddressApiErrorResponse, { status });
}

export async function GET() {
  const apiKey = process.env.COUNTRYSTATECITY_API_KEY;
  if (!apiKey) {
    return jsonError(500, "Address API is not configured.");
  }

  try {
    const response = await fetch("https://api.countrystatecity.in/v1/countries", {
      headers: {
        "X-CSCAPI-KEY": apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return jsonError(502, "Address list could not be loaded. Please try again.");
    }

    const countries = (await response.json()) as CountryStateCityCountry[];
    const options: AddressOption[] = countries.map((country) => ({
      label: country.name,
      value: country.iso2,
      iso2: country.iso2,
      name: country.name,
    }));

    return NextResponse.json(options);
  } catch {
    return jsonError(502, "Address list could not be loaded. Please try again.");
  }
}