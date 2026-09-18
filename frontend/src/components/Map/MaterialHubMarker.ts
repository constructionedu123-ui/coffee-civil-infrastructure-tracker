import L from 'leaflet';
import { MaterialHubProperties, MaterialHubType } from '../../types/materialHub';

export const MATERIAL_HUB_CONFIG: Record<
  MaterialHubType,
  {
    label: string;
    shortLabel: string;
    color: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
    emoji: string;
  }
> = {
  'Quarry (Pasir & Agregat)': {
    label: 'Quarry Pasir & Agregat',
    shortLabel: 'Quarry',
    color: '#F59E0B', // Amber
    bgClass: 'bg-amber-950/40',
    borderClass: 'border-amber-800/60',
    textClass: 'text-amber-300',
    emoji: '⛰️',
  },
  'Baja Konstruksi (Steel Mills)': {
    label: 'Pabrik Baja Konstruksi',
    shortLabel: 'Pabrik Baja',
    color: '#06B6D4', // Cyan
    bgClass: 'bg-cyan-950/40',
    borderClass: 'border-cyan-800/60',
    textClass: 'text-cyan-300',
    emoji: '🔩',
  },
  'Pabrik Semen Terpadu': {
    label: 'Pabrik Semen Terpadu',
    shortLabel: 'Pabrik Semen',
    color: '#E11D48', // Rose Crimson
    bgClass: 'bg-rose-950/40',
    borderClass: 'border-rose-800/60',
    textClass: 'text-rose-300',
    emoji: '🧱',
  },
  'Fasad & Kaca (Architectural Facade)': {
    label: 'Fasad & Kaca Arsitektur',
    shortLabel: 'Fasad & Kaca',
    color: '#10B981', // Emerald
    bgClass: 'bg-emerald-950/40',
    borderClass: 'border-emerald-800/60',
    textClass: 'text-emerald-300',
    emoji: '🪟',
  },
};

/**
 * Creates distinct industrial SVG icon badges for Material Supply Chain Hubs
 */
export function createMaterialHubIcon(props: MaterialHubProperties): L.DivIcon {
  const config = MATERIAL_HUB_CONFIG[props.hub_type] || MATERIAL_HUB_CONFIG['Quarry (Pasir & Agregat)'];
  const color = config.color;

  let iconSvg = '';

  if (props.hub_type === 'Quarry (Pasir & Agregat)') {
    // Mountain / Quarry peaks SVG
    iconSvg = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
      </svg>
    `;
  } else if (props.hub_type === 'Baja Konstruksi (Steel Mills)') {
    // Steel I-Beam / Ingot / Anvil SVG
    iconSvg = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 4h16M4 20h16M12 4v16M9 8h6M9 16h6"/>
      </svg>
    `;
  } else if (props.hub_type === 'Pabrik Semen Terpadu') {
    // Silo / Factory Stack SVG
    iconSvg = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 20h20"/>
        <path d="M6 20V8a2 2 0 0 1 4 0v12"/>
        <path d="M14 20V4a2 2 0 0 1 4 0v16"/>
        <line x1="6" y1="12" x2="10" y2="12"/>
        <line x1="14" y1="10" x2="18" y2="10"/>
      </svg>
    `;
  } else {
    // Glass / Window grid SVG
    iconSvg = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 12h18M12 3v18"/>
      </svg>
    `;
  }

  const html = `
    <div class="material-hub-pin" style="
      position: relative;
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    ">
      <div style="
        width: 21px;
        height: 21px;
        border-radius: 5px;
        background-color: #0b0f17;
        border: 1.8px solid ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 0 1px rgba(0,0,0,0.85), 0 2px 8px rgba(0,0,0,0.7);
        transition: transform 0.15s ease-out;
      ">
        ${iconSvg}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-material-hub-marker',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
}
