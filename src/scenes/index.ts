/** Registro único de escenas, en el orden de los tres parciales. */

import { PARCIAL1 } from './parcial1';
import { PARCIAL2 } from './parcial2';
import { PARCIAL3 } from './parcial3';
import type { Scene, Tab } from './types';

export const SCENES: readonly Scene[] = [...PARCIAL1, ...PARCIAL2, ...PARCIAL3];

export function scenesForTab(tab: Tab): Scene[] {
  return SCENES.filter((scene) => scene.tab === tab);
}

export function findScene(id: string): Scene | undefined {
  return SCENES.find((scene) => scene.id === id);
}

export function initialScene(hash: string): Scene {
  const id = hash.replace(/^#\/?/, '').trim();
  return findScene(id) ?? SCENES[0]!;
}
