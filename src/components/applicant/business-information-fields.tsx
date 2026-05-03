"use client";

import type { BusinessInfo } from "@/lib/applicant-types";
import { getRegistrationLabel } from "@/lib/applicant-mock";
import { FormField } from "@/components/ui/form-field";

interface BusinessInformationFieldsProps {
  value: BusinessInfo;
  onChange: (next: BusinessInfo) => void;
  lockedFields?: Array<keyof BusinessInfo>;
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
}: BusinessInformationFieldsProps) {
  const registrationLabel = getRegistrationLabel(value.businessType);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FormField
        label="Business Type"
        hint="Select the registered business organization type."
        required
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
            onChange({ ...value, businessType: event.target.value as BusinessInfo["businessType"] })
          }
        >
          <option>Sole Proprietorship</option>
          <option>One Person Corporation</option>
          <option>Partnership</option>
          <option>Corporation</option>
          <option>Cooperative</option>
        </select>
        <LockedHint visible={fieldLocked(lockedFields, "businessType")} />
      </FormField>

      <FormField
        label={registrationLabel}
        hint="Use the current registration number from your business record."
        required
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
          onChange={(event) => onChange({ ...value, registrationNumber: event.target.value })}
        />
        <LockedHint visible={fieldLocked(lockedFields, "registrationNumber")} />
      </FormField>

      <FormField label="TIN" hint="Enter the registered taxpayer identification number." required>
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
          onChange={(event) => onChange({ ...value, tin: event.target.value })}
        />
        <LockedHint visible={fieldLocked(lockedFields, "tin")} />
      </FormField>

      <FormField label="Business Name" hint="Use the exact business name on record." required>
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

      <FormField label="Trade Name" hint="Enter the public-facing trade name." required>
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

      <FormField label="Owner / President Name" hint="Indicate the authorized owner or president." required>
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

      <FormField label="Nationality" hint="State the owner or president nationality." required>
        {fieldLocked(lockedFields, "nationality") ? (
          <div className="mb-2">
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              Locked
            </span>
          </div>
        ) : null}
        <input
          className={fieldClasses(fieldLocked(lockedFields, "nationality"))}
          value={value.nationality}
          disabled={fieldLocked(lockedFields, "nationality")}
          onChange={(event) => onChange({ ...value, nationality: event.target.value })}
        />
        <LockedHint visible={fieldLocked(lockedFields, "nationality")} />
      </FormField>

      <FormField label="Email" hint="Use an active email address for notifications." required>
        <input
          type="email"
          className={fieldClasses(fieldLocked(lockedFields, "email"))}
          value={value.email}
          disabled={fieldLocked(lockedFields, "email")}
          onChange={(event) => onChange({ ...value, email: event.target.value })}
        />
      </FormField>

      <div className="md:col-span-2">
        <FormField label="Main Office Address" hint="Provide the full official main office address." required>
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

      <label className="flex items-center gap-2 text-sm text-slate-800 md:col-span-2">
        <input
          type="checkbox"
          checked={value.sameAsMainOffice}
          disabled={fieldLocked(lockedFields, "sameAsMainOffice")}
          onChange={(event) => onChange({ ...value, sameAsMainOffice: event.target.checked })}
        />
        Business Address is same as Main Office Address
      </label>

      {!value.sameAsMainOffice ? (
        <div className="md:col-span-2">
          <FormField label="Business Address" hint="Enter the actual place of business operation." required>
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
            onChange={(event) => onChange({ ...value, businessAddress: event.target.value })}
          />
          </FormField>
        </div>
      ) : null}

      <FormField label="Contact Number" hint="Provide a reachable contact number." required>
        <input
          className={fieldClasses(fieldLocked(lockedFields, "phone"))}
          value={value.phone}
          disabled={fieldLocked(lockedFields, "phone")}
          onChange={(event) => onChange({ ...value, phone: event.target.value })}
        />
      </FormField>
    </div>
  );
}
