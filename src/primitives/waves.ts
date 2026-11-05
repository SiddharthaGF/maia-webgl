/**
 * Ecuaciones de onda del original (`wave.h`, `wave3d.h`) en JavaScript.
 * La versión WebGL evalúa las mismas fórmulas en el fragment shader; estas
 * funciones alimentan las tablas de valores y los tests.
 */

export interface WaveSettings {
  w: number;
  v: number;
  m: number;
}

export const PALETTE_STEPS = 16;

/** z ∈ [0, 2] de la onda simple 2D. */
export function simpleWaveZ(
  x: number,
  y: number,
  t: number,
  s: WaveSettings,
  source: readonly [number, number],
): number {
  const r = Math.hypot(x - source[0], y - source[1]);
  return s.m * Math.sin(s.w * (r - s.v * t)) + 1;
}

/** z ∈ [0, 6] de la interferencia de tres fuentes 2D. */
export function interferenceWaveZ(
  x: number,
  y: number,
  t: number,
  s: WaveSettings,
): number {
  const sources: ReadonlyArray<readonly [number, number]> = [
    [-4, -2],
    [-4, 2],
    [0, 0],
  ];
  let z = 0;
  for (const [sx, sy] of sources) {
    const r = Math.hypot(x - sx, y - sy);
    z += Math.sin(s.w * (r - s.v * t)) + 1;
  }
  return z;
}

/** Índice de paleta 0..15, equivalente a `(int)(z * factor)` del C++. */
export function paletteIndex(z: number, factor = 7.5): number {
  if (!Number.isFinite(z)) return 0;
  return Math.max(0, Math.min(PALETTE_STEPS - 1, Math.trunc(z * factor)));
}

/** Valor 2D tal como lo devolvía `Wave::getData` (índice de paleta). */
export function simpleWaveData(
  x: number,
  y: number,
  t: number,
  s: WaveSettings,
  source: readonly [number, number],
): number {
  return simpleWaveZ(x, y, t, s, source) * 7.5;
}

/** z de la onda 3D simple (amplitud m·sin(...)). */
export function wave3DZ(
  x: number,
  y: number,
  t: number,
  s: WaveSettings,
): number {
  const r = Math.hypot(x, y);
  return s.m * Math.sin(s.w * (r - s.v * t));
}

/** z de la interferencia 3D de dos fuentes en (0, ±3). */
export function interference3DZ(
  x: number,
  y: number,
  t: number,
  s: WaveSettings,
): number {
  const z1 = s.m * Math.sin(s.w * (Math.hypot(x, y - 3) - s.v * t));
  const z2 = s.m * Math.sin(s.w * (Math.hypot(x, y + 3) - s.v * t));
  return z1 + z2;
}
