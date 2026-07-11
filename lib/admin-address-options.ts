export type AddressDirectoryOption = {
  code: string;
  name: string;
  label: string;
};

export type AdminAddressInput = {
  addressRegionCode?: string | null;
  addressRegion?: string | null;
  addressProvinceCode?: string | null;
  addressProvince?: string | null;
  addressCityCode?: string | null;
  addressCity?: string | null;
  addressBarangayCode?: string | null;
  addressBarangay?: string | null;
};

export type NormalizedAdminAddress = {
  addressRegionCode: string | null;
  addressRegion: string | null;
  addressProvinceCode: string | null;
  addressProvince: string | null;
  addressCityCode: string | null;
  addressCity: string | null;
  addressBarangayCode: string | null;
  addressBarangay: string | null;
};

type PsgcRegionRecord = {
  code: string;
  name: string;
  regionName?: string;
};

type PsgcPlaceRecord = {
  code: string;
  name: string;
};

const PSGC_API_BASE = 'https://psgc.gitlab.io/api';
const NCR_REGION_CODE = '130000000';
const NCR_PROVINCE_OPTION: AddressDirectoryOption = {
  code: NCR_REGION_CODE,
  name: 'Metro Manila',
  label: 'Metro Manila',
};
const CACHE = new Map<string, Promise<AddressDirectoryOption[]>>();

function compactText(value: string | null | undefined) {
  return (value ?? '').trim().replace(/\s+/g, ' ');
}

function normalizeCode(value: string | null | undefined) {
  return compactText(value);
}

function regionLabel(record: PsgcRegionRecord) {
  const regionName = compactText(record.regionName);
  const name = compactText(record.name);

  if (regionName && name && regionName.toLowerCase() !== name.toLowerCase()) {
    return `${regionName} - ${name}`;
  }

  return regionName || name;
}

function toRegionOption(record: PsgcRegionRecord): AddressDirectoryOption {
  const label = regionLabel(record);

  return {
    code: record.code,
    name: label,
    label,
  };
}

function toPlaceOption(record: PsgcPlaceRecord): AddressDirectoryOption {
  const name = compactText(record.name);

  return {
    code: record.code,
    name,
    label: name,
  };
}

function sortOptions(options: AddressDirectoryOption[]) {
  return [...options].sort((first, second) => first.label.localeCompare(second.label));
}

async function fetchPsgcJson<T>(path: string): Promise<T> {
  const response = await fetch(`${PSGC_API_BASE}${path}`, {
    cache: 'force-cache',
  });

  if (!response.ok) {
    throw new Error('The official PSGC address directory is temporarily unavailable.');
  }

  return response.json() as Promise<T>;
}

function cachedOptions(key: string, loader: () => Promise<AddressDirectoryOption[]>) {
  const cached = CACHE.get(key);

  if (cached) {
    return cached;
  }

  const promise = loader();
  CACHE.set(key, promise);
  return promise;
}

export async function fetchPsgcRegions() {
  return cachedOptions('regions', async () => {
    const records = await fetchPsgcJson<PsgcRegionRecord[]>('/regions/');
    return sortOptions(records.map(toRegionOption));
  });
}

export async function fetchPsgcProvinces(regionCode: string) {
  const code = normalizeCode(regionCode);

  if (!code) {
    return [];
  }

  if (code === NCR_REGION_CODE) {
    return [NCR_PROVINCE_OPTION];
  }

  return cachedOptions(`provinces:${code}`, async () => {
    const records = await fetchPsgcJson<PsgcPlaceRecord[]>(`/regions/${code}/provinces/`);
    return sortOptions(records.map(toPlaceOption));
  });
}

export async function fetchPsgcCitiesMunicipalities(
  regionCode: string,
  provinceCode: string,
) {
  const normalizedRegionCode = normalizeCode(regionCode);
  const normalizedProvinceCode = normalizeCode(provinceCode);

  if (!normalizedRegionCode || !normalizedProvinceCode) {
    return [];
  }

  if (normalizedRegionCode === NCR_REGION_CODE && normalizedProvinceCode === NCR_REGION_CODE) {
    return cachedOptions(`cities:${normalizedRegionCode}`, async () => {
      const records = await fetchPsgcJson<PsgcPlaceRecord[]>(
        `/regions/${normalizedRegionCode}/cities-municipalities/`,
      );
      return sortOptions(records.map(toPlaceOption));
    });
  }

  return cachedOptions(`cities:${normalizedProvinceCode}`, async () => {
    const records = await fetchPsgcJson<PsgcPlaceRecord[]>(
      `/provinces/${normalizedProvinceCode}/cities-municipalities/`,
    );
    return sortOptions(records.map(toPlaceOption));
  });
}

export async function fetchPsgcBarangays(cityMunicipalityCode: string) {
  const code = normalizeCode(cityMunicipalityCode);

  if (!code) {
    return [];
  }

  return cachedOptions(`barangays:${code}`, async () => {
    const records = await fetchPsgcJson<PsgcPlaceRecord[]>(
      `/cities-municipalities/${code}/barangays/`,
    );
    return sortOptions(records.map(toPlaceOption));
  });
}

function requireOption(
  options: AddressDirectoryOption[],
  submittedCode: string,
  fieldLabel: string,
) {
  const option = options.find((item) => item.code === submittedCode);

  if (!option) {
    throw new Error(`Please choose a valid ${fieldLabel} from the official PSGC list.`);
  }

  return option;
}

export function composeAdminAddress(address: AdminAddressInput) {
  const parts = [
    compactText(address.addressBarangay),
    compactText(address.addressCity),
    compactText(address.addressProvince),
    compactText(address.addressRegion),
  ].filter(Boolean);

  return parts.join(', ');
}

export async function normalizeAdminAddressInput(
  data: AdminAddressInput,
): Promise<NormalizedAdminAddress> {
  const normalized = {
    addressRegionCode: normalizeCode(data.addressRegionCode),
    addressRegion: compactText(data.addressRegion),
    addressProvinceCode: normalizeCode(data.addressProvinceCode),
    addressProvince: compactText(data.addressProvince),
    addressCityCode: normalizeCode(data.addressCityCode),
    addressCity: compactText(data.addressCity),
    addressBarangayCode: normalizeCode(data.addressBarangayCode),
    addressBarangay: compactText(data.addressBarangay),
  };
  const hasAnyAddressValue = Object.values(normalized).some(Boolean);

  if (!hasAnyAddressValue) {
    return {
      addressRegionCode: null,
      addressRegion: null,
      addressProvinceCode: null,
      addressProvince: null,
      addressCityCode: null,
      addressCity: null,
      addressBarangayCode: null,
      addressBarangay: null,
    };
  }

  const requiredFields = [
    ['addressRegionCode', 'region'],
    ['addressRegion', 'region'],
    ['addressProvinceCode', 'province'],
    ['addressProvince', 'province'],
    ['addressCityCode', 'city or municipality'],
    ['addressCity', 'city or municipality'],
    ['addressBarangayCode', 'barangay'],
    ['addressBarangay', 'barangay'],
  ] as const;
  const missingFields = requiredFields
    .filter(([key]) => !normalized[key])
    .map(([, label]) => label);

  if (missingFields.length > 0) {
    throw new Error(`Please complete your address ${[...new Set(missingFields)].join(', ')} before saving.`);
  }

  const regions = await fetchPsgcRegions();
  const region = requireOption(regions, normalized.addressRegionCode, 'region');
  const provinces = await fetchPsgcProvinces(region.code);
  const province = requireOption(provinces, normalized.addressProvinceCode, 'province');
  const cities = await fetchPsgcCitiesMunicipalities(region.code, province.code);
  const city = requireOption(cities, normalized.addressCityCode, 'city or municipality');
  const barangays = await fetchPsgcBarangays(city.code);
  const barangay = requireOption(barangays, normalized.addressBarangayCode, 'barangay');

  return {
    addressRegionCode: region.code,
    addressRegion: region.label,
    addressProvinceCode: province.code,
    addressProvince: province.label,
    addressCityCode: city.code,
    addressCity: city.label,
    addressBarangayCode: barangay.code,
    addressBarangay: barangay.label,
  };
}
