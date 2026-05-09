import { NextResponse } from "next/server";

import type { AddressApiErrorResponse, AddressOption, CountryStateCityState } from "@/lib/address-types";

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
  if (!countryCode) {
    return jsonError(400, "countryCode is required.");
  }

  try {
    const response = await fetch(`https://api.countrystatecity.in/v1/countries/${countryCode}/states`, {
      headers: {
        "X-CSCAPI-KEY": apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return jsonError(502, "Address list could not be loaded. Please try again.");
    }

    const states = (await response.json()) as CountryStateCityState[];
    const options: AddressOption[] = states.map((state) => ({
      label: state.name,
      value: state.iso2,
      iso2: state.iso2,
      name: state.name,
    }));

    return NextResponse.json(options);
  } catch {
    return jsonError(502, "Address list could not be loaded. Please try again.");
  }
}