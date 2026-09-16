import L from "leaflet";
import { BatchingPlantProperties } from "../../types/batchingPlant";

export const OPERATOR_COLORS: Record<string, string> = {
  "WIKA Beton": "#F59E0B",              // Amber
  "Pionirbeton": "#EF4444",             // Red (Indocement)
  "SCG Jayamix": "#10B981",            // Emerald (SCG)
  "Semen Indonesia Beton": "#3B82F6",   // Blue (SIG)
  "Waskita Beton Precast": "#8B5CF6",  // Purple (WSBP)
  "Adhi Beton": "#EC4899",             // Pink (Adhi)
};

/**
 * Creates an industrial square factory badge for concrete batching plants & precast facilities
 */
export function createBatchingPlantIcon(props: BatchingPlantProperties): L.DivIcon {
  const accentColor = OPERATOR_COLORS[props.operator] || "#F59E0B";

  const html = `
    <div class="batching-plant-pin" style="
      position: relative;
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    ">
      <div style="
        width: 20px;
        height: 20px;
        border-radius: 4px;
        background-color: #0f172a;
        border: 1.5px solid ${accentColor};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 0 1px rgba(0,0,0,0.8), 0 2px 6px rgba(0,0,0,0.7);
        transition: transform 0.15s ease-out;
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 20h20"/>
          <path d="M5 20V8l5 4V4l5 4v12"/>
          <path d="M19 20v-6h-4"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-batching-plant-marker",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
}
