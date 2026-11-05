/**
 * Paletas del proyecto original. `palette0` y `custom_palette` son las listas
 * de colores SVG de `mainwindow.cpp`; `createPalette` reproduce el degradado
 * de `MainWindow::create_palette` (el paso se divide por la cantidad de
 * variaciones, no por cantidad − 1).
 */

export type Rgb = readonly [number, number, number];

export const SVG_COLORS: Readonly<Record<string, string>> = {
  black: '#000000',
  navy: '#000080',
  green: '#008000',
  aqua: '#00ffff',
  red: '#ff0000',
  purple: '#800080',
  maroon: '#800000',
  lightgray: '#d3d3d3',
  darkgray: '#a9a9a9',
  blue: '#0000ff',
  lime: '#00ff00',
  silver: '#c0c0c0',
  teal: '#008080',
  fuchsia: '#ff00ff',
  yellow: '#ffff00',
  white: '#ffffff',
  thistle: '#d8bfd8',
  darkred: '#8b0000',
  pink: '#ffc0cb',
  royalblue: '#4169e1',
  darkcyan: '#008b8b',
  chocolate: '#d2691e',
  crimson: '#dc143c',
  gray: '#808080',
};

/** Colores por nombre, equivalente a `QColorConstants::Svg::*`. */
export const c = SVG_COLORS;

export const PALETTE0: readonly string[] = [
  c.black!,
  c.navy!,
  c.green!,
  c.aqua!,
  c.red!,
  c.purple!,
  c.maroon!,
  c.lightgray!,
  c.darkgray!,
  c.blue!,
  c.lime!,
  c.silver!,
  c.teal!,
  c.fuchsia!,
  c.yellow!,
  c.white!,
];

export const CUSTOM_PALETTE: readonly string[] = [
  c.thistle!,
  c.darkred!,
  c.red!,
  c.navy!,
  c.pink!,
  c.red!,
  c.teal!,
  c.purple!,
  c.royalblue!,
  c.darkcyan!,
  c.aqua!,
  c.blue!,
  c.silver!,
  c.white!,
  c.yellow!,
  c.darkgray!,
];

const colorCache = new Map<string, Rgb>();

export function parseColor(color: string): Rgb {
  const cached = colorCache.get(color);
  if (cached) return cached;

  const hex = color.startsWith('#') ? color.slice(1) : color;
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) {
    throw new Error(`Color inválido: ${color}`);
  }
  const rgb: Rgb = [
    Number.parseInt(full.slice(0, 2), 16) / 255,
    Number.parseInt(full.slice(2, 4), 16) / 255,
    Number.parseInt(full.slice(4, 6), 16) / 255,
  ];
  colorCache.set(color, rgb);
  return rgb;
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[r, g, b]
    .map((v) => clamp(v).toString(16).padStart(2, '0'))
    .join('')}`;
}

/**
 * Degradado lineal equivalente a `create_palette(start, end, variaciones)`.
 * Los deltas se dividen entre `count` (igual que el original), así que el
 * último color no llega exactamente al extremo.
 */
export function createPalette(start: string, end: string, count: number): string[] {
  const [r0, g0, b0] = parseColor(start);
  const [r1, g1, b1] = parseColor(end);
  const dr = (r1 - r0) / count;
  const dg = (g1 - g0) / count;
  const db = (b1 - b0) / count;
  const palette: string[] = [];
  for (let i = 0; i < count; i++) {
    palette.push(
      rgbToHex((r0 + dr * i) * 255, (g0 + dg * i) * 255, (b0 + db * i) * 255),
    );
  }
  return palette;
}

export function paletteToRgba(palette: readonly string[]): Uint8Array {
  const data = new Uint8Array(palette.length * 4);
  palette.forEach((color, index) => {
    const [r, g, b] = parseColor(color);
    data[index * 4] = Math.round(r * 255);
    data[index * 4 + 1] = Math.round(g * 255);
    data[index * 4 + 2] = Math.round(b * 255);
    data[index * 4 + 3] = 255;
  });
  return data;
}
