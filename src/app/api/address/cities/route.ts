import { NextResponse } from "next/server";

import type { AddressApiErrorResponse, AddressOption, CountryStateCityCity } from "@/lib/address-types";

export const dynamic = "force-dynamic";

function jsonError(status: number, error: string) {
  return NextResponse.json({ error } satisfies AddressApiErrorResponse, { status });
}

export async function GET(request: Request) {
  const apiKey = process.env.COUNTRYSTATECITY_API_KEY;
  if (!apiKey) {
    return jsonError(500, "Address API is not configured.");
  }

  const url = new URL(request.url);
  const countryCode = url.searchParams.get("countryCode")?.trim();
  const stateCode = url.searchParams.get("stateCode")?.trim();
  if (!countryCode || !stateCode) {
    return jsonError(400, "countryCode and stateCode are required.");
  }

  try {
    const response = await fetch(
      `https://api.countrystatecity.in/v1/countries/${countryCode}/states/${stateCode}/cities`,
      {
        headers: {
          "X-CSCAPI-KEY": apiKey,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return jsonError(502, "Address list could not be loaded. Please try again.");
    }

    const cities = (await response.json()) as CountryStateCityCity[];
    const options: AddressOption[] = cities.map((city) => ({
      label: city.name,
      value: city.name,
      name: city.name,
    }));

    return NextResponse.json(options);
  } catch {
    return jsonError(502, "Address list could not be loaded. Please try again.");
  }
}