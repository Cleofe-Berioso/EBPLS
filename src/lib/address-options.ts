interface AddressLookup {
  [country: string]: {
    provinces: {
      [province: string]: string[];
    };
  };
}

const COUNTRY_OPTIONS = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Cote d'Ivoire",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
] as const;

const ADDRESS_LOOKUP: AddressLookup = {
  Philippines: {
    provinces: {
      "Negros Occidental": [
        "Bacolod",
        "Bago",
        "Cadiz",
        "Escalante",
        "Himamaylan",
        "Kabankalan",
        "La Carlota",
        "Sagay",
        "San Carlos",
        "Silay",
        "Sipalay",
        "Talisay",
        "Victorias",
        "Calatrava",
        "Candoni",
        "Cauayan",
        "Don Salvador Benedicto",
        "E. B. Magalona",
        "Enrique B. Magalona",
        "Hinigaran",
        "Hinoba-an",
        "Ilog",
        "Isabela",
        "La Castellana",
        "Manapla",
        "Moises Padilla",
        "Murcia",
        "Pontevedra",
        "Pulupandan",
        "San Enrique",
        "Toboso",
        "Valladolid",
      ],
      Cebu: [],
      Iloilo: [],
      "Negros Oriental": [],
      Aklan: [],
      Antique: [],
      Bohol: [],
      Biliran: [],
      Capiz: [],
      Guimaras: [],
      Leyte: [],
      Masbate: [],
      Palawan: [],
      Romblon: [],
      Samar: [],
      "Eastern Samar": [],
      "Northern Samar": [],
      "Southern Leyte": [],
      Siquijor: [],
    },
  },
};

function sanitize(value?: string): string {
  return value?.trim() ?? "";
}

export function getCountryOptions(): string[] {
  return [...COUNTRY_OPTIONS].sort((a, b) => a.localeCompare(b));
}

export function getProvinceOptions(country?: string): string[] {
  const normalizedCountry = sanitize(country);
  if (!normalizedCountry) return [];
  const provinces = ADDRESS_LOOKUP[normalizedCountry]?.provinces;
  if (!provinces) return [];
  return Object.keys(provinces).sort((a, b) => a.localeCompare(b));
}

export function getCityMunicipalityOptions(country?: string, province?: string): string[] {
  const normalizedCountry = sanitize(country);
  const normalizedProvince = sanitize(province);
  if (!normalizedCountry || !normalizedProvince) return [];
  const cities = ADDRESS_LOOKUP[normalizedCountry]?.provinces?.[normalizedProvince] ?? [];
  return [...cities].sort((a, b) => a.localeCompare(b));
}

export function getCountries(): string[] {
  return getCountryOptions();
}

export function getProvincesByCountry(country?: string): string[] {
  return getProvinceOptions(country);
}

export function getCitiesByProvince(country?: string, province?: string): string[] {
  return getCityMunicipalityOptions(country, province);
}

export function buildMainOfficeAddress(parts: {
  streetAddress?: string;
  cityMunicipality?: string;
  province?: string;
  country?: string;
}): string {
  const street = sanitize(parts.streetAddress);
  const city = sanitize(parts.cityMunicipality);
  const province = sanitize(parts.province);
  const country = sanitize(parts.country);
  // Only produce a value when every component is present — never show a partial address.
  if (!street || !city || !province || !country) return "";
  return [street, city, province, country].join(", ");
}
