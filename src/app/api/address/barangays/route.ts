import { NextResponse } from "next/server";

import type { AddressApiErrorResponse, AddressOption, BarangayOption } from "@/lib/address-types";

export const dynamic = "force-dynamic";

const PSGC_CLOUD_BASE_URL = "https://psgc.cloud/api/v2";
const EB_MAGALONA_PSGC_CODE = "0604508000";
const BARANGAY_FRIENDLY_MESSAGE = "Barangay list could not be loaded. Please try again.";

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

type PsgcCloudBarangay = {
  code: string;
  name: string;
  cityCode?: string;
  municipalityCode?: string;
  cityMunicipalityCode?: string;
  cityName?: string;
  municipalityName?: string;
  cityMunicipalityName?: string;
  provinceCode?: string;
  city?: {
    code?: string;
    name?: string;
  };
  municipality?: {
    code?: string;
    name?: string;
  };
  cityMunicipality?: {
    code?: string;
    name?: string;
  };
  city_municipality?: {
    code?: string;
    name?: string;
  };
  province?: {
    code?: string;
    name?: string;
  };
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
    .replace(/\be\s*b\b/g, "eb")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesName(candidate: string, target: string): boolean {
  return normalizeName(candidate) === normalizeName(target);
}

function parseCloudArrayPayload<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === "object") {
    const maybeObject = payload as Record<string, unknown>;
    if (Array.isArray(maybeObject.data)) {
      return maybeObject.data as T[];
    }
    if (Array.isArray(maybeObject.results)) {
      return maybeObject.results as T[];
    }
  }

  return [];
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

function resolveBarangayCityCode(entry: PsgcCloudBarangay): string | null {
  return (
    normalizeCode(entry.cityCode) ??
    normalizeCode(entry.municipalityCode) ??
    normalizeCode(entry.cityMunicipalityCode) ??
    normalizeCode(entry.city?.code) ??
    normalizeCode(entry.municipality?.code) ??
    normalizeCode(entry.cityMunicipality?.code) ??
    normalizeCode(entry.city_municipality?.code)
  );
}

function resolveBarangayCityName(entry: PsgcCloudBarangay): string | null {
  const candidates = [
    entry.cityName,
    entry.municipalityName,
    entry.cityMunicipalityName,
    entry.city?.name,
    entry.municipality?.name,
    entry.cityMunicipality?.name,
    entry.city_municipality?.name,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
}

function resolveBarangayProvinceCode(entry: PsgcCloudBarangay): string | null {
  return normalizeCode(entry.provinceCode) ?? normalizeCode(entry.province?.code);
}

function resolveBarangayProvinceName(entry: PsgcCloudBarangay): string | null {
  if (typeof entry.province?.name === "string" && entry.province.name.trim().length > 0) {
    return entry.province.name.trim();
  }
  return null;
}

function dedupeAndSortBarangays(rows: BarangayOption[]): BarangayOption[] {
  const seen = new Set<string>();
  const deduped: BarangayOption[] = [];

  for (const row of rows) {
    const key = `${row.code.toLowerCase()}::${row.name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }

  return deduped.sort((left, right) => left.label.localeCompare(right.label));
}

async function fetchCloudArray<T>(url: string): Promise<T[]> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Request failed");
  }

  const payload = (await response.json().catch(() => null)) as unknown;
  return parseCloudArrayPayload<T>(payload);
}

function toBarangayOptions(rows: PsgcCloudBarangay[], provinceCode?: string): BarangayOption[] {
  return rows
    .map((row): BarangayOption | null => {
      const code = normalizeCode(row.code);
      const name = normalizeLabel(row.name);
      if (!code || !name) return null;

      return {
        code,
        label: name,
        value: code,
        name,
        cityCode: resolveBarangayCityCode(row) ?? undefined,
        provinceCode: resolveBarangayProvinceCode(row) ?? provinceCode,
      };
    })
    .filter((row): row is BarangayOption => Boolean(row));
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

  return options;
}

function withCityTypeVariants(name: string): string[] {
  const base = name.trim();
  if (!base) return [];

  const variants = [
    base,
    `City of ${base}`,
    `Municipality of ${base}`,
  ];

  const normalizedBase = normalizeName(base);
  const isEbMagalona =
    normalizedBase === normalizeName("EB Magalona") ||
    normalizedBase === normalizeName("E.B. Magalona") ||
    normalizedBase === normalizeName("Enrique B. Magalona");

  if (isEbMagalona) {
    variants.push("EB Magalona", "E.B. Magalona", "Enrique B. Magalona");
    variants.push("Municipality of E.B. Magalona", "Municipality of Enrique B. Magalona");
  }

  return Array.from(new Set(variants));
}

function filterCitiesByProvince(
  rows: PsgcCloudCityMunicipality[],
  provinceName?: string,
  provinceCode?: string
): PsgcCloudCityMunicipality[] {
  const normalizedProvinceName = provinceName ? normalizeName(provinceName) : "";
  const normalizedProvinceCode = provinceCode?.trim() ?? "";

  if (!normalizedProvinceName && !normalizedProvinceCode) {
    return rows;
  }

  return rows.filter((row) => {
    const rowProvinceCode = normalizeCode(row.province?.code) ?? "";
    const rowProvinceName = normalizeCode(row.province?.name) ?? "";

    if (normalizedProvinceCode && rowProvinceCode && normalizedProvinceCode === rowProvinceCode) {
      return true;
    }

    if (normalizedProvinceName && rowProvinceName && normalizeName(rowProvinceName) === normalizedProvinceName) {
      return true;
    }

    return false;
  });
}

async function loadProvinceCities(input: {
  provinceName?: string;
  provinceCode?: string;
}): Promise<PsgcCloudCityMunicipality[]> {
  const candidates = [input.provinceCode, input.provinceName]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  const collected: PsgcCloudCityMunicipality[] = [];

  for (const candidate of candidates) {
    try {
      const byProvince = await fetchCloudArray<PsgcCloudCityMunicipality>(
        `${PSGC_CLOUD_BASE_URL}/provinces/${encodeURIComponent(candidate)}/cities-municipalities`
      );
      if (byProvince.length > 0) {
        collected.push(...byProvince);
      }
    } catch {
      // Fallback to global list below.
    }
  }

  if (collected.length > 0) {
    return collected;
  }

  const allCities = await fetchCloudArray<PsgcCloudCityMunicipality>(`${PSGC_CLOUD_BASE_URL}/cities-municipalities`);
  return filterCitiesByProvince(allCities, input.provinceName, input.provinceCode);
}

async function resolveCityCode(input: {
  cityName: string;
  cityCode?: string;
  provinceName?: string;
  provinceCode?: string;
}): Promise<string | null> {
  if (input.cityCode?.trim()) {
    return input.cityCode.trim();
  }

  const candidates = withCityTypeVariants(input.cityName);
  if (candidates.length === 0) {
    return null;
  }

  const provinceCities = await loadProvinceCities({
    provinceName: input.provinceName,
    provinceCode: input.provinceCode,
  });

  const cityOptions = toCityOptions(provinceCities);
  const normalizedCandidates = candidates.map((candidate) => normalizeName(candidate));

  const exact = cityOptions.filter((option) => normalizedCandidates.includes(normalizeName(option.name)));
  if (exact.length === 1) {
    return exact[0].value;
  }

  if (exact.length > 1) {
    console.warn("[address/barangays] Ambiguous city/municipality match", {
      cityName: input.cityName,
      provinceName: input.provinceName,
      candidateCount: exact.length,
    });
    return null;
  }

  const fuzzy = cityOptions.filter((option) => {
    const normalized = normalizeName(option.name);
    return normalizedCandidates.some((candidate) => normalized.includes(candidate) || candidate.includes(normalized));
  });

  if (fuzzy.length === 1) {
    return fuzzy[0].value;
  }

  if (fuzzy.length > 1) {
    console.warn("[address/barangays] Ambiguous fuzzy city/municipality match", {
      cityName: input.cityName,
      provinceName: input.provinceName,
      candidateCount: fuzzy.length,
    });
  }

  return null;
}

function buildCityLookupCandidates(cityName: string, cityCode?: string): string[] {
  const rawCityName = cityName.trim();
  const candidates: string[] = [];

  if (cityCode?.trim()) {
    candidates.push(cityCode.trim());
  }

  const normalizedCity = normalizeName(rawCityName);
  const isEbMagalona =
    normalizedCity === normalizeName("EB Magalona") ||
    normalizedCity === normalizeName("E.B. Magalona") ||
    normalizedCity === normalizeName("Enrique B. Magalona");

  if (isEbMagalona) {
    candidates.push(EB_MAGALONA_PSGC_CODE);
  }

  candidates.push(rawCityName);

  const slugLikeCityName = rawCityName.replace(/\s+/g, "-").trim();
  if (slugLikeCityName && slugLikeCityName !== rawCityName) {
    candidates.push(slugLikeCityName);
  }

  return Array.from(new Set(candidates.filter((value) => value.length > 0)));
}

async function loadBarangaysFromCloud(input: {
  cityName: string;
  cityCode?: string;
  provinceName?: string;
  provinceCode?: string;
}): Promise<BarangayOption[]> {
  const resolvedCityCode = await resolveCityCode({
    cityName: input.cityName,
    cityCode: input.cityCode,
    provinceName: input.provinceName,
    provinceCode: input.provinceCode,
  });

  const candidates = buildCityLookupCandidates(input.cityName, resolvedCityCode ?? undefined);
  const collected: BarangayOption[] = [];

  for (const candidate of candidates) {
    try {
      const endpoint = `${PSGC_CLOUD_BASE_URL}/cities-municipalities/${encodeURIComponent(candidate)}/barangays`;
      const barangays = await fetchCloudArray<PsgcCloudBarangay>(endpoint);
      const mapped = toBarangayOptions(barangays, input.provinceCode);
      if (mapped.length > 0) {
        collected.push(...mapped);
      }
    } catch {
      // Try next candidate.
    }
  }

  if (collected.length > 0) {
    return dedupeAndSortBarangays(collected);
  }

  // Defensive fallback for unexpected city endpoint behavior.
  const allBarangays = await fetchCloudArray<PsgcCloudBarangay>(`${PSGC_CLOUD_BASE_URL}/barangays`);

  const filteredFallback = allBarangays.filter((row) => {
    const rowCityCode = resolveBarangayCityCode(row);
    if (resolvedCityCode && rowCityCode && resolvedCityCode === rowCityCode) {
      return true;
    }

    const rowProvinceCode = resolveBarangayProvinceCode(row);
    if (input.provinceCode && rowProvinceCode && input.provinceCode !== rowProvinceCode) {
      return false;
    }

    const rowProvinceName = resolveBarangayProvinceName(row);
    if (
      input.provinceName &&
      rowProvinceName &&
      normalizeName(input.provinceName) !== normalizeName(rowProvinceName)
    ) {
      return false;
    }

    const cityName = resolveBarangayCityName(row);
    if (cityName && matchesName(cityName, input.cityName)) {
      return true;
    }

    return false;
  });

  return dedupeAndSortBarangays(toBarangayOptions(filteredFallback, input.provinceCode));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const countryCode = url.searchParams.get("countryCode")?.trim().toUpperCase() ?? "";
  const provinceName = url.searchParams.get("provinceName")?.trim() ?? "";
  const cityName = url.searchParams.get("cityName")?.trim() ?? "";
  const provinceCode = url.searchParams.get("provinceCode")?.trim() ?? "";
  const cityCode = url.searchParams.get("cityCode")?.trim() ?? "";

  if (countryCode !== "PH") {
    return NextResponse.json([] satisfies BarangayOption[]);
  }

  if (!provinceName || !cityName) {
    return NextResponse.json([] satisfies BarangayOption[]);
  }

  try {
    const options = await loadBarangaysFromCloud({
      cityName,
      cityCode: cityCode || undefined,
      provinceName: provinceName || undefined,
      provinceCode: provinceCode || undefined,
    });

    // Preserve existing behavior: return empty array when lookup yields no rows.
    if (!matchesName(cityName, "Enrique B. Magalona") && !matchesName(cityName, "EB Magalona")) {
      return NextResponse.json(options);
    }

    // For EB Magalona specifically, prefer municipality code if alias lookup failed.
    if (options.length > 0) {
      return NextResponse.json(options);
    }

    const ebMagalonaOptions = await loadBarangaysFromCloud({
      cityName: EB_MAGALONA_PSGC_CODE,
      provinceName: provinceName || undefined,
      provinceCode: provinceCode || undefined,
    });

    return NextResponse.json(ebMagalonaOptions);
  } catch {
    return jsonError(502, BARANGAY_FRIENDLY_MESSAGE);
  }
}
