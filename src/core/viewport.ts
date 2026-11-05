/**
 * Mapeo mundo ↔ pantalla.
 *
 * El original mapeaba x ∈ [-0.5, 19.5] e y ∈ [-0.5, 16.16], con el origen en
 * la esquina inferior izquierda; eso dejaba las curvas y todo el 3D recortados
 * contra el borde. Acá se conserva el lienzo de 600×500 y la escala de 30 px
 * por unidad, pero el origen se centra: x ∈ [-10, 10], y ∈ [-8.33, 8.33].
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 500;

const HALF_HEIGHT = CANVAS_HEIGHT / 2 / 30; // 8.333…

export const WORLD = {
  xMin: -10,
  xMax: 10,
  yMin: -HALF_HEIGHT,
  yMax: HALF_HEIGHT,
} as const;

/** px por unidad (600 / 20 = 500 / 16.66 = 30). */
export const SCALE_X = CANVAS_WIDTH / (WORLD.xMax - WORLD.xMin);
export const SCALE_Y = CANVAS_HEIGHT / (WORLD.yMax - WORLD.yMin);

export function screenX(x: number): number {
  return (x - WORLD.xMin) * SCALE_X;
}

export function screenY(y: number): number {
  return (WORLD.yMax - y) * SCALE_Y;
}

export function worldX(sx: number): number {
  return sx / SCALE_X + WORLD.xMin;
}

export function worldY(sy: number): number {
  return WORLD.yMax - sy / SCALE_Y;
}

export function toScreen(x: number, y: number): [number, number] {
  return [screenX(x), screenY(y)];
}

export function toWorld(sx: number, sy: number): [number, number] {
  return [worldX(sx), worldY(sy)];
}

/** Proyección axonométrica del original (`Vector3D::axonometry`). */
export const AXONOMETRY = { alpha: Math.PI / 4, p: 0.5 } as const;

export function axonometry(
  x: number,
  y: number,
  z: number,
  alpha = AXONOMETRY.alpha,
  p = AXONOMETRY.p,
): [number, number] {
  return [x + p * y * Math.cos(alpha), z + p * y * Math.sin(alpha)];
}
