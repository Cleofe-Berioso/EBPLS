"use client";

import { useCallback, useEffect, useState } from "react";

import type { BusinessInfo } from "@/lib/applicant-types";
import {
  CORPORATION_OWNERSHIP_CLASSIFICATIONS,
  getRegistrationHelperText,
  getRegistrationLabel,
  isCorporation,
  isCorporationOwnershipClassification,
  resolveNationalityOnBusinessTypeChange,
} from "@/lib/business-rules";
import type { AddressOption } from "@/lib/address-types";
import { loadCities, loadCountries, loadStates } from "@/lib/address-client";
import { FormField } from "@/components/ui/form-field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { BusinessLocationPicker } from "@/components/maps/business-location-picker";

interface BusinessInformationFieldsProps {
  value: BusinessInfo;
  onChange: (next: BusinessInfo) => void;
  lockedFields?: Array<keyof BusinessInfo>;
  fieldErrors?: Partial<Record<keyof BusinessInfo, string>>;
  enableCascadingAddress?: boolean;
}

function fieldLocked(lockedFields: Array<keyof BusinessInfo>, key: keyof BusinessInfo) {
  return lockedFields.includes(key);
}
function fieldClasses(locked: boolean) {
  return `w-full rounded-xl border px-3 py-3 text-sm transition-colors ${
    locked
      ? "border-slate-300 bg-slate-100 text-slate-800 shadow-inner"
      : "border-slate-300 bg-white text-slate-900 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100"
  }`;
}
function LockedHint({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <p className="mt-1 text-xs text-slate-600">
      Pulled from the existing business record.
    </p>
  );
}

export function BusinessInformationFields({
  value,
  onChange,
  lockedFields = [],
  fieldErrors = {},
  enableCascadingAddress = false,
}: BusinessInformationFieldsProps) {
  const registrationLabel = getRegistrationLabel(value.businessType);
  const registrationHelperText = getRegistrationHelperText(value.businessType);
  const corporation = isCorporation(value.businessType);
  const nationalityLocked = fieldLocked(lockedFields, "nationality");
  const corporationClassificationSelected = isCorporationOwnershipClassification(value.nationality);
  const selectedCountry = (value.country ?? "").trim();
  const selectedCountryCode = (value.countryCode ?? "").trim();
  const selectedProvince = (value.province ?? "").trim();
  const selectedProvinceCode = (value.provinceCode ?? "").trim();

  const [countryOptions, setCountryOptions] = useState<AddressOption[]>([]);
  const [countryLoading, setCountryLoading] = useState(false);
  const [countryError, setCountryError] = useState<string | undefined>();
  const [provinceOptions, setProvinceOptions] = useState<AddressOption[]>([]);
  const [provinceLoading, setProvinceLoading] = useState(false);
  const [provinceError, setProvinceError] = useState<string | undefined>();
  const [cityOptions, setCityOptions] = useState<AddressOption[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityError, setCityError] = useState<string | undefined>();
  const [businessAddressStatus, setBusinessAddressStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string | null;
  }>({
    type: "idle",
    message: null,
  });

  useEffect(() => {
    let active = true;
    setCountryLoading(true);
    loadCountries()
      .then((options) => {
        if (!active) return;
        setCountryOptions(options);
        setCountryError(undefined);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setCountryError(error instanceof Error ? error.message : "Address list could not be loaded. Please try again.");
      })
      .finally(() => {
        if (active) setCountryLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!selectedCountryCode) {
      setProvinceOptions([]);
      setCityOptions([]);
      return;
    }
    setProvinceLoading(true);
    loadStates(selectedCountryCode)
      .then((options) => {
        if (!active) return;
        setProvinceOptions(options);
        setProvinceError(undefined);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setProvinceError(error instanceof Error ? error.message : "Address list could not be loaded. Please try again.");
      })
      .finally(() => {
        if (active) setProvinceLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedCountryCode]);

  useEffect(() => {
    let active = true;
    if (!selectedCountryCode || !selectedProvinceCode) {
      setCityOptions([]);
      return;
    }
    setCityLoading(true);
    loadCities(selectedCountryCode, selectedProvinceCode)
      .then((options) => {
        if (!active) return;
        setCityOptions(options);
        setCityError(undefined);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setCityError(error instanceof Error ? error.message : "Address list could not be loaded. Please try again.");
      })
      .finally(() => {
        if (active) setCityLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedCountryCode, selectedProvinceCode]);

  useEffect(() => {
    if (!selectedCountry || selectedCountryCode || countryOptions.length === 0) return;
    const match = countryOptions.find((option) => option.label === selectedCountry);
    if (match) {
      onChange({ ...value, countryCode: match.value });
    }
  }, [countryOptions, onChange, selectedCountry, selectedCountryCode, value]);

  useEffect(() => {
    if (!selectedProvince || selectedProvinceCode || provinceOptions.length === 0) return;
    const match = provinceOptions.find((option) => option.label === selectedProvince);
    if (match) {
      onChange({ ...value, provinceCode: match.value });
    }
  }, [onChange, provinceOptions, selectedProvince, selectedProvinceCode, value]);

  // Memoize picker callbacks to avoid stale closures after coordinate updates
  const handlePickerChange = useCallback(
    (nextValue: { latitude: number; longitude: number } | null) =>
      onChange({
        ...value,
        businessLatitude: nextValue?.latitude ?? null,
        businessLongitude: nextValue?.longitude ?? null,
      }),
    [value, onChange]
  );

  const handleAddressResolved = useCallback(
    (address: string, coordinates: { latitude: number; longitude: number }) => {
      setBusinessAddressStatus({
        type: "success",
        message: "Business Address updated from pinned location.",
      });
      onChange({
        ...value,
        businessAddress: address,
        businessLatitude: coordinates.latitude,
        businessLongitude: coordinates.longitude,
      });
    },
    [value, onChange]
  );

  const handleAddressResolveStart = useCallback(() => {
    setBusinessAddressStatus({ type: "loading", message: null });
  }, []);

  const handleAddressResolveError = useCallback((message: string) => {
    setBusinessAddressStatus({ type: "error", message });
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FormField
        label="Business Type"
        hint="Select the registered business organization type."
        required
        error={fieldErrors.businessType}
      >
        {fieldLocked(lockedFields, "businessType") ? (
          <div className="mb-2">
            <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
              Locked
            </span>
          </div>
        ) : null}
        <select
          className={fieldClasses(fieldLocked(lockedFields, "businessType"))}
          value={value.businessType}
          disabled={fieldLocked(lockedFields, "businessType")}
          onChange={(event) =>
            onChange({
              ...value,
              businessType: event.target.value as BusinessInfo["businessType"],
              nationality: resolveNationalityOnBusinessTypeChange(
                value.businessType,
                event.target.value as BusinessInfo["businessType"],
                value.nationality
              ),
            })
          }
        >
          <option>Sole Proprietorship</option>
          <option>Corporation</option>
          <option>Partnership</option>
          <option>Cooperative</option>
        </select>
        <LockedHint visible={fieldLocked(lockedFields, "businessType")} />
      </FormField>

      <FormField
        label={registrationLabel}
        hint={registrationHelperText}
        required
        error={fieldErrors.registrationNumber}
      >
        {fieldLocked(lockedFields, "registrationNumber") ? (
          <div className="mb-2">
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              Locked
            </span>
          </div>
        ) : null}
        <input
          className={fieldClasses(fieldLocked(lockedFields, "registrationNumber"))}
          value={value.registrationNumber}
          disabled={fieldLocked(lockedFields, "registrationNumber")}
          autoCapitalize="characters"
          spellCheck={false}
          onChange={(event) => onChange({ ...value, registrationNumber: event.target.value })}
        />
        <LockedHint visible={fieldLocked(lockedFields, "registrationNumber")} />
      </FormField>

      <FormField
        label="TIN"
        hint="Enter the registered taxpayer identification number."
        required
        error={fieldErrors.tin}
      >
        {fieldLocked(lockedFields, "tin") ? (
          <div className="mb-2">
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              Locked
            </span>
          </div>
        ) : null}
          <input
            className={fieldClasses(fieldLocked(lockedFields, "tin"))}
            value={value.tin}
            disabled={fieldLocked(lockedFields, "tin")}
            inputMode="numeric"
            maxLength={9}
            pattern="[0-9]{9}"
            onChange={(event) => onChange({ ...value, tin: event.target.value })}
          />
          <LockedHint visible={fieldLocked(lockedFields, "tin")} />
      </FormField>

      <FormField
        label="Business Name"
        hint="Use the exact business name on record."
        required
        error={fieldErrors.businessName}
      >
        {fieldLocked(lockedFields, "businessName") ? (
          <div className="mb-2">
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              Locked
            </span>
          </div>
        ) : null}
        <input
          className={fieldClasses(fieldLocked(lockedFields, "businessName"))}
          value={value.businessName}
          disabled={fieldLocked(lockedFields, "businessName")}
          onChange={(event) => onChange({ ...value, businessName: event.target.value })}
        />
        <LockedHint visible={fieldLocked(lockedFields, "businessName")} />
      </FormField>

      <FormField
        label="Trade Name"
        hint="Enter the public-facing trade name."
        required
        error={fieldErrors.tradeName}
      >
        {fieldLocked(lockedFields, "tradeName") ? (
          <div className="mb-2">
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              Locked
            </span>
          </div>
        ) : null}
        <input
          className={fieldClasses(fieldLocked(lockedFields, "tradeName"))}
          value={value.tradeName}
          disabled={fieldLocked(lockedFields, "tradeName")}
          onChange={(event) => onChange({ ...value, tradeName: event.target.value })}
        />
        <LockedHint visible={fieldLocked(lockedFields, "tradeName")} />
      </FormField>

      <FormField
        label="Owner / President Name"
        hint="Indicate the authorized owner or president."
        required
        error={fieldErrors.ownerName}
      >
        {fieldLocked(lockedFields, "ownerName") ? (
          <div className="mb-2">
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              Locked
            </span>
          </div>
        ) : null}
        <input
          className={fieldClasses(fieldLocked(lockedFields, "ownerName"))}
          value={value.ownerName}
          disabled={fieldLocked(lockedFields, "ownerName")}
          onChange={(event) => onChange({ ...value, ownerName: event.target.value })}
        />
        <LockedHint visible={fieldLocked(lockedFields, "ownerName")} />
      </FormField>

        <FormField
          label="Sex"
          hint="Select the owner or president's sex."
          error={fieldErrors.sex}
        >
          <select
            className={fieldClasses(fieldLocked(lockedFields, "sex"))}
            value={value.sex ?? ""}
            disabled={fieldLocked(lockedFields, "sex")}
            onChange={(event) =>
              onChange({ ...value, sex: event.target.value || undefined })
            }
          >
            <option value="">Not specified</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </FormField>

        <FormField
          label={
            corporation
              ? "Corporation Nationality / Ownership Classification"
              : "Nationality"
          }
          hint={
            corporation
              ? "Select the corporation ownership classification."
              : "Nationality is fixed to Filipino for non-corporation business types."
          }
          required
          error={fieldErrors.nationality}
        >
          {nationalityLocked ? (
            <div className="mb-2">
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                Locked
              </span>
            </div>
          ) : null}
          {corporation ? (
            <select
              className={fieldClasses(nationalityLocked)}
              value={value.nationality}
              disabled={nationalityLocked}
              onChange={(event) => onChange({ ...value, nationality: event.target.value })}
            >
              <option value="" disabled>
                Select ownership classification
              </option>
              {CORPORATION_OWNERSHIP_CLASSIFICATIONS.map((classification) => (
                <option key={classification} value={classification}>
                  {classification}
                </option>
              ))}
            </select>
          ) : (
            <input
              className={fieldClasses(true)}
              value="Filipino"
              disabled
              readOnly
            />
          )}
          {corporation && !corporationClassificationSelected && !nationalityLocked ? (
            <p className="mt-1 text-xs text-slate-600">Please choose one ownership classification.</p>
          ) : null}
          <LockedHint visible={fieldLocked(lockedFields, "nationality")} />
        </FormField>

      <FormField
        label="Email"
        hint="Use an active email address for notifications."
        required
        error={fieldErrors.email}
      >
        <input
          type="email"
          className={fieldClasses(fieldLocked(lockedFields, "email"))}
          value={value.email}
          disabled={fieldLocked(lockedFields, "email")}
          onChange={(event) => onChange({ ...value, email: event.target.value })}
        />
      </FormField>

      {enableCascadingAddress ? (
        <>
          <FormField
            label="Country"
            hint="Search country first to filter provinces."
            required
            error={fieldErrors.country}
          >
            <SearchableSelect
              options={countryOptions}
              value={selectedCountryCode}
              selectedLabel={selectedCountry}
              loading={countryLoading}
              error={countryError}
              onChange={(nextCountry) =>
                onChange({
                  ...value,
                  country: nextCountry.name,
                  countryCode: nextCountry.value,
                  province: "",
                  provinceCode: "",
                  cityMunicipality: "",
                })
              }
              disabled={fieldLocked(lockedFields, "country")}
              placeholder="Select country"
            />
          </FormField>

          <FormField
            label="Province"
            hint="Search province after country selected."
            required
            error={fieldErrors.province}
          >
            <SearchableSelect
              options={provinceOptions}
              value={selectedProvinceCode}
              selectedLabel={selectedProvince}
              loading={provinceLoading}
              error={provinceError}
              onChange={(nextProvince) =>
                onChange({
                  ...value,
                  province: nextProvince.name,
                  provinceCode: nextProvince.value,
                  cityMunicipality: "",
                })
              }
              disabled={fieldLocked(lockedFields, "province") || !selectedCountry}
              placeholder={selectedCountry ? "Select province" : "Select country first"}
            />
          </FormField>

          <FormField
            label="City / Municipality"
            hint="Search city/municipality after province selected."
            required
            error={fieldErrors.cityMunicipality}
          >
            <SearchableSelect
              options={cityOptions}
              value={value.cityMunicipality ?? ""}
              loading={cityLoading}
              error={cityError}
              onChange={(nextCityMunicipality) =>
                onChange({ ...value, cityMunicipality: nextCityMunicipality.name })
              }
              disabled={fieldLocked(lockedFields, "cityMunicipality") || !selectedProvince}
              placeholder={selectedProvince ? "Select city/municipality" : "Select province first"}
            />
          </FormField>

          <FormField
            label="Street Address"
            hint="Enter street, purok, building, barangay, and detailed address manually."
            required
            error={fieldErrors.streetAddress}
          >
            <input
              className={fieldClasses(fieldLocked(lockedFields, "streetAddress"))}
              value={value.streetAddress ?? ""}
              disabled={fieldLocked(lockedFields, "streetAddress")}
              onChange={(event) => onChange({ ...value, streetAddress: event.target.value })}
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField
              label="Main Office Address (Auto-generated)"
              hint="Generated automatically once Country, Province, City/Municipality, and Street Address are all filled in."
              required
              error={fieldErrors.mainOfficeAddress}
            >
              {value.mainOfficeAddress ? (
                <div className={fieldClasses(true)}>
                  {value.mainOfficeAddress}
                </div>
              ) : (
                <div className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm italic text-slate-400">
                  Complete address fields to generate full address.
                </div>
              )}
            </FormField>
          </div>
        </>
      ) : (
        <div className="md:col-span-2">
          <FormField
            label="Main Office Address"
            hint="Enter the full official main office address, including house/building number, street, barangay, city/municipality, province, and ZIP code if available."
            required
            error={fieldErrors.mainOfficeAddress}
          >
            {fieldLocked(lockedFields, "mainOfficeAddress") ? (
              <div className="mb-2">
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  Locked
                </span>
              </div>
            ) : null}
            <input
              className={fieldClasses(fieldLocked(lockedFields, "mainOfficeAddress"))}
              value={value.mainOfficeAddress}
              disabled={fieldLocked(lockedFields, "mainOfficeAddress")}
              onChange={(event) => onChange({ ...value, mainOfficeAddress: event.target.value })}
            />
          </FormField>
        </div>
      )}

      <div className="md:col-span-2">
        <FormField
          label="Business Address"
          hint="Enter the actual place of business operation."
          required
          error={fieldErrors.businessAddress}
        >
          {fieldLocked(lockedFields, "businessAddress") ? (
            <div className="mb-2">
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                Locked
              </span>
            </div>
          ) : null}
          <input
            className={fieldClasses(fieldLocked(lockedFields, "businessAddress"))}
            value={value.businessAddress}
            disabled={fieldLocked(lockedFields, "businessAddress")}
            onChange={(event) => {
              setBusinessAddressStatus({ type: "idle", message: null });
              onChange({ ...value, businessAddress: event.target.value });
            }}
          />
          {businessAddressStatus.type === "loading" ? (
            <p className="mt-2 text-xs font-medium text-blue-700">Finding address…</p>
          ) : null}
          {businessAddressStatus.type === "success" && businessAddressStatus.message ? (
            <p className="mt-2 text-xs font-medium text-emerald-700">
              {businessAddressStatus.message}
            </p>
          ) : null}
          {businessAddressStatus.type === "error" && businessAddressStatus.message ? (
            <p className="mt-2 text-xs font-medium text-amber-700">
              {businessAddressStatus.message}
            </p>
          ) : null}
        </FormField>

        <div className="mt-4">
          <BusinessLocationPicker
            value={
              value.businessLatitude != null && value.businessLongitude != null
                ? { latitude: value.businessLatitude, longitude: value.businessLongitude }
                : null
            }
            onChange={handlePickerChange}
            readOnly={fieldLocked(lockedFields, "businessAddress")}
            error={fieldErrors.businessLatitude ?? fieldErrors.businessLongitude}
            onAddressResolved={handleAddressResolved}
            onAddressResolveStart={handleAddressResolveStart}
            onAddressResolveError={handleAddressResolveError}
          />
        </div>
      </div>

      <FormField
        label="Contact Number"
        hint="Provide a reachable contact number."
        required
        error={fieldErrors.phone}
      >
        <input
          className={fieldClasses(fieldLocked(lockedFields, "phone"))}
          value={value.phone}
          disabled={fieldLocked(lockedFields, "phone")}
          onChange={(event) => onChange({ ...value, phone: event.target.value })}
        />
      </FormField>

      <div className="md:col-span-2">
        <FormField
          label="Liquor/Tobacco Business"
          hint="If selected, BPLO will automatically apply the required 25% surcharge during assessment."
        >
          <label className="flex items-center gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={Boolean(value.isLiquorOrTobacco)}
              disabled={fieldLocked(lockedFields, "isLiquorOrTobacco")}
              onChange={(event) =>
                onChange({ ...value, isLiquorOrTobacco: event.target.checked })
              }
            />
            Liquor/Tobacco Business
          </label>
          <LockedHint visible={fieldLocked(lockedFields, "isLiquorOrTobacco")} />
        </FormField>
      </div>
    </div>
  );
}
