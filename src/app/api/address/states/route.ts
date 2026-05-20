import { NextResponse } from "next/server";

import {
  ADDRESS_API_NOT_CONFIGURED_MESSAGE,
  ADDRESS_API_REQUEST_FAILED_MESSAGE,
  getCountryStateCityApiKey,
  jsonAddressError,
  normalizeCountryStateCityState,
} from "@/lib/address-server";
import type { CountryStateCityState } from "@/lib/address-types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const apiKey = getCountryStateCityApiKey();
  if (!apiKey) {
    console.error("[address/states] Missing COUNTRY_STATE_CITY_API_KEY");
    return jsonAddressError(500, ADDRESS_API_NOT_CONFIGURED_MESSAGE);
  }

  const url = new URL(request.url);
  const countryCode = url.searchParams.get("countryCode")?.trim();
  if (!countryCode) {
    return jsonAddressError(400, "countryCode is required.");
  }

  try {
    const response = await fetch(`https://api.countrystatecity.in/v1/countries/${countryCode}/states`, {
      headers: {
        "X-CSCAPI-KEY": apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[address/states] CSC API failed", {
        countryCode,
        status: response.status,
        statusText: response.statusText,
      });
      return jsonAddressError(502, ADDRESS_API_REQUEST_FAILED_MESSAGE);
    }

    const states = (await response.json()) as CountryStateCityState[];
    const options = states
      .map((state) => normalizeCountryStateCityState(state))
      .filter((option): option is NonNullable<typeof option> => Boolean(option));

    return NextResponse.json(options);
  } catch (error) {
    console.error("[address/states] Unexpected failure", { countryCode, error });
    return jsonAddressError(502, ADDRESS_API_REQUEST_FAILED_MESSAGE);
  }
}