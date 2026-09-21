import { KekCategory } from '../types/kekCorridor';

export interface KekCategoryConfig {
  label: KekCategory;
  color: string;
  borderColor: string;
  glowShadow: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

export const KEK_CATEGORY_CONFIG: Record<KekCategory, KekCategoryConfig> = {
  'Nikel & Baterai EV': {
    label: 'Nikel & Baterai EV',
    color: '#8B5CF6', // Glowing Violet
    borderColor: '#7C3AED',
    glowShadow: 'rgba(139, 92, 246, 0.4)',
    icon: '⚡',
    badgeBg: 'bg-purple-950/60',
    badgeText: 'text-purple-300',
    description: 'Smelter HPAL, RKEF, Nickel Pig Iron, Katoda & Prekursor Baterai Kendaraan Listrik',
  },
  'Tembaga & Smelter Logam': {
    label: 'Tembaga & Smelter Logam',
    color: '#F59E0B', // Amber / Gold
    borderColor: '#D97706',
    glowShadow: 'rgba(245, 158, 11, 0.4)',
    icon: '🪙',
    badgeBg: 'bg-amber-950/60',
    badgeText: 'text-amber-300',
    description: 'Pemurnian Konsentrat Tembaga, Precious Metal Refinery (Emas/Perak) & Alumina Bauksit',
  },
  'Manufaktur Hijau & EV': {
    label: 'Manufaktur Hijau & EV',
    color: '#10B981', // Emerald
    borderColor: '#059669',
    glowShadow: 'rgba(16, 185, 129, 0.4)',
    icon: '🌱',
    badgeBg: 'bg-emerald-950/60',
    badgeText: 'text-emerald-300',
    description: 'Pabrik Perakitan Mobil Listrik, Komponen Presisi, Kaca Solar Panel & Aluminium Hijau',
  },
  'Petrokimia & Oleokimia': {
    label: 'Petrokimia & Oleokimia',
    color: '#0284C7', // Sky Blue
    borderColor: '#0369A1',
    glowShadow: 'rgba(2, 132, 199, 0.4)',
    icon: '🧪',
    badgeBg: 'bg-sky-950/60',
    badgeText: 'text-sky-300',
    description: 'Hilirisasi Minyak Sawit (Oleokimia), Biodiesel, Polimer Plastik & Kimia Industri Terintegrasi',
  },
  'Kesehatan / Pemerintahan': {
    label: 'Kesehatan / Pemerintahan',
    color: '#F43F5E', // Rose
    borderColor: '#E11D48',
    glowShadow: 'rgba(244, 63, 94, 0.4)',
    icon: '🏛️',
    badgeBg: 'bg-rose-950/60',
    badgeText: 'text-rose-300',
    description: 'Kawasan Inti Pemerintahan Cerdas, Layanan Medis Internasional & Riset Biomedis',
  },
};

export function getKekCategoryConfig(category: KekCategory): KekCategoryConfig {
  return KEK_CATEGORY_CONFIG[category] || KEK_CATEGORY_CONFIG['Nikel & Baterai EV'];
}
