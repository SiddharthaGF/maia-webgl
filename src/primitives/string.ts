/**
 * Cuerda vibrante (`vibrant_string.h`).
 *
 * El original calculaba coeficientes de Fourier con una regla de Simpson que
 * solo evaluaba f en l/2 y l, lo que producía coeficientes que no decaían y
 * dibujaba fuera del lienzo. Acá se usa el perfil triangular de una cuerda
 * pulsada, f(x) = 1.5·min(x, l−x), que sí satisface las condiciones de borde,
 * y g(x) = 0.5, con los coeficientes analíticos de la ecuación de onda.
 */

import type { Point } from './curves';

export const STRING = {
  length: 6,
  speed: 1,
  harmonicCount: 40,
  slope: 1.5,
  velocity: 0.5,
} as const;

export interface Harmonic {
  k: number;
  a: number;
  b: number;
}

export function fourierHarmonics(
  length: number = STRING.length,
  c: number = STRING.speed,
  count: number = STRING.harmonicCount,
  slope: number = STRING.slope,
  velocity: number = STRING.velocity,
): Harmonic[] {
  const harmonics: Harmonic[] = [];
  for (let k = 1; k <= count; k++) {
    // Perfil triangular: a_k = 4·slope·l/(k²π²)·sin(kπ/2); solo impares.
    const odd = k % 2 === 1;
    const a = odd
      ? ((4 * slope * length) / (k * k * Math.PI * Math.PI)) * Math.sin((k * Math.PI) / 2)
      : 0;
    // b_k = 2/(kπc)·∫g·sin(kπx/l); para g constante vale 0 en k par.
    const b = odd
      ? ((2 * length) / (k * k * Math.PI * Math.PI * c)) * (velocity / 0.5)
      : 0;
    harmonics.push({ k, a, b });
  }
  return harmonics;
}

export const DEFAULT_HARMONICS = fourierHarmonics();

export function stringAt(
  x: number,
  t: number,
  harmonics: readonly Harmonic[] = DEFAULT_HARMONICS,
  length: number = STRING.length,
  c: number = STRING.speed,
): number {
  let sum = 0;
  for (const { k, a, b } of harmonics) {
    const phase = (k * Math.PI * c * t) / length;
    sum += (a * Math.cos(phase) + b * Math.sin(phase)) * Math.sin((k * Math.PI * x) / length);
  }
  return sum;
}

const basisCache = new Map<string, Float64Array>();

function spatialBasis(length: number, samples: number, count: number): Float64Array {
  const key = `${length}|${samples}|${count}`;
  const cached = basisCache.get(key);
  if (cached) return cached;
  const basis = new Float64Array((samples + 1) * count);
  for (let i = 0; i <= samples; i++) {
    const x = (length * i) / samples;
    for (let k = 0; k < count; k++) {
      basis[i * count + k] = Math.sin(((k + 1) * Math.PI * x) / length);
    }
  }
  basisCache.set(key, basis);
  return basis;
}

/**
 * Puntos de la cuerda en el tiempo t. La base espacial sin(kπx/l) se calcula
 * una sola vez y sólo se recalculan las fases temporales de cada armónico.
 */
export function stringPoints(
  t: number,
  harmonics: readonly Harmonic[] = DEFAULT_HARMONICS,
  length: number = STRING.length,
  samples = 600,
): Point[] {
  const count = harmonics.length;
  const basis = spatialBasis(length, samples, count);
  const cosPhase = new Float64Array(count);
  const sinPhase = new Float64Array(count);
  for (let k = 0; k < count; k++) {
    const phase = ((k + 1) * Math.PI * STRING.speed * t) / length;
    cosPhase[k] = Math.cos(phase);
    sinPhase[k] = Math.sin(phase);
  }
  const points: Point[] = [];
  for (let i = 0; i <= samples; i++) {
    const x = (length * i) / samples;
    let y = 0;
    for (let k = 0; k < count; k++) {
      y += (harmonics[k]!.a * cosPhase[k]! + harmonics[k]!.b * sinPhase[k]!) * basis[i * count + k]!;
    }
    points.push([x, y]);
  }
  return points;
}
