import L from 'leaflet';
import { ProjectCategory } from '../../types/project';
import { CATEGORY_CONFIG } from '../../constants/categories';

/**
 * Creates a clean, minimalist data-journalism circular dot marker for Leaflet.
 * No sci-fi radar/pulse rings, no neon blooms.
 * Solid dot (7px radius) with crisp 1.5px border and subtle national indicator.
 */
export function createProjectIcon(
  category: ProjectCategory,
  isNational: boolean,
  isSelected: boolean = false,
  isSatellite: boolean = false
): L.DivIcon {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.Transport;
  const color = config.color;

  const size = isSelected ? 18 : 14;
  const borderWidth = 1.5;


  // National / corridor project: crisp inner white dot
  const nationalCore = isNational
    ? `<div style="
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background-color: #ffffff;
      "></div>`
    : '';

  let selectionOutline = `box-shadow: 0 1px 3px rgba(0,0,0,0.5);`;
  if (isSelected) {
    selectionOutline = `box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.95), 0 2px 8px rgba(0,0,0,0.8);`;
  } else if (isSatellite) {
    selectionOutline = `box-shadow: 0 0 0 1.5px rgba(255, 255, 255, 0.85), 0 2px 6px rgba(0,0,0,0.9);`;
  }

  const html = `
    <div class="marker-dot-wrapper" style="
      position: relative;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    ">
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: ${color};
        border: ${borderWidth}px solid #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        ${selectionOutline}
        transition: transform 0.15s ease-out;
      ">
        ${nationalCore}
      </div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-project-pin',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

