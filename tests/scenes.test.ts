import { describe, expect, it } from 'vitest';
import { Plot } from '../src/core/plot';
import { SCENES, findScene, scenesForTab } from '../src/scenes';
import { DEFAULT_PARAMS, type Scene, type SceneContext } from '../src/scenes/types';

function renderScene(scene: Scene, t = 0.7): { plot: Plot; field: unknown } {
  const plot = new Plot();
  const ctx: SceneContext = {
    plot,
    field: null,
    t,
    params: { ...DEFAULT_PARAMS, ...scene.defaults },
  };
  scene.render(ctx);
  return { plot, field: ctx.field };
}

describe('registro de escenas', () => {
  it('tiene 28 escenas con ids únicos', () => {
    expect(SCENES).toHaveLength(28);
    expect(new Set(SCENES.map((scene) => scene.id)).size).toBe(SCENES.length);
  });

  it('reparte 6, 9 y 13 escenas por parcial', () => {
    expect(scenesForTab(1)).toHaveLength(6);
    expect(scenesForTab(2)).toHaveLength(9);
    expect(scenesForTab(3)).toHaveLength(13);
  });

  it('busca por id y devuelve undefined si no existe', () => {
    expect(findScene('onda-simple')?.label).toBe('Onda simple');
    expect(findScene('no-existe')).toBeUndefined();
  });

  it('todas las escenas renderizan sin NaN y producen salida', () => {
    for (const scene of SCENES) {
      const { plot, field } = renderScene(scene);
      expect(field !== null || plot.vertexCount > 0, scene.id).toBe(true);
      const finite = [...plot.lineVertices, ...plot.pointVertices].every((value) =>
        Number.isFinite(value),
      );
      expect(finite, `${scene.id} generó un valor no finito`).toBe(true);
      expect(plot.lineVertices.length % 5).toBe(0);
      expect(plot.pointVertices.length % 5).toBe(0);
    }
  });

  it('las ocho texturas se pueden seleccionar', () => {
    const scene = findScene('texturas');
    expect(scene).toBeDefined();
    for (let texture = 1; texture <= 8; texture++) {
      const { field } = renderScene({
        ...scene!,
        defaults: { texture },
      });
      expect(field).toMatchObject({ mode: 'texture', texture });
    }
  });

  it('cada escena con tabla produce filas y CSV', () => {
    const withTable = SCENES.filter((scene) => scene.table);
    expect(withTable.length).toBeGreaterThanOrEqual(7);
    for (const scene of withTable) {
      const spec = scene.table!({
        t: 1,
        params: { ...DEFAULT_PARAMS, ...scene.defaults },
      });
      expect(spec.columns.length).toBeGreaterThan(1);
      expect(spec.rows.length).toBeGreaterThan(5);
      expect(spec.rows[0]!.length).toBe(spec.columns.length);
      expect(spec.csv.content.split('\n').length).toBeGreaterThan(spec.rows.length);
      expect(spec.csv.filename.endsWith('.csv')).toBe(true);
      expect(spec.csv.content).not.toContain('NaN');
    }
  });

  it('las animadas y estáticas se marcan correctamente', () => {
    expect(findScene('cuerda')?.animated).toBe(true);
    expect(findScene('plataforma')?.animated).toBeUndefined();
    const animated = SCENES.filter((scene) => scene.animated).map((scene) => scene.id);
    expect(animated).toEqual([
      'pelota',
      'reflexion',
      'anim-onda',
      'anim-interferencia',
      'onda-3d',
      'interferencia-3d',
      'cuerda',
    ]);
  });
});
