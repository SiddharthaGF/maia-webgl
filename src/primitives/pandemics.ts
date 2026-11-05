/**
 * Simulación de pandemia del original: y' = γ·y·(M − y), M = 500, y0 = 1.
 * Se conservan las tres variantes (RK4 h=0.5, analítica y RK4 h=1) y sus γ.
 */

export interface EpidemicPoint {
  t: number;
  y: number;
}

export interface EpidemicOptions {
  gamma: number;
  h: number;
  tf?: number;
  y0?: number;
  capacity?: number;
  method: 'rk4' | 'analytic';
}

export const EPIDEMIC = {
  capacity: 500,
  y0: 1,
  t0: 0,
  tf: 20,
} as const;

export function logistic(
  t: number,
  gamma: number,
  capacity: number = EPIDEMIC.capacity,
  y0: number = EPIDEMIC.y0,
): number {
  return capacity / (1 + (capacity / y0 - 1) * Math.exp(-gamma * capacity * t));
}

function derivative(y: number, gamma: number, capacity: number): number {
  return gamma * y * (capacity - y);
}

export function rk4Series(options: EpidemicOptions): EpidemicPoint[] {
  const { gamma, h, method } = options;
  const tf = options.tf ?? EPIDEMIC.tf;
  const capacity = options.capacity ?? EPIDEMIC.capacity;
  let y: number = options.y0 ?? EPIDEMIC.y0;
  let t: number = EPIDEMIC.t0;
  const points: EpidemicPoint[] = [];
  if (!(h > 0)) return points;
  const guard = 10_000;
  for (let i = 0; i < guard && t < tf; i++) {
    if (method === 'analytic') {
      t = Math.min(t + h, tf);
      y = logistic(t, gamma, capacity, EPIDEMIC.y0);
    } else {
      const k1 = derivative(y, gamma, capacity);
      const k2 = derivative(y + (h / 2) * k1, gamma, capacity);
      const k3 = derivative(y + (h / 2) * k2, gamma, capacity);
      const k4 = derivative(y + h * k3, gamma, capacity);
      y += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      t = Math.min(t + h, tf);
    }
    points.push({ t, y });
  }
  return points;
}

export const EPIDEMIC_VARIANTS = {
  'rk-h05': { method: 'rk4', gamma: 0.0011, h: 0.5 },
  analytic: { method: 'analytic', gamma: 0.0013, h: 1 },
  'rk-h1': { method: 'rk4', gamma: 0.0011, h: 1 },
} as const satisfies Record<
  string,
  { method: 'rk4' | 'analytic'; gamma: number; h: number }
>;

export type EpidemicVariant = keyof typeof EPIDEMIC_VARIANTS;

export function epidemicSeries(variant: EpidemicVariant): EpidemicPoint[] {
  const config = EPIDEMIC_VARIANTS[variant];
  return rk4Series({
    gamma: config.gamma,
    h: config.h,
    method: config.method,
  });
}
