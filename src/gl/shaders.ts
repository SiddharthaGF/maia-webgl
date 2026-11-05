/** Shaders GLSL ES 3.00 del renderer. */

export const LINE_VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 a_pos;
layout(location = 1) in vec3 a_color;
uniform vec2 u_res;
uniform float u_pointSize;
out vec3 v_color;

void main() {
  // +0.5 alinea el vértice con el centro del píxel, como setPixelColor.
  vec2 p = a_pos + 0.5;
  vec2 clip = p / u_res * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = u_pointSize;
  v_color = a_color;
}
`;

export const LINE_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec3 v_color;
out vec4 outColor;

void main() {
  outColor = vec4(v_color, 1.0);
}
`;

export const FIELD_VERTEX_SHADER = `#version 300 es
void main() {
  float x = (gl_VertexID == 1) ? 3.0 : -1.0;
  float y = (gl_VertexID == 2) ? 3.0 : -1.0;
  gl_Position = vec4(x, y, 0.0, 1.0);
}
`;

/**
 * Campos 2D evaluados por píxel. Reproduce las fórmulas de `wave.h` y de los
 * ocho patrones de `combo_textures` usando el índice entero de píxel (i, j),
 * con j medido desde arriba como en el QImage original.
 */
export const FIELD_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 u_res;
uniform vec4 u_world;      // xMin, yMax, pxPorUnidadX, pxPorUnidadY
uniform int u_mode;        // 0 simple, 1 interferencia, 2 degradado, 3 textura
uniform int u_texture;     // 1..9
uniform float u_time;
uniform float u_w;
uniform float u_v;
uniform float u_m;
uniform vec2 u_source;
uniform int u_paletteSize;
uniform sampler2D u_palette;
uniform vec3 u_colorA;
uniform vec3 u_colorB;

out vec4 outColor;

vec3 paletteAt(int index) {
  int i = clamp(index, 0, u_paletteSize - 1);
  return texelFetch(u_palette, ivec2(i, 0), 0).rgb;
}

float band(float value, float modulo) {
  if (isnan(value) || isinf(value)) return 0.0;
  return floor(mod(abs(value), modulo));
}

void main() {
  float i = floor(gl_FragCoord.x);
  float j = floor(u_res.y - gl_FragCoord.y);
  vec2 p = vec2(u_world.x + i / u_world.z, u_world.y - j / u_world.w);

  if (u_mode == 0) {
    float r = length(p - u_source);
    float z = u_m * sin(u_w * (r - u_v * u_time)) + 1.0;
    outColor = vec4(paletteAt(int(z * 7.5)), 1.0);
  } else if (u_mode == 1) {
    float z = 0.0;
    z += sin(u_w * (length(p - vec2(-4.0, -2.0)) - u_v * u_time)) + 1.0;
    z += sin(u_w * (length(p - vec2(-4.0,  2.0)) - u_v * u_time)) + 1.0;
    z += sin(u_w * (length(p - vec2( 0.0,  0.0)) - u_v * u_time)) + 1.0;
    outColor = vec4(paletteAt(int(z * 2.5)), 1.0);
  } else if (u_mode == 2) {
    float k = i / u_res.x;
    outColor = vec4(mix(u_colorA, u_colorB, k), 1.0);
  } else {
    float v = 0.0;
    if (u_texture == 1) {
      v = band(i * i * j + j * j, 15.0);
    } else if (u_texture == 2) {
      v = band(abs(sin(3.0 * i) / max(abs(cos(j)), 1e-4)), 15.0);
    } else if (u_texture == 3) {
      v = band(pow(log(i + 1.0), 6.0) / 2.0 * log(j + 3.0), 15.0);
    } else if (u_texture == 4) {
      float s = sin(i);
      float co = cos(j);
      v = band(2.0 * s * s + 3.0 * co * co, 15.0);
    } else if (u_texture == 5) {
      float s = sin(i);
      float l = log(j + 5.0);
      v = band(s * s * s * s + l * l * l, 15.0);
    } else if (u_texture == 6) {
      v = band(log(3.0 * i + j + 4.0) * 10.0, 10.0);
    } else if (u_texture == 7) {
      v = band(cos(i) + sin(i) * j, 4.0);
    } else if (u_texture == 8) {
      v = band(log(2.0 + sin(i * j * 10.0)), 7.0);
    } else {
      // Botón «Textura»: franjas verticales con la paleta degradada.
      v = band(i * cos(i), 15.0);
    }
    outColor = vec4(paletteAt(int(v)), 1.0);
  }
}
`;
