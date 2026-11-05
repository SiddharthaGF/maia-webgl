import { describe, expect, it } from 'vitest';
import {
  CUSTOM_PALETTE,
  PALETTE0,
  createPalette,
  paletteToRgba,
  parseColor,
} from '../src/core/palette';

describe('paletas', () => {
  it('conserva las dos paletas de 16 colores del original', () => {
    expect(PALETTE0).toHaveLength(16);
    expect(CUSTOM_PALETTE).toHaveLength(16);
    expect(PALETTE0[0]).toBe('#000000');
    expect(PALETTE0[15]).toBe('#ffffff');
    expect(CUSTOM_PALETTE[0]).toBe('#d8bfd8');
  });

  it('parsea hex de 6 y 3 dígitos', () => {
    expect(parseColor('#ff0000')).toEqual([1, 0, 0]);
    expect(parseColor('#00f')).toEqual([0, 0, 1]);
    expect(parseColor('#ffffff')).toEqual([1, 1, 1]);
    expect(() => parseColor('rojo')).toThrow();
  });

  it('genera el degradado con el paso dividido por count (como el C++)', () => {
    const palette = createPalette('#000000', '#ffffff', 2);
    expect(palette).toEqual(['#000000', '#808080']);
    const sixteen = createPalette('#c8c8c8', '#1e1e1e', 16);
    expect(sixteen).toHaveLength(16);
    expect(sixteen[0]).toBe('#c8c8c8');
    // El último color no alcanza el extremo: 200 + (-10.625 * 15) = 40.6.
    expect(parseColor(sixteen[15]!)[0]).toBeCloseTo(40.6 / 255, 2);
  });

  it('convierte la paleta a RGBA para la textura', () => {
    const data = paletteToRgba(['#ff0000', '#00ff00']);
    expect(data).toHaveLength(8);
    expect([...data.slice(0, 4)]).toEqual([255, 0, 0, 255]);
    expect([...data.slice(4, 8)]).toEqual([0, 255, 0, 255]);
  });
});
