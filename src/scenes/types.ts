/** Tipos compartidos por el registro de escenas. */

import type { Plot } from '../core/plot';
import type { FieldSpec } from '../gl/renderer';

export type Tab = 1 | 2 | 3;

export interface SceneParams {
  w: number;
  v: number;
  m: number;
  speed: number;
  texture: number;
}

export type ControlKind = 'wave' | 'speed' | 'texture';

export interface SceneContext {
  plot: Plot;
  field: FieldSpec | null;
  t: number;
  params: SceneParams;
}

export interface TableSpec {
  title: string;
  note: string;
  columns: string[];
  rows: string[][];
  csv: { filename: string; content: string };
}

export interface TableOptions {
  t: number;
  params: SceneParams;
}

export interface Scene {
  id: string;
  label: string;
  tab: Tab;
  description: string;
  animated?: boolean;
  defaults?: Partial<SceneParams>;
  controls?: ControlKind[];
  render(ctx: SceneContext): void;
  table?(options: TableOptions): TableSpec;
}

export const DEFAULT_PARAMS: SceneParams = {
  w: 1.5,
  v: 9.3,
  m: 1,
  speed: 1,
  texture: 1,
};

export const TAB_LABELS: Record<Tab, string> = {
  1: 'Parcial 1',
  2: 'Parcial 2',
  3: 'Parcial 3',
};
