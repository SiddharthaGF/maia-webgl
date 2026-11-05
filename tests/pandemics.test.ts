import { describe, expect, it } from 'vitest';
import {
  EPIDEMIC,
  epidemicSeries,
  logistic,
  rk4Series,
} from '../src/primitives/pandemics';

describe('pandemia logística', () => {
  it('la solución analítica arranca en y0 y satura en M', () => {
    expect(logistic(0, 0.0013)).toBeCloseTo(EPIDEMIC.y0, 10);
    expect(logistic(200, 0.0013)).toBeCloseTo(EPIDEMIC.capacity, 6);
  });

  it('RK4 con h=0.5 produce 40 pasos monótonos', () => {
    const series = epidemicSeries('rk-h05');
    expect(series).toHaveLength(40);
    expect(series[0]!.t).toBe(0.5);
    for (let i = 1; i < series.length; i++) {
      expect(series[i]!.y).toBeGreaterThan(series[i - 1]!.y);
      expect(series[i]!.y).toBeLessThanOrEqual(EPIDEMIC.capacity + 1e-6);
    }
  });

  it('las tres variantes terminan cerca de la capacidad', () => {
    for (const variant of ['rk-h05', 'rk-h1', 'analytic'] as const) {
      const series = epidemicSeries(variant);
      expect(series.at(-1)!.y).toBeGreaterThan(450);
      expect(series.at(-1)!.y).toBeLessThanOrEqual(EPIDEMIC.capacity + 1e-3);
    }
  });

  it('RK4 se aproxima a la solución analítica con el mismo γ', () => {
    const numeric = rk4Series({ gamma: 0.0013, h: 0.1, method: 'rk4' });
    const last = numeric.at(-1)!;
    expect(last.y).toBeCloseTo(logistic(last.t, 0.0013), 3);
  });

  it('no divide por cero con h inválido', () => {
    expect(rk4Series({ gamma: 0.001, h: 0, method: 'rk4' })).toEqual([]);
  });
});
