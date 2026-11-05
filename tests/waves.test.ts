import { describe, expect, it } from 'vitest';
import {
  interference3DZ,
  interferenceWaveZ,
  paletteIndex,
  simpleWaveData,
  simpleWaveZ,
  wave3DZ,
} from '../src/primitives/waves';

const settings = { w: 1.5, v: 9.3, m: 1 };
const source: readonly [number, number] = [-5, 0];

describe('ondas 2D', () => {
  it('la onda simple vale m·sin(0)+1 en el foco y t=0', () => {
    expect(simpleWaveZ(-5, 0, 0, settings, source)).toBeCloseTo(1, 12);
    expect(simpleWaveData(-5, 0, 0, settings, source)).toBeCloseTo(7.5, 12);
    expect(paletteIndex(1)).toBe(7);
  });

  it('la interferencia suma las tres fuentes en el origen y t=0', () => {
    const expected = 1 + 2 * (Math.sin(1.5 * Math.sqrt(20)) + 1);
    expect(interferenceWaveZ(0, 0, 0, settings)).toBeCloseTo(expected, 12);
    expect(paletteIndex(3, 2.5)).toBe(7);
  });

  it('la paleta se recorta a 16 bandas', () => {
    expect(paletteIndex(-10)).toBe(0);
    expect(paletteIndex(100)).toBe(15);
    expect(paletteIndex(Number.NaN)).toBe(0);
    expect(paletteIndex(2)).toBe(15);
  });
});

describe('ondas 3D', () => {
  it('la onda 3D vale 0 en el origen y t=0', () => {
    expect(wave3DZ(0, 0, 0, settings)).toBeCloseTo(0, 12);
  });

  it('la interferencia 3D suma dos fuentes en (0, ±3)', () => {
    // En el origen las dos distancias son 3 y el desfase es el mismo.
    expect(interference3DZ(0, 0, 0, settings)).toBeCloseTo(
      2 * Math.sin(1.5 * 3),
      12,
    );
  });
});
