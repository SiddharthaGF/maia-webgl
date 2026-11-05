/**
 * Renderer WebGL2 mínimo: un programa para campos de píxel (ondas, texturas,
 * degradados) y otro para polilíneas/puntos de 1 px. Sin dependencias.
 */

import { parseColor, paletteToRgba, PALETTE0 } from '../core/palette';
import { Plot } from '../core/plot';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  SCALE_X,
  SCALE_Y,
  WORLD,
} from '../core/viewport';
import {
  FIELD_FRAGMENT_SHADER,
  FIELD_VERTEX_SHADER,
  LINE_FRAGMENT_SHADER,
  LINE_VERTEX_SHADER,
} from './shaders';

export type FieldMode = 'simple' | 'interference' | 'gradient' | 'texture';

export interface FieldSpec {
  mode: FieldMode;
  time: number;
  w?: number;
  v?: number;
  m?: number;
  source?: readonly [number, number];
  palette?: readonly string[];
  texture?: number;
  colorA?: string;
  colorB?: string;
}

const FLOATS_PER_VERTEX = 5;
const STRIDE = FLOATS_PER_VERTEX * 4;

interface Uniforms {
  [name: string]: WebGLUniformLocation | null;
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('No se pudo crear el shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? 'error desconocido';
    gl.deleteShader(shader);
    throw new Error(`Error compilando shader: ${log}`);
  }
  return shader;
}

function link(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error('No se pudo crear el programa');
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? 'error desconocido';
    throw new Error(`Error enlazando programa: ${log}`);
  }
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  return program;
}

function getUniforms(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  names: readonly string[],
): Uniforms {
  const uniforms: Uniforms = {};
  for (const name of names) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  return uniforms;
}

export class Renderer {
  readonly gl: WebGL2RenderingContext;
  private readonly fieldProgram: WebGLProgram;
  private readonly lineProgram: WebGLProgram;
  private readonly fieldUniforms: Uniforms;
  private readonly lineUniforms: Uniforms;
  private readonly fieldVao: WebGLVertexArrayObject;
  private readonly lineVao: WebGLVertexArrayObject;
  private readonly pointVao: WebGLVertexArrayObject;
  private readonly lineBuffer: WebGLBuffer;
  private readonly pointBuffer: WebGLBuffer;
  private readonly paletteTexture: WebGLTexture;
  private paletteKey = '';

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', {
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) throw new Error('WebGL2 no está disponible en este navegador.');
    this.gl = gl;

    this.fieldProgram = link(gl, FIELD_VERTEX_SHADER, FIELD_FRAGMENT_SHADER);
    this.lineProgram = link(gl, LINE_VERTEX_SHADER, LINE_FRAGMENT_SHADER);
    this.fieldUniforms = getUniforms(gl, this.fieldProgram, [
      'u_res',
      'u_world',
      'u_mode',
      'u_texture',
      'u_time',
      'u_w',
      'u_v',
      'u_m',
      'u_source',
      'u_paletteSize',
      'u_palette',
      'u_colorA',
      'u_colorB',
    ]);
    this.lineUniforms = getUniforms(gl, this.lineProgram, [
      'u_res',
      'u_pointSize',
    ]);

    this.fieldVao = this.createVao();
    this.lineVao = this.createVao();
    this.pointVao = this.createVao();
    this.lineBuffer = this.createBuffer();
    this.pointBuffer = this.createBuffer();
    this.bindVertexLayout(this.lineVao, this.lineBuffer);
    this.bindVertexLayout(this.pointVao, this.pointBuffer);

    this.paletteTexture = this.createPaletteTexture();
    this.uploadPalette(PALETTE0);
  }

  draw(field: FieldSpec | null, plot: Plot): void {
    const gl = this.gl;
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (field) this.drawField(field);
    this.drawPlot(plot);
  }

  private createVao(): WebGLVertexArrayObject {
    const vao = this.gl.createVertexArray();
    if (!vao) throw new Error('No se pudo crear el VAO');
    return vao;
  }

  private createBuffer(): WebGLBuffer {
    const buffer = this.gl.createBuffer();
    if (!buffer) throw new Error('No se pudo crear el buffer');
    return buffer;
  }

  private createPaletteTexture(): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) throw new Error('No se pudo crear la textura de paleta');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    return texture;
  }

  private bindVertexLayout(
    vao: WebGLVertexArrayObject,
    buffer: WebGLBuffer,
  ): void {
    const gl = this.gl;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, STRIDE, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, STRIDE, 8);
    gl.bindVertexArray(null);
  }

  private uploadPalette(palette: readonly string[]): void {
    const key = palette.join('|');
    if (key === this.paletteKey) return;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.paletteTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      palette.length,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      paletteToRgba(palette),
    );
    this.paletteKey = key;
  }

  private drawField(field: FieldSpec): void {
    const gl = this.gl;
    const palette = field.palette ?? PALETTE0;
    this.uploadPalette(palette);

    gl.useProgram(this.fieldProgram);
    gl.bindVertexArray(this.fieldVao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.paletteTexture);

    const u = this.fieldUniforms;
    gl.uniform2f(u.u_res ?? null, CANVAS_WIDTH, CANVAS_HEIGHT);
    gl.uniform4f(
      u.u_world ?? null,
      WORLD.xMin,
      WORLD.yMax,
      SCALE_X,
      SCALE_Y,
    );
    gl.uniform1i(
      u.u_mode ?? null,
      field.mode === 'simple'
        ? 0
        : field.mode === 'interference'
          ? 1
          : field.mode === 'gradient'
            ? 2
            : 3,
    );
    gl.uniform1i(u.u_texture ?? null, field.texture ?? 1);
    gl.uniform1f(u.u_time ?? null, field.time);
    gl.uniform1f(u.u_w ?? null, field.w ?? 1.5);
    gl.uniform1f(u.u_v ?? null, field.v ?? 9.3);
    gl.uniform1f(u.u_m ?? null, field.m ?? 1);
    const source = field.source ?? [0, 0];
    gl.uniform2f(u.u_source ?? null, source[0], source[1]);
    gl.uniform1i(u.u_paletteSize ?? null, palette.length);
    gl.uniform1i(u.u_palette ?? null, 0);
    const a = parseColor(field.colorA ?? '#008000');
    const b = parseColor(field.colorB ?? '#ff0000');
    gl.uniform3f(u.u_colorA ?? null, a[0], a[1], a[2]);
    gl.uniform3f(u.u_colorB ?? null, b[0], b[1], b[2]);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

  private drawPlot(plot: Plot): void {
    const gl = this.gl;
    gl.useProgram(this.lineProgram);
    gl.uniform2f(this.lineUniforms.u_res ?? null, CANVAS_WIDTH, CANVAS_HEIGHT);
    gl.uniform1f(this.lineUniforms.u_pointSize ?? null, 1.6);

    if (plot.lineVertices.length > 0) {
      gl.bindVertexArray(this.lineVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(plot.lineVertices),
        gl.DYNAMIC_DRAW,
      );
      gl.drawArrays(gl.LINES, 0, plot.lineVertices.length / FLOATS_PER_VERTEX);
    }

    if (plot.pointVertices.length > 0) {
      gl.bindVertexArray(this.pointVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(plot.pointVertices),
        gl.DYNAMIC_DRAW,
      );
      gl.drawArrays(gl.POINTS, 0, plot.pointVertices.length / FLOATS_PER_VERTEX);
    }

    gl.bindVertexArray(null);
  }
}
