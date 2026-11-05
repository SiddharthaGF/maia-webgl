/** Parcial 1: primitivas de dibujo y curvas. */

import { c } from '../core/palette';
import { curvePoints, sampleParametric } from '../primitives/curves';
import type { Scene } from './types';

export const PARCIAL1: readonly Scene[] = [
  {
    id: 'interpolar',
    label: 'Interpolar',
    tab: 1,
    description:
      'Degradado lineal verde→rojo evaluado por píxel. En el original se recorrían las 600 columnas y se calculaba el color con una recta.',
    render(ctx) {
      ctx.field = {
        mode: 'gradient',
        time: 0,
        colorA: c.green!,
        colorB: c.red!,
      };
    },
  },
  {
    id: 'segmentos',
    label: 'Segmentos y Círculos',
    tab: 1,
    description:
      'Tres segmentos y tres circunferencias de `segment.h` y `circuference.h`, con las coordenadas y colores exactos del proyecto.',
    render({ plot }) {
      plot.segment(-10, -2, 6, 4, c.purple!);
      plot.segment(6, 0, 6, 4, c.chocolate!);
      plot.segment(6, 4, 10, 8.33, c.red!);

      plot.circle(-2, -1, 3, c.fuchsia!);
      plot.circle(-3, 1.2, 0.3, c.blue!);
      plot.circle(6, 4, 1, c.red!);
    },
  },
  {
    id: 'pixel',
    label: 'Encender Pixel',
    tab: 1,
    description:
      'La parábola y = x² entre −2 y 0 y la recta y = x entre 0 y 2: el primer contacto con el encendido de píxeles.',
    render({ plot }) {
      plot.stroke(
        sampleParametric((x) => [x, x * x], -2, 0, 0.01),
        c.purple!,
      );
      plot.stroke(sampleParametric((x) => [x, x], 0, 2, 0.01), c.red!);
    },
  },
  {
    id: 'curvas',
    label: 'Curvas',
    tab: 1,
    description:
      'Tres de las siete curvas de `curve_v.h`: rosa de tres pétalos, mariposa y epitrocoide, cada una con su centro y radio.',
    render({ plot }) {
      plot.stroke(curvePoints(1, 2.2, 3, -1), c.purple!);
      plot.stroke(curvePoints(6, 1, -3, 3), c.darkcyan!);
      plot.stroke(curvePoints(5, 1.5, -6, -3), c.green!);
    },
  },
  {
    id: 'curvas2',
    label: 'Curvas 2',
    tab: 1,
    description:
      'Tres rosetones de cuatro pétalos (tipo 4). En el original las tres figuras reutilizaban el mismo `type = 4` y solo cambiaban radio, centro y color.',
    render({ plot }) {
      plot.stroke(curvePoints(4, 2.2, -7, 5.5), c.purple!);
      plot.stroke(curvePoints(4, 2, 3, -5.5), c.red!);
      plot.stroke(curvePoints(4, 1.5, 7, 3), c.blue!);
    },
  },
  {
    id: 'letra-g',
    label: 'Dibujar letra G',
    tab: 1,
    description:
      'La letra G del original, traducida de sus seis bucles de `setPixelColor(300…360, 200…280)` a segmentos de pantalla.',
    render({ plot }) {
      const strokes: Array<Array<[number, number]>> = [
        [
          [300, 200],
          [300, 280],
        ],
        [
          [300, 280],
          [360, 280],
        ],
        [
          [300, 200],
          [360, 200],
        ],
        [
          [360, 200],
          [360, 220],
        ],
        [
          [360, 240],
          [360, 280],
        ],
        [
          [330, 240],
          [360, 240],
        ],
      ];
      for (const stroke of strokes) plot.strokeScreen(stroke, c.purple!);
    },
  },
];
