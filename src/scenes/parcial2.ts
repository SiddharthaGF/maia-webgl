/** Parcial 2: cálculo, texturas, animación y curvas de nivel. */

import { c } from '../core/palette';
import { lagrangeCurve, sampleParametric } from '../primitives/curves';
import {
  TEXTURE_GRADIENT_PALETTE,
  drawAxes,
  texturePalette,
} from './helpers';
import type { Scene } from './types';

/** Trayectoria por tramos de `on_btn_off_curve_clicked`. */
export function ballPath(t: number): [number, number] {
  if (t < -2) return [t, -(t * t + 10 * t + 16) / 2.25];
  if (t < 2) return [t, -(t * t - 4) / 1.333];
  return [t, -(t * t - 6 * t + 8) / 0.5];
}

const REFLECTION = {
  incidence: [0, 0] as const,
  from: [4, 4] as const,
  to: [-4, 4] as const,
};

const BALL_PERIOD = 6; // segundos para recorrer los 12 unidades de t

export const PARCIAL2: readonly Scene[] = [
  {
    id: 'curvas-p2',
    label: 'Curvas',
    tab: 2,
    description:
      'Cinco familias en los mismos ejes: exponencial 2^t, parábola, logaritmo, seno y cúbica. Las ramas que se salen del lienzo se recortan como en el QImage.',
    render({ plot }) {
      drawAxes(plot);
      plot.stroke(sampleParametric((t) => [t, 2 ** t], -8, 8, 0.008), c.red!);
      plot.stroke(
        sampleParametric((t) => [t, (t * t) / 5 - 3], -8, 8, 0.008),
        c.blue!,
      );
      plot.stroke(
        sampleParametric((t) => [t, Math.log(t)], 0.01, 8, 0.008),
        c.purple!,
      );
      plot.stroke(
        sampleParametric((t) => [t, Math.sin(3 * Math.E * t)], -8, 8, 0.006),
        c.green!,
      );
      plot.stroke(
        sampleParametric((t) => [t, t ** 3 + t ** 2 + 2], -8, 8, 0.008),
        c.fuchsia!,
      );
    },
  },
  {
    id: 'taylor',
    label: 'Taylor',
    tab: 2,
    description:
      '3^t frente a su polinomio de Taylor de grado 4 en torno a 0: 1 + 1.098t + 0.603t² + 0.22t³ + 0.06t⁴.',
    render({ plot }) {
      drawAxes(plot);
      plot.stroke(
        sampleParametric((t) => [t, 3 ** t], -8, 8, 0.008),
        c.red!,
      );
      plot.stroke(
        sampleParametric(
          (t) => [t, 1 + 1.098 * t + 0.603 * t ** 2 + 0.22 * t ** 3 + 0.06 * t ** 4],
          -8,
          8,
          0.008,
        ),
        c.green!,
      );
    },
  },
  {
    id: 'interpolacion',
    label: 'Curva Interpolada',
    tab: 2,
    description:
      'Polinomio de Lagrange por 7 puntos de 3·cos(x/2). El original dibujaba solo una parábola; acá se completa la idea de interpolar.',
    render({ plot }) {
      drawAxes(plot);
      const points: Array<[number, number]> = [];
      for (let i = 0; i < 7; i++) {
        const x = -8 + (16 * i) / 6;
        points.push([x, 3 * Math.cos(x / 2)]);
      }
      plot.stroke(lagrangeCurve(points), c.purple!);
      for (const [x, y] of points) plot.circle(x, y, 0.12, c.darkred!);
    },
  },
  {
    id: 'tangente',
    label: 'Recta Tangente',
    tab: 2,
    description:
      'Tangentes a y = −0.03x² + 3 en x = −5, 0 y 3 (m = −0.06x). La parábola gris es la referencia que el original omitía.',
    render({ plot }) {
      drawAxes(plot);
      plot.stroke(
        sampleParametric((t) => [t, -0.03 * t ** 2 + 3], -10, 10, 0.01),
        c.lightgray!,
      );
      for (const xa of [3, -5, 0]) {
        const ya = -0.03 * xa ** 2 + 3;
        const m = -0.06 * xa;
        const b = ya - m * xa;
        plot.segment(-10, b + m * -10, 10, b + m * 10, c.green!);
      }
    },
  },
  {
    id: 'texturas',
    label: 'Texturas',
    tab: 2,
    description:
      'Los ocho patrones de `combo_textures` (senos, logaritmos, coprimos) evaluados por píxel con la paleta del original. Elegí el patrón abajo.',
    controls: ['texture'],
    defaults: { texture: 1 },
    render(ctx) {
      ctx.field = {
        mode: 'texture',
        time: 0,
        texture: ctx.params.texture,
        palette: texturePalette(ctx.params.texture),
      };
    },
  },
  {
    id: 'textura-degradada',
    label: 'Textura (degradado)',
    tab: 2,
    description:
      'El botón «Textura»: franjas verticales con fmod(i·cos i, 15) sobre un degradado azul de 15 colores generado en tiempo de ejecución.',
    render(ctx) {
      ctx.field = {
        mode: 'texture',
        time: 0,
        texture: 9,
        palette: TEXTURE_GRADIENT_PALETTE,
      };
    },
  },
  {
    id: 'pelota',
    label: 'Animar Pelota',
    tab: 2,
    animated: true,
    description:
      'La pelota recorre la trayectoria por tramos del original (tres parábolas entre t = −8 y 4). El rastro gris y los ejes son una ayuda visual añadida.',
    render({ plot, t }) {
      drawAxes(plot);
      plot.stroke(
        sampleParametric((v) => ballPath(v), -8, 4, 0.02),
        c.lightgray!,
      );
      const phase = (-8 + (((t * 12) / BALL_PERIOD) % 12) + 12) % 12;
      const current = -8 + phase;
      const [x, y] = ballPath(current);
      plot.circle(x, y, 0.3, c.red!);
      plot.circle(x, y, 0.12, c.darkred!);
    },
  },
  {
    id: 'reflexion',
    label: 'Reflexión',
    tab: 2,
    animated: true,
    description:
      'Ley de reflexión sobre el eje y = 0: el rayo rojo (4,4)→(0,0) sale por el verde (0,0)→(−4,4). El original tenía el punto de incidencia en y = −8.33, fuera del lienzo.',
    render({ plot, t }) {
      drawAxes(plot);
      plot.dashedSegment(0, -2, 0, 6, c.lightgray!);
      plot.segment(
        REFLECTION.from[0],
        REFLECTION.from[1],
        REFLECTION.incidence[0],
        REFLECTION.incidence[1],
        c.red!,
      );
      plot.segment(
        REFLECTION.incidence[0],
        REFLECTION.incidence[1],
        REFLECTION.to[0],
        REFLECTION.to[1],
        c.green!,
      );
      plot.circle(REFLECTION.incidence[0], REFLECTION.incidence[1], 0.12, c.black!);
      // Recorrido de ida y vuelta por el vértice.
      const phase = (t * 0.9) % 2;
      const s = phase <= 1 ? phase : 2 - phase;
      const [x, y] =
        s <= 1
          ? [
              REFLECTION.from[0] + (REFLECTION.incidence[0] - REFLECTION.from[0]) * s,
              REFLECTION.from[1] + (REFLECTION.incidence[1] - REFLECTION.from[1]) * s,
            ]
          : [
              REFLECTION.incidence[0] + (REFLECTION.to[0] - REFLECTION.incidence[0]) * (s - 1),
              REFLECTION.incidence[1] + (REFLECTION.to[1] - REFLECTION.incidence[1]) * (s - 1),
            ];
      plot.circle(x, y, 0.2, c.blue!);
    },
  },
  {
    id: 'nivel',
    label: 'Curvas de nivel',
    tab: 2,
    description:
      'Familia y = k·e^(−4t) para k = 3, 6, 8, −4, −7, −5 y −10: curvas de nivel de la misma exponencial.',
    render({ plot }) {
      drawAxes(plot);
      const levels: Array<[number, string]> = [
        [3, c.purple!],
        [6, c.green!],
        [8, c.blue!],
        [-4, c.darkcyan!],
        [-7, c.fuchsia!],
        [-5, c.yellow!],
        [-10, c.royalblue!],
      ];
      for (const [k, color] of levels) {
        plot.stroke(
          sampleParametric((t) => [t, k * Math.exp(-4 * t)], -8, 8, 0.01),
          color,
        );
      }
    },
  },
];

