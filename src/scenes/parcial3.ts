/** Parcial 3: 3D axonométrico, ondas, cuerda vibrante y pandemia. */

import { PALETTE0, c } from '../core/palette';
import { sampleParametric } from '../primitives/curves';
import {
  EPIDEMIC_VARIANTS,
  epidemicSeries,
  type EpidemicVariant,
} from '../primitives/pandemics';
import { STRING, stringPoints } from '../primitives/string';
import {
  interference3DZ,
  interferenceWaveZ,
  simpleWaveData,
  wave3DZ,
} from '../primitives/waves';
import {
  GRAY_WAVE_PALETTE,
  csvText,
  drawPlatform,
  makeTable,
  point3D,
  project3D,
} from './helpers';
import type { Scene, SceneParams } from './types';

// El original usaba (−5, 0); con el plano centrado el foco va al centro.
const SIMPLE_SOURCE: readonly [number, number] = [0, 0];

function wave2DTable(
  kind: 'simple' | 'interference',
  params: SceneParams,
): ReturnType<typeof makeTable> {
  const xs = Array.from({ length: 21 }, (_, i) => -10 + i);
  const ys = Array.from({ length: 17 }, (_, i) => 8 - i);
  const value = (x: number, y: number): number =>
    kind === 'simple'
      ? simpleWaveData(x, y, 0, params, [0, 0])
      : interferenceWaveZ(x, y, 0, params) * 2.5;
  const rows = ys.map((y) => [
    String(y),
    ...xs.map((x) => value(x, y).toFixed(2)),
  ]);
  const csvRows: number[][] = [];
  for (let y = -8; y <= 8; y += 0.5) {
    for (let x = -10; x <= 10; x += 0.5) {
      csvRows.push([x, y, value(x, y)]);
    }
  }
  return makeTable(
    kind === 'simple' ? 'Onda simple 2D' : 'Interferencia 2D',
    'Vista parcial de la malla centrada (x = −10…10, y = −8…8). El CSV trae la malla completa con paso 0.5.',
    ['y \\ x', ...xs.map(String)],
    rows,
    `${kind === 'simple' ? 'onda-simple' : 'interferencia'}-2d.csv`,
    csvText(
      ['x', 'y', 'indice_paleta'],
      csvRows.map(([x, y, v]) => [x!.toFixed(2), y!.toFixed(2), v!.toFixed(4)]),
    ),
  );
}

function wave3DTable(
  kind: 'simple' | 'interference',
  params: SceneParams,
): ReturnType<typeof makeTable> {
  const xs = Array.from({ length: 7 }, (_, i) => -9 + i * 3);
  const ys = Array.from({ length: 8 }, (_, i) => 7 - i * 2);
  const value = (x: number, y: number): number =>
    kind === 'simple'
      ? wave3DZ(x, y, 0, params)
      : interference3DZ(x, y, 0, params);
  const rows = ys.map((y) => [
    String(y),
    ...xs.map((x) => value(x, y).toFixed(3)),
  ]);
  const csvRows: number[][] = [];
  for (let y = -7; y <= 7; y += 0.5) {
    for (let x = -9; x <= 9; x += 0.5) {
      csvRows.push([x, y, value(x, y)]);
    }
  }
  return makeTable(
    kind === 'simple' ? 'Onda simple 3D' : 'Interferencia 3D',
    'Altura z de la malla (x = −9…9, y = −7…7). El CSV trae la malla completa con paso 0.5.',
    ['y \\ x', ...xs.map(String)],
    rows,
    `${kind === 'simple' ? 'onda' : 'interferencia'}-3d.csv`,
    csvText(
      ['x', 'y', 'z'],
      csvRows.map(([x, y, v]) => [x!.toFixed(2), y!.toFixed(2), v!.toFixed(4)]),
    ),
  );
}

function epidemicTable(variant: EpidemicVariant): ReturnType<typeof makeTable> {
  const series = epidemicSeries(variant);
  const labels: Record<EpidemicVariant, string> = {
    'rk-h05': 'Pandemia · RK4 (h = 0.5, γ = 0.0011)',
    analytic: 'Pandemia · solución analítica (γ = 0.0013)',
    'rk-h1': 'Pandemia · RK4 (h = 1, γ = 0.0011)',
  };
  return makeTable(
    labels[variant],
    'Modelo logístico y′ = γ·y·(500 − y), y(0) = 1. La tabla muestra t e y para cada paso.',
    ['t', 'y'],
    series.map(({ t, y }) => [t.toFixed(2), y.toFixed(4)]),
    `pandemia-${variant}.csv`,
    csvText(
      ['t', 'y'],
      series.map(({ t, y }) => [t.toFixed(4), y.toFixed(6)]),
    ),
  );
}

function epidemicScene(
  id: string,
  label: string,
  variant: EpidemicVariant,
  segmentColor: string,
  markerColor: string,
): Scene {
  return {
    id,
    label,
    tab: 3,
    description:
      variant === 'analytic'
        ? 'Solución exacta del modelo logístico con γ = 0.0013, superpuesta a los mismos ejes que las variantes numéricas.'
        : `Integración con Runge–Kutta 4 (h = ${EPIDEMIC_VARIANTS[variant].h}, γ = 0.0011) del modelo logístico y′ = γ·y·(500 − y).`,
    table: () => epidemicTable(variant),
    render({ plot }) {
      // Ejes al pie del plano centrado: el gráfico ocupa todo el lienzo.
      plot.segment(-9, -7, 9, -7, c.maroon!);
      plot.segment(-9, -7, -9, 7, c.maroon!);
      const series = epidemicSeries(variant);
      const maxY = Math.max(...series.map((p) => p.y), 1);
      const maxT = Math.max(...series.map((p) => p.t), 1);
      const kx = 18 / maxT;
      const ky = 14 / maxY;
      let previous: [number, number] | null = null;
      for (const { t, y } of series) {
        const point: [number, number] = [-9 + t * kx, -7 + y * ky];
        if (previous) {
          plot.segment(previous[0], previous[1], point[0], point[1], segmentColor);
        }
        plot.circle(point[0], point[1], 0.1, markerColor);
        previous = point;
      }
    },
  };
}

export const PARCIAL3: readonly Scene[] = [
  {
    id: 'vector-3d',
    label: 'Vector 3D',
    tab: 3,
    description:
      'Hélice paramétrica x = t/3 − 2, y = 1 + 3·sin t, z = 2 + 3·cos t, proyectada con la axonométrica del original (α = 45°, p = 0.5).',
    render({ plot }) {
      plot.stroke(
        sampleParametric(
          (t) => project3D(t / 3 - 2, 1 + 3 * Math.sin(t), 2 + 3 * Math.cos(t)),
          0,
          15,
          0.006,
        ),
        c.purple!,
      );
    },
  },
  {
    id: 'ecuaciones-3d',
    label: 'Ecuaciones 3D',
    tab: 3,
    description:
      'Tres superficies de puntos: un tubo helicoidal, una esfera y un toro, cada una con su color y sus ecuaciones paramétricas.',
    render({ plot }) {
      for (let t = 0; t <= 2 * Math.PI; t += 0.1) {
        for (let h = 0; h <= 9; h += 0.2) {
          point3D(plot, -4 + 2 * Math.cos(t), 1 + 3 * Math.sin(t), -2 + h / 3, c.purple!);
        }
      }
      for (let t = -Math.PI / 2; t <= Math.PI / 2; t += 0.1) {
        for (let h = 0; h <= 2 * Math.PI; h += 0.07) {
          point3D(
            plot,
            2 + 2 * Math.cos(t) * Math.cos(h),
            2 + 2 * Math.cos(t) * Math.sin(h),
            2 + 2 * Math.sin(t),
            c.red!,
          );
        }
      }
      for (let t = 0; t <= 2 * Math.PI; t += 0.1) {
        for (let h = 0; h <= 2 * Math.PI; h += 0.07) {
          const r = 0.8;
          point3D(
            plot,
            2 + r * (4 + Math.cos(t)) * Math.cos(h),
            -2 + r * (4 + Math.cos(t)) * Math.sin(h),
            -4 + r * Math.sin(t),
            c.blue!,
          );
        }
      }
    },
  },
  {
    id: 'onda-simple',
    label: 'Onda simple',
    tab: 3,
    controls: ['wave', 'speed'],
    description:
      'Onda circular 2D: z = m·sin(w·(r − v·t)) + 1 con foco en el centro, coloreada por bandas de la paleta gris. Movés los parámetros abajo.',
    render(ctx) {
      ctx.field = {
        mode: 'simple',
        time: 0,
        w: ctx.params.w,
        v: ctx.params.v,
        m: ctx.params.m,
        source: SIMPLE_SOURCE,
        palette: GRAY_WAVE_PALETTE,
      };
    },
    table: ({ params }) => wave2DTable('simple', params),
  },
  {
    id: 'interferencia',
    label: 'Interferencia',
    tab: 3,
    controls: ['wave'],
    description:
      'Suma de tres ondas circulares con focos en (−4, ±2) y (0, 0). Las bandas de color muestran las crestas y los nodos de la interferencia.',
    render(ctx) {
      ctx.field = {
        mode: 'interference',
        time: 0,
        w: ctx.params.w,
        v: ctx.params.v,
        m: ctx.params.m,
        palette: PALETTE0,
      };
    },
    table: ({ params }) => wave2DTable('interference', params),
  },
  {
    id: 'anim-onda',
    label: 'Animación Onda Simple',
    tab: 3,
    animated: true,
    controls: ['wave', 'speed'],
    description:
      'La misma onda simple animada en el tiempo. El original salteaba frames para rendir; acá la onda se evalúa entera en el shader.',
    render(ctx) {
      ctx.field = {
        mode: 'simple',
        time: ctx.t,
        w: ctx.params.w,
        v: ctx.params.v,
        m: ctx.params.m,
        source: [0, 0],
        palette: GRAY_WAVE_PALETTE,
      };
    },
  },
  {
    id: 'anim-interferencia',
    label: 'Animación Interferencia',
    tab: 3,
    animated: true,
    controls: ['wave', 'speed'],
    description:
      'Interferencia de tres focos en movimiento. Cambiá w, v o m para ver cómo se desplazan las líneas nodales.',
    render(ctx) {
      ctx.field = {
        mode: 'interference',
        time: ctx.t,
        w: ctx.params.w,
        v: ctx.params.v,
        m: ctx.params.m,
        palette: PALETTE0,
      };
    },
  },
  {
    id: 'onda-3d',
    label: 'Onda Simple 3D',
    tab: 3,
    animated: true,
    controls: ['wave', 'speed'],
    defaults: { m: 0.4, w: 2 },
    description:
      'Malla 3D de 181 × 141 puntos sobre la plataforma, con z = m·sin(w·(r − v·t)). Se dibuja con la proyección axonométrica.',
    render(ctx) {
      drawPlatform(ctx.plot);
      for (let x = -9; x <= 9; x += 0.1) {
        for (let y = -7; y <= 7; y += 0.1) {
          const z = wave3DZ(x, y, ctx.t, ctx.params);
          point3D(ctx.plot, x, y, z, c.crimson!);
        }
      }
    },
    table: ({ params }) => wave3DTable('simple', params),
  },
  {
    id: 'interferencia-3d',
    label: 'Interferencia 3D',
    tab: 3,
    animated: true,
    controls: ['wave', 'speed'],
    defaults: { m: 0.4, w: 2 },
    description:
      'Dos focos 3D en (0, ±3) sumados sobre la plataforma: la versión tridimensional de la interferencia.',
    render(ctx) {
      drawPlatform(ctx.plot);
      for (let x = -9; x <= 9; x += 0.1) {
        for (let y = -7; y <= 7; y += 0.1) {
          const z = interference3DZ(x, y, ctx.t, ctx.params);
          point3D(ctx.plot, x, y, z, c.royalblue!);
        }
      }
    },
    table: ({ params }) => wave3DTable('interference', params),
  },
  {
    id: 'plataforma',
    label: 'Plataforma 3D',
    tab: 3,
    description:
      'La plataforma de referencia de los demos 3D: cuatro niveles horizontales y diez verticales, varias de ellas fuera del lienzo a propósito.',
    render({ plot }) {
      drawPlatform(plot);
    },
  },
  {
    id: 'cuerda',
    label: 'Cuerda Vibrante',
    tab: 3,
    animated: true,
    controls: ['speed'],
    description:
      'Serie de Fourier de una cuerda pulsada: perfil triangular f(x) = 1.5·min(x, l−x) y velocidad g(x) = 0.5. Se usan 40 armónicos de la solución analítica.',
    render({ plot, t }) {
      // La cuerda mide 6 unidades: se traslada y se escala para encuadrarla.
      plot.stroke(
        stringPoints(t, undefined, STRING.length, 1200).map(
          ([x, y]) => [x * 2 - 6, y * 1.4 - 0.5] as [number, number],
        ),
        c.purple!,
      );
    },
  },
  epidemicScene('pandemia-rk05', 'Pandemia RK 0.5', 'rk-h05', c.purple!, c.red!),
  epidemicScene('pandemia-analitica', 'Pandemia Analítico', 'analytic', c.fuchsia!, c.blue!),
  epidemicScene('pandemia-rk1', 'Pandemia RK 1', 'rk-h1', c.purple!, c.red!),
];
