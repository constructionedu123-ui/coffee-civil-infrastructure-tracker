export interface RegionGroup {
  name: string;
  provinces: string[];
}

export const INDONESIA_REGIONS: RegionGroup[] = [
  {
    name: 'Jawa',
    provinces: [
      'DKI Jakarta',
      'Jawa Barat',
      'Jawa Tengah',
      'DI Yogyakarta',
      'D.I. Yogyakarta',
      'Jawa Timur',
      'Banten',
    ],
  },
  {
    name: 'Sumatera',
    provinces: [
      'Aceh',
      'Sumatera Utara',
      'Sumatera Barat',
      'Riau',
      'Kepulauan Riau',
      'Jambi',
      'Sumatera Selatan',
      'Bangka Belitung',
      'Kepulauan Bangka Belitung',
      'Bengkulu',
      'Lampung',
      'Sumatera (Lintas Provinsi)',
    ],
  },
  {
    name: 'Kalimantan (inc. IKN)',
    provinces: [
      'Kalimantan Barat',
      'Kalimantan Tengah',
      'Kalimantan Selatan',
      'Kalimantan Timur',
      'Kalimantan Utara',
      'IKN',
      'Ibu Kota Negara Nusantara',
    ],
  },
  {
    name: 'Sulawesi',
    provinces: [
      'Sulawesi Utara',
      'Sulawesi Tengah',
      'Sulawesi Selatan',
      'Sulawesi Tenggara',
      'Gorontalo',
      'Sulawesi Barat',
    ],
  },
  {
    name: 'Bali & Nusa Tenggara',
    provinces: [
      'Bali',
      'Nusa Tenggara Barat',
      'NTB',
      'Nusa Tenggara Timur',
      'NTT',
    ],
  },
  {
    name: 'Maluku & Papua',
    provinces: [
      'Maluku',
      'Maluku Utara',
      'Papua',
      'Papua Barat',
      'Papua Selatan',
      'Papua Tengah',
      'Papua Pegunungan',
      'Papua Barat Daya',
    ],
  },
  {
    name: 'Lintas Provinsi / National',
    provinces: ['Lintas Provinsi', 'Nasional'],
  },
];

export function getRegionForProvince(province: string | null): string {
  if (!province) return 'Other / Unknown';

  const pLower = province.toLowerCase();

  // Support legacy alias checks
  if (pLower.includes('jawa') || pLower.includes('jakarta') || pLower.includes('banten') || pLower.includes('yogyakarta')) {
    return 'Jawa';
  }
  if (pLower.includes('sumat') || pLower.includes('aceh') || pLower.includes('riau') || pLower.includes('jambi') || pLower.includes('lampung') || pLower.includes('bengkulu') || pLower.includes('bangka')) {
    return 'Sumatera';
  }
  if (pLower.includes('kaliman') || pLower.includes('ikn') || pLower.includes('nusantara')) {
    return 'Kalimantan (inc. IKN)';
  }
  if (pLower.includes('sulawesi') || pLower.includes('gorontalo')) {
    return 'Sulawesi';
  }
  if (pLower.includes('bali') || pLower.includes('nusa tenggara') || pLower.includes('ntb') || pLower.includes('ntt')) {
    return 'Bali & Nusa Tenggara';
  }
  if (pLower.includes('maluku') || pLower.includes('papua')) {
    return 'Maluku & Papua';
  }

  for (const group of INDONESIA_REGIONS) {
    if (group.provinces.some((p) => pLower.includes(p.toLowerCase()))) {
      return group.name;
    }
  }

  if (pLower.includes('lintas') || pLower.includes('nasional')) {
    return 'Lintas Provinsi / National';
  }

  return 'Other';
}
