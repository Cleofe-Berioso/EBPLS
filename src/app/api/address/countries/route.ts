import { NextResponse } from "next/server";

import {
  ADDRESS_API_NOT_CONFIGURED_MESSAGE,
  ADDRESS_API_REQUEST_FAILED_MESSAGE,
  getCountryStateCityApiKey,
  jsonAddressError,
  normalizeCountryStateCityCountry,
} from "@/lib/address-server";
import type { CountryStateCityCountry } from "@/lib/address-types";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = getCountryStateCityApiKey();
  if (!apiKey) {
    console.error("[address/countries] Missing COUNTRY_STATE_CITY_API_KEY");
    return jsonAddressError(500, ADDRESS_API_NOT_CONFIGURED_MESSAGE);
  }

  try {
    const response = await fetch("https://api.countrystatecity.in/v1/countries", {
      headers: {
        "X-CSCAPI-KEY": apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[address/countries] CSC API failed", {
        status: response.status,
        statusText: response.statusText,
      });
      return jsonAddressError(502, ADDRESS_API_REQUEST_FAILED_MESSAGE);
    }

    const countries = (await response.json()) as CountryStateCityCountry[];
    const options = countries
      .map((country) => normalizeCountryStateCityCountry(country))
      .filter((option): option is NonNullable<typeof option> => Boolean(option));

    return NextResponse.json(options);
  } catch (error) {
    console.error("[address/countries] Unexpected failure", error);
    return jsonAddressError(502, ADDRESS_API_REQUEST_FAILED_MESSAGE);
  }
}