import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HARMONICS,
  fourierHarmonics,
  stringAt,
  stringPoints,
} from '../src/primitives/string';

describe('cuerda vibrante', () => {
  it('calcula los coeficientes del perfil triangular y g(x)=0.5', () => {
    const [first] = fourierHarmonics(6, 1, 20);
    expect(first!.a).toBeCloseTo(36 / (Math.PI * Math.PI), 12);
    expect(first!.b).toBeCloseTo(12 / (Math.PI * Math.PI), 12);
    const [even] = fourierHarmonics(6, 1, 2).slice(1);
    expect(even!.a).toBe(0);
    expect(even!.b).toBe(0);
  });

  it('la serie aproxima la forma inicial en el centro', () => {
    // f(3) = 4.5 con 40 armónicos (la serie de senos converge en el interior).
    expect(stringAt(3, 0)).toBeCloseTo(4.5, 0);
  });

  it('respeta las condiciones de borde', () => {
    expect(stringAt(0, 0.7)).toBeCloseTo(0, 10);
    expect(stringAt(6, 0.7)).toBeCloseTo(0, 10);
  });

  it('la animación se mantiene acotada', () => {
    for (let t = 0; t < 10; t += 0.25) {
      const ok = stringPoints(t).every(
        ([x, y]) => Number.isFinite(y) && Math.abs(y) < 20 && x >= 0 && x <= 6,
      );
      expect(ok, `t = ${t}`).toBe(true);
    }
  });

  it('usa 40 armónicos por defecto', () => {
    expect(DEFAULT_HARMONICS).toHaveLength(40);
  });
});
