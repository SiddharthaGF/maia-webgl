/**
 * Acumulador de primitivas en espacio de pantalla.
 *
 * El original escribía píxeles con `QImage::setPixelColor`; acá cada punto se
 * redondea a un píxel entero y se descartan los repetidos, de modo que una
 * curva muestreada muy fino se convierte en la misma polilínea de 1 px que se
 * veía en Qt. El renderer sube estos vértices a la GPU una vez por frame.
 */

import { parseColor } from './palette';
import { screenX, screenY } from './viewport';

const FLOATS_PER_VERTEX = 5;
/** Descarta coordenadas absurdas (exponenciales, 3^t) antes de la GPU. */
const CLIP_LIMIT = 20_000;

function inRange(x: number, y: number): boolean {
  return Math.abs(x) <= CLIP_LIMIT && Math.abs(y) <= CLIP_LIMIT;
}

export class Plot {
  /** x, y, r, g, b por vértice. */
  readonly lineVertices: number[] = [];
  readonly pointVertices: number[] = [];

  private lastPixel: [number, number] | null = null;

  reset(): void {
    this.lineVertices.length = 0;
    this.pointVertices.length = 0;
    this.lastPixel = null;
  }

  get isEmpty(): boolean {
    return this.lineVertices.length === 0 && this.pointVertices.length === 0;
  }

  /** Traza una polilínea en coordenadas del mundo. */
  stroke(points: Iterable<readonly [number, number]>, color: string): void {
    const [r, g, b] = parseColor(color);
    this.lastPixel = null;
    for (const [x, y] of points) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      const sx = Math.round(screenX(x));
      const sy = Math.round(screenY(y));
      if (!inRange(sx, sy)) {
        this.lastPixel = null;
        continue;
      }
      this.pushLinePixel(sx, sy, [r, g, b]);
    }
  }

  /** Traza una polilínea ya expresada en píxeles del lienzo. */
  strokeScreen(points: Iterable<readonly [number, number]>, color: string): void {
    const [r, g, b] = parseColor(color);
    this.lastPixel = null;
    for (const [x, y] of points) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      const sx = Math.round(x);
      const sy = Math.round(y);
      if (!inRange(sx, sy)) {
        this.lastPixel = null;
        continue;
      }
      this.pushLinePixel(sx, sy, [r, g, b]);
    }
  }

  segment(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: string,
  ): void {
    this.stroke(
      [
        [x0, y0],
        [x1, y1],
      ],
      color,
    );
  }

  segmentScreen(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: string,
  ): void {
    this.strokeScreen(
      [
        [x0, y0],
        [x1, y1],
      ],
      color,
    );
  }

  circle(cx: number, cy: number, radius: number, color: string): void {
    this.stroke(circlePoints(cx, cy, radius), color);
  }

  /** Un solo píxel (para las nubes de puntos 3D). */
  point(x: number, y: number, color: string): void {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    this.pushPoint(
      Math.round(screenX(x)),
      Math.round(screenY(y)),
      parseColor(color),
    );
  }

  pointScreen(x: number, y: number, color: string): void {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    this.pushPoint(Math.round(x), Math.round(y), parseColor(color));
  }

  /** Segmento punteado, usado para la recta normal de la reflexión. */
  dashedSegment(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: string,
    dash = 8,
    gap = 6,
  ): void {
    const sx0 = screenX(x0);
    const sy0 = screenY(y0);
    const sx1 = screenX(x1);
    const sy1 = screenY(y1);
    const length = Math.hypot(sx1 - sx0, sy1 - sy0);
    if (length === 0) return;
    const ux = (sx1 - sx0) / length;
    const uy = (sy1 - sy0) / length;
    for (let d = 0; d < length; d += dash + gap) {
      const end = Math.min(d + dash, length);
      this.segmentScreen(
        sx0 + ux * d,
        sy0 + uy * d,
        sx0 + ux * end,
        sy0 + uy * end,
        color,
      );
    }
  }

  get vertexCount(): number {
    return (
      this.lineVertices.length / FLOATS_PER_VERTEX +
      this.pointVertices.length / FLOATS_PER_VERTEX
    );
  }

  private pushLinePixel(
    x: number,
    y: number,
    color: readonly [number, number, number],
  ): void {
    const last = this.lastPixel;
    if (last && last[0] === x && last[1] === y) {
        return;
    }
    const [r, g, b] = color;
    if (last) {
      this.lineVertices.push(last[0], last[1], r, g, b, x, y, r, g, b);
    }
    this.lastPixel = [x, y];
  }

  private pushPoint(
    x: number,
    y: number,
    color: readonly [number, number, number],
  ): void {
    this.pointVertices.push(x, y, color[0], color[1], color[2]);
  }
}

/**
 * Puntos de una circunferencia con paso adaptado al radio: mantiene el trazo
 * de 1 px con muchas menos muestras que el `dt = 0.001` original.
 */
export function circlePoints(
  cx: number,
  cy: number,
  radius: number,
  step = 0.004,
): Array<[number, number]> {
  if (!(radius > 0) || !Number.isFinite(radius)) return [];
  const count = Math.max(24, Math.min(4096, Math.ceil((2 * Math.PI) / step)));
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= count; i++) {
    const t = (i / count) * 2 * Math.PI;
    points.push([cx + radius * Math.cos(t), cy + radius * Math.sin(t)]);
  }
  return points;
}
