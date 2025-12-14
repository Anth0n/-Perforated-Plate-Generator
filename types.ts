export interface PlateConfig {
  width: number; // mm
  height: number; // mm
  spacing: number; // mm (pitch)
  minHoleSize: number; // mm (diameter)
  maxHoleSize: number; // mm (diameter)
  margin: number; // mm
  inverted: boolean; // true = light is big hole, false = dark is big hole
  threshold: number; // 0-255 cutoff
  shape: 'circle' | 'square'; // Future proofing, currently only circle
}

export interface Dot {
  x: number; // mm center relative to plate
  y: number; // mm center relative to plate
  r: number; // mm radius
}

export interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export type Language = 'en' | 'zh';
export type Theme = 'light' | 'dark';