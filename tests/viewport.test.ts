import { describe, expect, it } from 'vitest';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  SCALE_X,
  SCALE_Y,
  WORLD,
  axonometry,
  screenX,
  screenY,
  toScreen,
  toWorld,
  worldX,
  worldY,
} from '../src/core/viewport';

describe('viewport cartesiano', () => {
  it('mapea las esquinas del mundo a las esquinas del lienzo', () => {
    expect(toScreen(WORLD.xMin, WORLD.yMax)).toEqual([0, 0]);
    const [sx, sy] = toScreen(WORLD.xMax, WORLD.yMin);
    expect(sx).toBeCloseTo(CANVAS_WIDTH, 6);
    expect(sy).toBeCloseTo(CANVAS_HEIGHT, 6);
  });

  it('usa 30 px por unidad y centra el origen', () => {
    expect(SCALE_X).toBeCloseTo(30, 6);
    expect(SCALE_Y).toBeCloseTo(30, 6);
    expect(screenX(0)).toBeCloseTo(300, 6);
    expect(screenY(0)).toBeCloseTo(250, 6);
  });

  it('invierte el eje y (y crece hacia arriba)', () => {
    expect(screenY(1)).toBeLessThan(screenY(0));
  });

  it('round-trip pantalla → mundo → pantalla', () => {
    for (const [x, y] of [
      [WORLD.xMin, WORLD.yMin],
      [0, 0],
      [3.25, 7.5],
      [WORLD.xMax, WORLD.yMax],
    ] as const) {
      const [sx, sy] = toScreen(x, y);
      const [wx, wy] = toWorld(sx, sy);
      expect(wx).toBeCloseTo(x, 10);
      expect(wy).toBeCloseTo(y, 10);
      expect(worldX(screenX(x))).toBeCloseTo(x, 10);
      expect(worldY(screenY(y))).toBeCloseTo(y, 10);
    }
  });

  it('proyecta en axonométrico como Vector3D del original', () => {
    const [ax, ay] = axonometry(1, 2, 3);
    expect(ax).toBeCloseTo(1 + 0.5 * 2 * Math.cos(Math.PI / 4), 10);
    expect(ay).toBeCloseTo(3 + 0.5 * 2 * Math.sin(Math.PI / 4), 10);
  });
});
