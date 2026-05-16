import { NextResponse } from "next/server";

import type { AddressApiErrorResponse, BarangayOption } from "@/lib/address-types";

export const dynamic = "force-dynamic";

const FALLBACK_PSGC_BASE_URL = "https://psgc.gitlab.io/api";
const OFFICIAL_PSGC_BASE_URL = process.env.BARANGAY_API_BASE_URL?.trim() || FALLBACK_PSGC_BASE_URL;
const BARANGAY_FRIENDLY_MESSAGE = "Barangay list could not be loaded. Please try again.";

type PsgcProvince = {
  code: string;
  name: string;
  islandGroupCode: string;
};

type PsgcCityMunicipality = {
  code: string;
  name: string;
  provinceCode: string | false;
  islandGroupCode: string;
};

type PsgcBarangay = {
  code: string;
  name: string;
  cityCode?: string;
  municipalityCode?: string;
  provinceCode?: string;
};

function jsonError(status: number, error: string) {
  return NextResponse.json({ error } satisfies AddressApiErrorResponse, { status });
}

function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.'’,-]/g, " ")
    .replace(/\b(city|municipality|province)\s+of\b/g, "")
    .replace(/\b(city|municipality)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesName(candidate: string, target: string): boolean {
  return normalizeName(candidate) === normalizeName(target);
}

async function fetchJson<T>(url: string, token?: string): Promise<T[]> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });
  if (!response.ok) {
    throw new Error("Request failed");
  }
  return (await response.json()) as T[];
}

async function loadBarangaysFromProvider(input: {
  baseUrl: string;
  provinceName: string;
  cityName: string;
  token?: string;
}): Promise<BarangayOption[]> {
  const [provinces, cities] = await Promise.all([
    fetchJson<PsgcProvince>(`${input.baseUrl}/provinces.json`, input.token),
    fetchJson<PsgcCityMunicipality>(`${input.baseUrl}/cities-municipalities.json`, input.token),
  ]);

  const province = provinces.find((entry) => matchesName(entry.name, input.provinceName));
  if (!province) {
    return [];
  }

  const city = cities.find(
    (entry) => entry.provinceCode === province.code && matchesName(entry.name, input.cityName)
  );

  if (!city) {
    return [];
  }

  const barangays = await fetchJson<PsgcBarangay>(
    `${input.baseUrl}/island-groups/${city.islandGroupCode}/barangays.json`,
    input.token
  );

  return barangays
    .filter((entry) => {
      const matchesCityCode = entry.cityCode === city.code || entry.municipalityCode === city.code;
      const matchesProvinceCode = !entry.provinceCode || entry.provinceCode === province.code;
      return matchesCityCode && matchesProvinceCode;
    })
    .map((barangay) => ({
      code: barangay.code,
      label: barangay.name,
      value: barangay.code,
      name: barangay.name,
      cityCode: city.code,
      provinceCode: province.code,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const countryCode = url.searchParams.get("countryCode")?.trim().toUpperCase() ?? "";
  const provinceName = url.searchParams.get("provinceName")?.trim() ?? "";
  const cityName = url.searchParams.get("cityName")?.trim() ?? "";
  const barangayApiEnabled = process.env.ENABLE_BARANGAY_API === "true";
  const barangayApiToken = process.env.BARANGAY_API_TOKEN;

  if (countryCode !== "PH") {
    return NextResponse.json([] satisfies BarangayOption[]);
  }

  if (!provinceName || !cityName) {
    return NextResponse.json([] satisfies BarangayOption[]);
  }

  try {
    if (barangayApiEnabled) {
      if (barangayApiToken) {
        try {
          const officialOptions = await loadBarangaysFromProvider({
            baseUrl: OFFICIAL_PSGC_BASE_URL,
            provinceName,
            cityName,
            token: barangayApiToken,
          });
          return NextResponse.json(officialOptions);
        } catch {
          console.warn("[address/barangays] Official provider failed. Falling back to no-key source.");
        }
      } else {
        console.warn(
          "[address/barangays] ENABLE_BARANGAY_API=true but BARANGAY_API_TOKEN is missing. Falling back to no-key source."
        );
      }
    }

    const fallbackOptions = await loadBarangaysFromProvider({
      baseUrl: FALLBACK_PSGC_BASE_URL,
      provinceName,
      cityName,
    });

    return NextResponse.json(fallbackOptions);
  } catch {
    return jsonError(502, BARANGAY_FRIENDLY_MESSAGE);
  }
}