/** Curvas paramétricas y utilidades de muestreo. */

export type Point = [number, number];

export function sampleParametric(
  fn: (t: number) => Point,
  t0: number,
  t1: number,
  step = 0.008,
): Point[] {
  const points: Point[] = [];
  if (!(t1 > t0) || !(step > 0)) return points;
  const count = Math.min(200_000, Math.ceil((t1 - t0) / step));
  for (let i = 0; i <= count; i++) {
    const t = t0 + ((t1 - t0) * i) / count;
    const [x, y] = fn(t);
    if (Number.isFinite(x) && Number.isFinite(y)) points.push([x, y]);
  }
  return points;
}

/** Las siete curvas de `curve_v.h`, con el mismo centro y radio. */
export function curvePoints(
  type: number,
  radius: number,
  cx: number,
  cy: number,
): Point[] {
  const r1 = 1.8;
  const r2 = 1.3;
  switch (type) {
    case 1:
      return sampleParametric(
        (t) => [cx + radius * Math.sin(2 * t), cy + radius * Math.cos(3 * t)],
        0,
        2 * Math.PI,
      );
    case 2:
      return sampleParametric(
        (t) => [
          cx + radius * Math.cos(4 * t) * Math.cos(t),
          cy + radius * Math.cos(4 * t) * Math.sin(t),
        ],
        0,
        2 * Math.PI,
      );
    case 3:
      return sampleParametric(
        (t) => [
          cx + radius * Math.sin(t) ** 3,
          cy + radius * Math.cos(t) ** 3,
        ],
        0,
        2 * Math.PI,
      );
    case 4:
      return sampleParametric(
        (t) => [
          cx + radius * Math.sin(1.6 * t) * Math.cos(t),
          cy + radius * Math.sin(1.6 * t) * Math.sin(t),
        ],
        0,
        10 * Math.PI,
      );
    case 5:
      return sampleParametric(
        (t) => [
          cx + (r1 - r2) * Math.cos(t) + r2 * Math.cos(t * (1 - r1 / r2)),
          cy + (r1 - r2) * Math.sin(t) + r2 * Math.sin(t * (1 - r1 / r2)),
        ],
        0,
        26 * Math.PI,
      );
    case 6:
      return sampleParametric(
        (t) => {
          const factor =
            Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) - Math.sin(t / 12) ** 5;
          return [
            cx + radius * Math.sin(t) * factor,
            cy + radius * Math.cos(t) * factor,
          ];
        },
        0,
        12 * Math.PI,
      );
    case 7:
      return sampleParametric(
        (t) => [
          cx + (r1 + r2) * Math.cos(t) + r2 * Math.cos(t * (1 + r1 / r2)),
          cy + (r1 + r2) * Math.sin(t) + r2 * Math.sin(t * (1 + r1 / r2)),
        ],
        0,
        26 * Math.PI,
      );
    default:
      return [];
  }
}

/**
 * Forma de Lagrange del polinomio que pasa por los puntos dados.
 * Se usa en «Curva interpolada», donde el original solo dibujaba una parábola.
 */
export function lagrangeAt(points: readonly Point[], x: number): number {
  let result = 0;
  for (let i = 0; i < points.length; i++) {
    const [xi, yi] = points[i]!;
    let term = yi;
    for (let j = 0; j < points.length; j++) {
      if (j === i) continue;
      const [xj] = points[j]!;
      term *= (x - xj) / (xi - xj);
    }
    result += term;
  }
  return result;
}

export function lagrangeCurve(points: readonly Point[], samples = 600): Point[] {
  if (points.length < 2) return [];
  const xs = points.map(([x]) => x);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  return sampleParametric(
    (x) => [x, lagrangeAt(points, x)],
    x0,
    x1,
    (x1 - x0) / samples,
  );
}
