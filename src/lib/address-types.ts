export interface AddressOption {
  label: string;
  value: string;
  iso2?: string;
  name: string;
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