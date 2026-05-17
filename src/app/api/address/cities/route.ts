import { NextResponse } from "next/server";

import type { AddressApiErrorResponse, AddressOption, CountryStateCityCity } from "@/lib/address-types";

export const dynamic = "force-dynamic";

const PSGC_CLOUD_BASE_URL = "https://psgc.cloud/api/v2";

type PsgcCloudProvince = {
  code?: string;
  name?: string;
};

type PsgcCloudCityMunicipality = {
  code?: string;
  name?: string;
  type?: string;
  province?: PsgcCloudProvince;
};

function jsonError(status: number, error: string) {
  return NextResponse.json({ error } satisfies AddressApiErrorResponse, { status });
}

function parseCloudArrayPayload<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (payload && typeof payload === "object") {
    const maybeObject = payload as Record<string, unknown>;
    if (Array.isArray(maybeObject.data)) return maybeObject.data as T[];
    if (Array.isArray(maybeObject.results)) return maybeObject.results as T[];
  }

  return [];
}

function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.'’,-]/g, " ")
    .replace(/\b(city|municipality)\s+of\b/g, "")
    .replace(/\b(city|municipality)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeLabel(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function fetchCloudArray<T>(url: string): Promise<T[]> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Request failed");
  }

  const payload = (await response.json().catch(() => null)) as unknown;
  return parseCloudArrayPayload<T>(payload);
}

function toCityOptions(rows: PsgcCloudCityMunicipality[]): AddressOption[] {
  const seen = new Set<string>();
  const options: AddressOption[] = [];

  for (const row of rows) {
    const code = normalizeCode(row.code);
    const name = normalizeLabel(row.name);
    if (!code || !name) continue;

    const key = `${code.toLowerCase()}::${name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    options.push({
      label: name,
      value: code,
      name,
    });
  }

  return options.sort((left, right) => left.label.localeCompare(right.label));
}

export async function GET(request: Request) {
  const apiKey = process.env.COUNTRYSTATECITY_API_KEY;

  const url = new URL(request.url);
  const countryCode = url.searchParams.get("countryCode")?.trim();
  const stateCode = url.searchParams.get("stateCode")?.trim();
  const stateName = url.searchParams.get("stateName")?.trim() ?? "";
  if (!countryCode || !stateCode) {
    return jsonError(400, "countryCode and stateCode are required.");
  }

  try {
    if (countryCode.toUpperCase() === "PH") {
      const candidates = [stateName, stateCode].filter((entry) => entry.length > 0);
      const collected: PsgcCloudCityMunicipality[] = [];

      for (const candidate of candidates) {
        try {
          const byProvince = await fetchCloudArray<PsgcCloudCityMunicipality>(
            `${PSGC_CLOUD_BASE_URL}/provinces/${encodeURIComponent(candidate)}/cities-municipalities`
          );

          if (byProvince.length > 0) {
            collected.push(...byProvince);
            continue;
          }
        } catch {
          // Try next candidate, then global list fallback.
        }
      }

      if (collected.length === 0) {
        const allCities = await fetchCloudArray<PsgcCloudCityMunicipality>(
          `${PSGC_CLOUD_BASE_URL}/cities-municipalities`
        );

        const normalizedStateName = normalizeName(stateName);
        const filtered = allCities.filter((city) => {
          const provinceName = normalizeLabel(city.province?.name);
          if (!provinceName) return false;
          return normalizeName(provinceName) === normalizedStateName;
        });

        return NextResponse.json(toCityOptions(filtered));
      }

      return NextResponse.json(toCityOptions(collected));
    }

    if (!apiKey) {
      return jsonError(500, "Address API is not configured.");
    }

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