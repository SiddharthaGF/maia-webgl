import { describe, expect, it } from 'vitest';
import { Plot, circlePoints } from '../src/core/plot';

describe('Plot', () => {
  it('descarta píxeles repetidos al muestrear fino', () => {
    const plot = new Plot();
    plot.stroke(
      [
        [0, 0],
        [0, 0],
        [0.01, 0],
        [0.02, 0],
      ],
      '#000000',
    );
    // 0 y 0.01 caen en el mismo píxel: quedan 2 vértices (un segmento).
    expect(plot.lineVertices).toHaveLength(10);
    expect(plot.lineVertices.slice(0, 2)).toEqual([300, 250]);
  });

  it('no conecta polilíneas distintas', () => {
    const plot = new Plot();
    plot.stroke(
      [
        [0, 0],
        [1, 1],
      ],
      '#000000',
    );
    plot.stroke(
      [
        [5, 5],
        [6, 6],
      ],
      '#000000',
    );
    expect(plot.lineVertices).toHaveLength(20);
  });

  it('ignora puntos no finitos', () => {
    const plot = new Plot();
    plot.stroke(
      [
        [Number.NaN, 0],
        [1, Number.POSITIVE_INFINITY],
      ],
      '#000000',
    );
    expect(plot.isEmpty).toBe(true);
  });

  it('acumula puntos 3D y segmentos en pantalla', () => {
    const plot = new Plot();
    plot.point(0, 0, '#ff0000');
    plot.segmentScreen(0, 0, 10, 10, '#0000ff');
    expect(plot.pointVertices).toHaveLength(5);
    expect(plot.lineVertices).toHaveLength(10);
  });

  it('genera circunferencias cerradas', () => {
    const points = circlePoints(0, 0, 2);
    expect(points.length).toBeGreaterThan(100);
    expect(points[0]![0]).toBeCloseTo(2, 6);
    const last = points[points.length - 1]!;
    expect(last[0]).toBeCloseTo(2, 6);
    expect(last[1]).toBeCloseTo(0, 6);
  });
});
