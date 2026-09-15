export interface RegionGroup {
  name: string;
  provinces: string[];
}

export const INDONESIA_REGIONS: RegionGroup[] = [
  {
    name: 'Java (Jawa)',
    provinces: [
      'DKI Jakarta',
      'Jawa Barat',
      'Jawa Tengah',
      'DI Yogyakarta',
      'Jawa Timur',
      'Banten',
    ],
  },
  {
    name: 'Sumatra',
    provinces: [
      'Aceh',
      'Sumatera Utara',
      'Sumatera Barat',
      'Riau',
      'Kepulauan Riau',
      'Jambi',
      'Sumatera Selatan',
      'Bangka Belitung',
      'Bengkulu',
      'Lampung',
      'Sumatera (Lintas Provinsi)',
    ],
  },
  {
    name: 'Kalimantan',
    provinces: [
      'Kalimantan Barat',
      'Kalimantan Tengah',
      'Kalimantan Selatan',
      'Kalimantan Timur',
      'Kalimantan Utara',
      'IKN',
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
    name: 'Eastern & Maluku-Papua',
    provinces: [
      'Bali',
      'Nusa Tenggara Barat',
      'Nusa Tenggara Timur',
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

  for (const group of INDONESIA_REGIONS) {
    if (group.provinces.some((p) => province.toLowerCase().includes(p.toLowerCase()))) {
      return group.name;
    }
  }

  if (province.toLowerCase().includes('lintas') || province.toLowerCase().includes('nasional')) {
    return 'Lintas Provinsi / National';
  }

  return 'Other';
}
