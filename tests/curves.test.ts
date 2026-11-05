import { describe, expect, it } from 'vitest';
import {
  curvePoints,
  lagrangeAt,
  lagrangeCurve,
  sampleParametric,
} from '../src/primitives/curves';

describe('curvas', () => {
  it('muestrea una parábola sin perder puntos', () => {
    const points = sampleParametric((t) => [t, t * t], -2, 2, 0.01);
    expect(points.length).toBe(401);
    expect(points[0]).toEqual([-2, 4]);
    expect(points.at(-1)).toEqual([2, 4]);
  });

  it('descarta valores no finitos', () => {
    const points = sampleParametric(
      (t) => [t, t === 0 ? Number.NaN : 1 / t],
      -1,
      1,
      0.1,
    );
    expect(points.every(([, y]) => Number.isFinite(y))).toBe(true);
  });

  it('reproduce la rosa de tres pétalos (tipo 1)', () => {
    const [first] = curvePoints(1, 2, 3, -1);
    expect(first![0]).toBeCloseTo(3, 6);
    expect(first![1]).toBeCloseTo(1, 6);
  });

  it('reproduce el astroide (tipo 3)', () => {
    const points = curvePoints(3, 2, 0, 0);
    // El astroide x = r·sin³t, y = r·cos³t alcanza (0, ±r) y (±r, 0).
    expect(Math.max(...points.map(([x]) => x))).toBeCloseTo(2, 2);
    expect(Math.min(...points.map(([x]) => x))).toBeCloseTo(-2, 2);
    expect(Math.max(...points.map(([, y]) => y))).toBeCloseTo(2, 2);
    expect(points.some(([x, y]) => x > 1.99 && Math.abs(y) < 0.01)).toBe(true);
  });

  it('el polinomio de Lagrange pasa exactamente por los nodos', () => {
    const nodes: Array<[number, number]> = [
      [-8, 1],
      [-3, 4],
      [0, 2],
      [4, -1],
      [8, 5],
    ];
    for (const [x, y] of nodes) {
      expect(lagrangeAt(nodes, x)).toBeCloseTo(y, 10);
    }
  });

  it('genera la curva interpolada en el dominio de los nodos', () => {
    const nodes: Array<[number, number]> = [
      [-2, 4],
      [0, 0],
      [2, 4],
    ];
    const curve = lagrangeCurve(nodes, 100);
    expect(curve[0]![0]).toBe(-2);
    expect(curve.at(-1)![0]).toBe(2);
    expect(curve[50]![1]).toBeCloseTo(0, 1);
  });

  it('devuelve vacío para tipos desconocidos', () => {
    expect(curvePoints(99, 1, 0, 0)).toEqual([]);
  });
});
