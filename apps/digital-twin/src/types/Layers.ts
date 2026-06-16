export interface LegendItem {
  color: string;
  label: string;
}

export interface LayerStyleConfig {
  // GeoJsonLayer point props
  getFillColor?: unknown;
  getLineColor?: unknown;
  getLineWidth?: unknown;
  getRadius?: unknown; // For point features (circles)
  pointRadiusMinPixels?: number;
  pointRadiusMaxPixels?: number;
  pointRadiusScale?: number;
  
  // Icon specific (for IconLayer)
  useIconLayer?: boolean;
  iconEmoji?: string;
  iconSize?: number;
  iconColor?: [number, number, number];
  
  // Legend
  legend?: {
    title: string;
    items: LegendItem[];
  };
}
