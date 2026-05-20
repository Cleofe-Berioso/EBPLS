"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { BusinessInfo } from "@/lib/applicant-types";
import {
  EB_MAGALONA_BARANGAYS,
  getRegistrationHelperText,
  getRegistrationLabel,
  resolveNationalityOnBusinessTypeChange,
} from "@/lib/business-rules";
import { formatOwnerName } from "@/lib/person-name";
import { NATIONALITY_OPTIONS } from "@/lib/nationality-options";
import {
  buildEbMagalonaBusinessAddress,
  EB_MAGALONA_CITY,
  EB_MAGALONA_COUNTRY,
  EB_MAGALONA_COUNTRY_CODE,
  EB_MAGALONA_PROVINCE,
} from "@/lib/address-options";
import type { AddressOption } from "@/lib/address-types";
import { loadBarangays, loadCities, loadCountries, loadStates } from "@/lib/address-client";
import { FormField } from "@/components/ui/form-field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { BusinessLocationPicker } from "@/components/maps/business-location-picker";

interface BusinessInformationFieldsProps {
  value: BusinessInfo;
  onChange: (next: BusinessInfo) => void;
  applicationType?: "NEW" | "RENEWAL" | "CLOSURE";
  lockedFields?: Array<keyof BusinessInfo>;
  fieldErrors?: Partial<Record<keyof BusinessInfo, string>>;
  enableCascadingAddress?: boolean;
  onFieldBlur?: (field: keyof BusinessInfo) => void;
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

function normalizeAddressName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.'’,-]/g, " ")
    .replace(/\b(city|municipality)\s+of\b/g, "")
    .replace(/\b(city|municipality|province)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function BusinessInformationFields({
  value,
  onChange,
  lockedFields = [],
  fieldErrors = {},
  enableCascadingAddress = false,
  onFieldBlur,
}: BusinessInformationFieldsProps) {
  const registrationLabel = getRegistrationLabel(value.businessType);
  const registrationHelperText = getRegistrationHelperText(value.businessType);
  const ownerIdentityLocked =
    fieldLocked(lockedFields, "ownerName") ||
    fieldLocked(lockedFields, "ownerFirstName") ||
    fieldLocked(lockedFields, "ownerMiddleName") ||
    fieldLocked(lockedFields, "ownerSurname") ||
    fieldLocked(lockedFields, "ownerSuffix");
  const nationalityLocked = fieldLocked(lockedFields, "nationality");
  const selectedMainOfficeCountry = (value.mainOfficeCountry ?? "").trim();
  const selectedMainOfficeCountryCode = (value.mainOfficeCountryCode ?? "").trim();
  const selectedMainOfficeProvince = (value.mainOfficeProvince ?? "").trim();
  const selectedMainOfficeProvinceCode = (value.mainOfficeProvinceCode ?? "").trim();
  const selectedMainOfficeCity = (value.mainOfficeCityMunicipality ?? "").trim();
  const isMainOfficePhilippines = /^Philippines$/i.test(selectedMainOfficeCountry) || selectedMainOfficeCountryCode.toUpperCase() === "PH";
  const hasMainOfficeCountry = selectedMainOfficeCountry.length > 0;
  const hasMainOfficeProvince = selectedMainOfficeProvince.length > 0;
  const hasMainOfficeCity = selectedMainOfficeCity.length > 0;

  const [countryOptions, setCountryOptions] = useState<AddressOption[]>([]);
  const [countryLoading, setCountryLoading] = useState(false);
  const [countryError, setCountryError] = useState<string | undefined>();
  const [provinceOptions, setProvinceOptions] = useState<AddressOption[]>([]);
  const [provinceLoading, setProvinceLoading] = useState(false);
  const [provinceError, setProvinceError] = useState<string | undefined>();
  const [cityOptions, setCityOptions] = useState<AddressOption[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityError, setCityError] = useState<string | undefined>();
  const [barangayOptions, setBarangayOptions] = useState<AddressOption[]>([]);
  const [barangayLoading, setBarangayLoading] = useState(false);
  const [barangayError, setBarangayError] = useState<string | undefined>();

  // Keep refs to latest value/onChange so backfill effects don't re-run on every render.
  const latestValueRef = useRef(value);
  latestValueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const selectedMainOfficeCityCode = cityOptions.find(
    (option) =>
      option.name === selectedMainOfficeCity ||
      normalizeAddressName(option.name) === normalizeAddressName(selectedMainOfficeCity)
  )?.value;

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
    if (!selectedMainOfficeCountryCode) {
      setProvinceOptions([]);
      setCityOptions([]);
      setBarangayOptions([]);
      return;
    }
    setProvinceLoading(true);
    loadStates(selectedMainOfficeCountryCode)
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
  }, [selectedMainOfficeCountryCode]);

  useEffect(() => {
    let active = true;
    if (!selectedMainOfficeCountryCode || !selectedMainOfficeProvinceCode) {
      setCityOptions([]);
      setBarangayOptions([]);
      return;
    }
    setCityLoading(true);
    loadCities(selectedMainOfficeCountryCode, selectedMainOfficeProvinceCode, selectedMainOfficeProvince)
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
  }, [selectedMainOfficeCountryCode, selectedMainOfficeProvinceCode]);

  useEffect(() => {
    let active = true;
    if (!isMainOfficePhilippines || !selectedMainOfficeCountryCode || !selectedMainOfficeProvince || !selectedMainOfficeCity) {
      setBarangayOptions([]);
      setBarangayError(undefined);
      return;
    }
    setBarangayLoading(true);
    loadBarangays({
      countryCode: selectedMainOfficeCountryCode,
      provinceName: selectedMainOfficeProvince,
      cityName: selectedMainOfficeCity,
      provinceCode: selectedMainOfficeProvinceCode,
      cityCode: selectedMainOfficeCityCode,
    })
      .then((options) => {
        if (!active) return;
        setBarangayOptions(options);
        setBarangayError(undefined);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setBarangayError(error instanceof Error ? error.message : "Address list could not be loaded. Please try again.");
      })
      .finally(() => {
        if (active) setBarangayLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    isMainOfficePhilippines,
    selectedMainOfficeCity,
    selectedMainOfficeCountryCode,
    selectedMainOfficeProvince,
    selectedMainOfficeProvinceCode,
    selectedMainOfficeCityCode,
  ]);

  // Backfill country code from label when options first load (e.g. loading a saved draft).
  // Only depends on the data that actually controls the backfill — not value/onChange refs —
  // to avoid re-firing on every parent render.
  useEffect(() => {
    if (!selectedMainOfficeCountry || selectedMainOfficeCountryCode || countryOptions.length === 0) return;
    const match = countryOptions.find((option) => option.label === selectedMainOfficeCountry);
    if (match) {
      onChangeRef.current({ ...latestValueRef.current, mainOfficeCountryCode: match.value });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryOptions, selectedMainOfficeCountry, selectedMainOfficeCountryCode]);

  // Backfill province code from label when options first load.
  useEffect(() => {
    if (!selectedMainOfficeProvince || selectedMainOfficeProvinceCode || provinceOptions.length === 0) return;
    const match = provinceOptions.find((option) => option.label === selectedMainOfficeProvince);
    if (match) {
      onChangeRef.current({ ...latestValueRef.current, mainOfficeProvinceCode: match.value });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceOptions, selectedMainOfficeProvince, selectedMainOfficeProvinceCode]);

  // Pin moved: update only coordinates, keep manual address fields intact.
  // Use refs so the callback is stable and doesn't trigger downstream re-renders.
  const handlePickerChange = useCallback(
    (nextValue: { latitude: number; longitude: number } | null) => {
      const latitude = nextValue == null ? null : Number(nextValue.latitude);
      const longitude = nextValue == null ? null : Number(nextValue.longitude);

      onChangeRef.current({
        ...latestValueRef.current,
        businessLatitude: latitude != null && Number.isFinite(latitude) ? latitude : null,
        businessLongitude: longitude != null && Number.isFinite(longitude) ? longitude : null,
      });
    },
    [] // stable for the lifetime of the component
  );

  const generatedBusinessAddress = buildEbMagalonaBusinessAddress({
    barangay: value.businessBarangay,
    streetAddress: value.businessStreetAddress,
  });

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
        label="Owner / President First Name"
        hint="Indicate the authorized owner or president's first name."
        required
        error={fieldErrors.ownerFirstName ?? fieldErrors.ownerName}
      >
        {ownerIdentityLocked ? (
          <div className="mb-2">
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              Locked
            </span>
          </div>
        ) : null}
        <input
          className={fieldClasses(ownerIdentityLocked)}
          value={value.ownerFirstName ?? ""}
          disabled={ownerIdentityLocked}
          onChange={(event) => {
            const ownerFirstName = event.target.value;
            onChange({
              ...value,
              ownerFirstName,
              ownerName: formatOwnerName({
                ownerFirstName,
                ownerMiddleName: value.ownerMiddleName,
                ownerLastName: value.ownerSurname,
                ownerSuffix: value.ownerSuffix,
                ownerName: value.ownerName,
              }),
            });
          }}
        />
        <LockedHint visible={ownerIdentityLocked} />
      </FormField>

      <FormField
        label="Owner / President Middle Name"
        hint="Optional. Leave blank if not applicable."
        error={fieldErrors.ownerMiddleName}
      >
        <input
          className={fieldClasses(ownerIdentityLocked)}
          value={value.ownerMiddleName ?? ""}
          disabled={ownerIdentityLocked}
          onChange={(event) => {
            const ownerMiddleName = event.target.value;
            onChange({
              ...value,
              ownerMiddleName,
              ownerName: formatOwnerName({
                ownerFirstName: value.ownerFirstName,
                ownerMiddleName,
                ownerLastName: value.ownerSurname,
                ownerSuffix: value.ownerSuffix,
                ownerName: value.ownerName,
              }),
            });
          }}
        />
      </FormField>

      <FormField
        label="Owner / President Surname"
        hint="Indicate the authorized owner or president's surname."
        required
        error={fieldErrors.ownerSurname ?? fieldErrors.ownerName}
      >
        <input
          className={fieldClasses(ownerIdentityLocked)}
          value={value.ownerSurname ?? ""}
          disabled={ownerIdentityLocked}
          onChange={(event) => {
            const ownerSurname = event.target.value;
            onChange({
              ...value,
              ownerSurname,
              ownerName: formatOwnerName({
                ownerFirstName: value.ownerFirstName,
                ownerMiddleName: value.ownerMiddleName,
                ownerLastName: ownerSurname,
                ownerSuffix: value.ownerSuffix,
                ownerName: value.ownerName,
              }),
            });
          }}
        />
      </FormField>

      <FormField
        label="Owner / President Suffix"
        hint="Optional. Examples: Jr, Sr, III."
        error={fieldErrors.ownerSuffix}
      >
        <input
          className={fieldClasses(ownerIdentityLocked)}
          value={value.ownerSuffix ?? ""}
          disabled={ownerIdentityLocked}
          onChange={(event) => {
            const ownerSuffix = event.target.value;
            onChange({
              ...value,
              ownerSuffix,
              ownerName: formatOwnerName({
                ownerFirstName: value.ownerFirstName,
                ownerMiddleName: value.ownerMiddleName,
                ownerLastName: value.ownerSurname,
                ownerSuffix,
                ownerName: value.ownerName,
              }),
            });
          }}
        />
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
          label="Nationality"
          hint="Select the owner's nationality or country of origin."
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
          <select
            className={fieldClasses(nationalityLocked)}
            value={value.nationality}
            disabled={nationalityLocked}
            onChange={(event) => onChange({ ...value, nationality: event.target.value })}
          >
            <option value="" disabled>
              Select nationality
            </option>
            {NATIONALITY_OPTIONS.map((nat) => (
              <option key={nat} value={nat}>
                {nat}
              </option>
            ))}
          </select>
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
            label="Main Office Country"
            hint="Main office or mailing address country."
            required
            error={fieldErrors.mainOfficeCountry}
          >
            <SearchableSelect
              options={countryOptions}
              value={value.mainOfficeCountryCode ?? ""}
              selectedLabel={value.mainOfficeCountry ?? ""}
              loading={countryLoading}
              error={countryError}
              onChange={(nextCountry) =>
                onChange({
                  ...value,
                  mainOfficeCountry: nextCountry.name,
                  mainOfficeCountryCode: nextCountry.value,
                  mainOfficeProvince: "",
                  mainOfficeProvinceCode: "",
                  mainOfficeCityMunicipality: "",
                  mainOfficeBarangay: "",
                  mainOfficeStreetAddress: "",
                })
              }
              disabled={fieldLocked(lockedFields, "mainOfficeCountry")}
              placeholder="Select country"
            />
          </FormField>

          <FormField
            label="Main Office Province / State"
            hint="Select province/state for main office address."
            required
            error={fieldErrors.mainOfficeProvince}
          >
            <SearchableSelect
              options={provinceOptions}
              value={value.mainOfficeProvinceCode ?? ""}
              selectedLabel={value.mainOfficeProvince ?? ""}
              loading={provinceLoading}
              error={provinceError}
              onChange={(nextProvince) =>
                onChange({
                  ...value,
                  mainOfficeProvince: nextProvince.name,
                  mainOfficeProvinceCode: nextProvince.value,
                  mainOfficeCityMunicipality: "",
                  mainOfficeBarangay: "",
                  mainOfficeStreetAddress: "",
                })
              }
              disabled={fieldLocked(lockedFields, "mainOfficeProvince") || !hasMainOfficeCountry}
              placeholder={!hasMainOfficeCountry ? "Select country first" : "Select province/state"}
            />
          </FormField>

          <FormField
            label="Main Office City / Municipality"
            hint="Select city/municipality for main office address."
            required
            error={fieldErrors.mainOfficeCityMunicipality}
          >
            <SearchableSelect
              options={cityOptions}
              value={selectedMainOfficeCityCode ?? value.mainOfficeCityMunicipality ?? ""}
              selectedLabel={value.mainOfficeCityMunicipality ?? ""}
              loading={cityLoading}
              error={cityError}
              onChange={(nextCityMunicipality) =>
                onChange({
                  ...value,
                  mainOfficeCityMunicipality: nextCityMunicipality.name,
                  mainOfficeBarangay: "",
                  mainOfficeStreetAddress: "",
                })
              }
              disabled={fieldLocked(lockedFields, "mainOfficeCityMunicipality") || !hasMainOfficeCountry || !hasMainOfficeProvince}
              placeholder={!hasMainOfficeCountry ? "Select country first" : !hasMainOfficeProvince ? "Select province/state first" : "Select city/municipality"}
            />
          </FormField>

          {hasMainOfficeCountry && isMainOfficePhilippines ? (
            <FormField
              label="Main Office Barangay"
              hint="Barangay is required for Philippine main office addresses."
              required
              error={fieldErrors.mainOfficeBarangay}
            >
              <SearchableSelect
                options={barangayOptions}
                value={value.mainOfficeBarangay ?? ""}
                selectedLabel={value.mainOfficeBarangay ?? ""}
                loading={barangayLoading}
                error={barangayError}
                onChange={(nextBarangay) =>
                  onChange({
                    ...value,
                    mainOfficeBarangay: nextBarangay.name,
                    mainOfficeStreetAddress: "",
                  })
                }
                disabled={
                  fieldLocked(lockedFields, "mainOfficeBarangay") ||
                  !hasMainOfficeCountry ||
                  !hasMainOfficeProvince ||
                  !hasMainOfficeCity
                }
                placeholder={
                  !hasMainOfficeCountry
                    ? "Select country first"
                    : !hasMainOfficeProvince
                      ? "Select province/state first"
                      : !hasMainOfficeCity
                        ? "Select city/municipality first"
                        : "Select barangay"
                }
              />
            </FormField>
          ) : null}

          {hasMainOfficeCountry && !isMainOfficePhilippines ? (
            <FormField
              label="Main Office Street / Address Line"
              hint="Enter street, building, unit, or mailing line for main office."
              required
              error={fieldErrors.mainOfficeStreetAddress}
            >
              <input
                className={fieldClasses(fieldLocked(lockedFields, "mainOfficeStreetAddress"))}
                value={value.mainOfficeStreetAddress ?? ""}
                disabled={
                  fieldLocked(lockedFields, "mainOfficeStreetAddress") ||
                  !hasMainOfficeCountry ||
                  !hasMainOfficeProvince ||
                  !hasMainOfficeCity
                }
                placeholder={
                  !hasMainOfficeCountry
                    ? "Select country first"
                    : !hasMainOfficeProvince
                      ? "Select province/state first"
                      : !hasMainOfficeCity
                        ? "Select city/municipality first"
                        : "Enter street, building, unit, or mailing line"
                }
                onChange={(event) => onChange({ ...value, mainOfficeStreetAddress: event.target.value })}
              />
            </FormField>
          ) : null}

          <div className="md:col-span-2">
            <FormField
              label="Main Office Address (Auto-generated)"
              hint="Generated from address fields above."
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
        <div className="mb-4">
          <p className="mb-1 text-sm font-semibold text-slate-700">
            Business Address / Place of Operation
          </p>
          {generatedBusinessAddress ? (
            <div className="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-3 text-sm text-slate-800 shadow-inner">
              {generatedBusinessAddress}
            </div>
          ) : (
            <div className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm italic text-slate-400">
              Complete Barangay and Street fields below to generate address preview.
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Fixed Business Location</p>
          <div className="grid gap-3 md:grid-cols-3">
            <FormField
              label="Country"
              hint="Business location country."
              required
            >
              <div className={fieldClasses(true)}>
                {EB_MAGALONA_COUNTRY}
              </div>
            </FormField>

            <FormField
              label="Province"
              hint="Business location province."
              required
            >
              <div className={fieldClasses(true)}>
                {EB_MAGALONA_PROVINCE}
              </div>
            </FormField>

            <FormField
              label="City / Municipality"
              hint="Business location city."
              required
            >
              <div className={fieldClasses(true)}>
                {EB_MAGALONA_CITY}
              </div>
            </FormField>
          </div>
        </div>

        <FormField
          label="Business Barangay"
          hint="Barangay within EB Magalona where business operates."
          required
          error={fieldErrors.businessBarangay}
        >
          <select
            className={fieldClasses(fieldLocked(lockedFields, "businessBarangay"))}
            value={value.businessBarangay ?? ""}
            disabled={fieldLocked(lockedFields, "businessBarangay")}
            onChange={(event) => {
              const newBarangay = event.target.value || undefined;
              onChange({
                ...value,
                businessBarangay: newBarangay,
                barangay: newBarangay,
                businessAddress: buildEbMagalonaBusinessAddress({
                  barangay: newBarangay,
                  streetAddress: value.businessStreetAddress,
                }),
              });
            }}
          >
            <option value="" disabled>
              Select barangay
            </option>
            {EB_MAGALONA_BARANGAYS.map((brgy) => (
              <option key={brgy} value={brgy}>
                {brgy}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Business Street / Purok / Building / Unit"
          hint="Street name, purok, building number, unit, or other details of the business location."
          required
          error={fieldErrors.businessStreetAddress}
        >
          <input
            className={fieldClasses(fieldLocked(lockedFields, "businessStreetAddress"))}
            value={value.businessStreetAddress ?? ""}
            disabled={fieldLocked(lockedFields, "businessStreetAddress")}
            onChange={(event) => {
              const newStreet = event.target.value;
              onChange({
                ...value,
                businessStreetAddress: newStreet,
                streetAddress: newStreet,
                businessAddress: buildEbMagalonaBusinessAddress({
                  barangay: value.businessBarangay,
                  streetAddress: newStreet,
                }),
              });
            }}
            placeholder="e.g., 123 Main St, Purok 5, or Building A Unit 201"
          />
          {value.businessLatitude != null && !value.businessStreetAddress ? (
            <p className="mt-1 text-xs text-amber-700">
              Enter the exact street, purok, building, or unit.
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
          />
          {Number.isFinite(value.businessLatitude) && Number.isFinite(value.businessLongitude) ? (
            <p className="mt-2 text-xs font-medium text-emerald-700">
              Pinned coordinates: {value.businessLatitude.toFixed(6)}, {value.businessLongitude.toFixed(6)}
            </p>
          ) : null}
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
