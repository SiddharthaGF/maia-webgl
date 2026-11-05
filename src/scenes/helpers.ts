/** Utilidades de dibujo y tablas compartidas por las escenas. */

import { createPalette, PALETTE0, CUSTOM_PALETTE, c } from '../core/palette';
import type { Plot } from '../core/plot';
import { WORLD, axonometry } from '../core/viewport';
import type { Point } from '../primitives/curves';
import type { TableSpec } from './types';

/** Paleta gris del degradado de las ondas simples (16 variaciones). */
export const GRAY_WAVE_PALETTE: readonly string[] = createPalette('#c8c8c8', '#1e1e1e', 16);

/** Paleta azul del botón «Textura» (15 variaciones). */
export const TEXTURE_GRADIENT_PALETTE: readonly string[] = createPalette(
  '#273b76',
  '#b6c8ec',
  15,
);

/** Paleta de cada patrón de textura, como en `combo_textures`. */
export function texturePalette(texture: number): readonly string[] {
  return texture === 3 || texture === 4 || texture === 6 || texture === 8
    ? CUSTOM_PALETTE
    : PALETTE0;
}

/** Ejes marrón del original (`Vector::x1..x2`, `y1..y2`). */
export function drawAxes(plot: Plot): void {
  plot.segment(WORLD.xMin, 0, WORLD.xMax, 0, c.maroon!);
  plot.segment(0, WORLD.yMin, 0, WORLD.yMax, c.maroon!);
}

/** Plataforma de la onda 3D (`on_btn_platform_clicked`). */
export function drawPlatform(plot: Plot): void {
  const heights = [-3.67, -4.67, -6.07, -8];
  for (const h of heights) {
    plot.segment(WORLD.xMin, h, WORLD.xMax, h, c.gray!);
  }
  const verticals: Array<[number, number]> = [
    [0.6, 3],
    [2, 8],
    [3, 21],
    [4, 55],
    [5, 144],
    [-0.6, -3],
    [-2, -8],
    [-3, -21],
    [-4, -55],
    [-5, -144],
  ];
  for (const [x0, x1] of verticals) {
    plot.segment(x0, heights[0]!, x1, WORLD.yMin, c.gray!);
  }
}

/** Proyecta un punto 3D y lo dibuja como píxel (nubes de puntos del original). */
export function point3D(
  plot: Plot,
  x: number,
  y: number,
  z: number,
  color: string,
): void {
  const [ax, ay] = axonometry(x, y, z);
  plot.point(ax, ay, color);
}

/** Proyecta un punto 3D y devuelve sus coordenadas de mundo 2D. */
export function project3D(x: number, y: number, z: number): Point {
  return axonometry(x, y, z);
}

export function csvText(
  header: readonly string[],
  rows: ReadonlyArray<ReadonlyArray<string | number>>,
): string {
  const lines = [header.join(',')];
  for (const row of rows) lines.push(row.join(','));
  return lines.join('\n') + '\n';
}

export function numberRows(
  rows: ReadonlyArray<ReadonlyArray<number>>,
  digits = 3,
): string[][] {
  return rows.map((row) => row.map((value) => value.toFixed(digits)));
}

export function makeTable(
  title: string,
  note: string,
  columns: string[],
  rows: string[][],
  filename: string,
  csv: string,
): TableSpec {
  return { title, note, columns, rows, csv: { filename, content: csv } };
}
