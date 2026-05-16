export interface AddressOption {
  label: string;
  value: string;
  iso2?: string;
  name: string;
}

export interface BarangayOption extends AddressOption {
  code: string;
  cityCode?: string;
  provinceCode?: string;
}

export interface BarangayLookupParams {
  countryCode: string;
  provinceName?: string;
  cityName?: string;
  provinceCode?: string;
  cityCode?: string;
}

export interface CountryStateCityCountry {
  iso2: string;
  name: string;
}

export interface CountryStateCityState {
  iso2: string;
  name: string;
}

export interface CountryStateCityCity {
  name: string;
}

export interface AddressApiErrorResponse {
  error: string;
}