# maia-webgl — reconstrucción en TypeScript + WebGL2

## Specs

- **S1 — Pedido (textual).** «reconstuye la idea de este proyecto de c++ en ts
  con webgl https://github.com/SiddharthaGF/maia-c-plus-plus».
- **S2 — Fidelidad geométrica.** El original es una app Qt Widgets que pinta
  píxeles en un `QImage` de 600×500 con 30 px por unidad. La reconstrucción
  conserva el lienzo, la escala y las fórmulas, pero centra el origen en
  `x ∈ [-10, 10]`, `y ∈ [-8.33, 8.33]`: el mapeo original
  (`x ∈ [-0.5, 19.5]`, `y ∈ [-0.5, 16.16]`, origen en la esquina inferior
  izquierda) recortaba curvas, reflexiones y todo el 3D.
- **S3 — Cobertura funcional.** Los tres parciales del original: primitivas
  (interpolación, segmentos/círculos, píxel, curvas, letra G, texturas), cálculo
  (Taylor, interpolación, tangente, pelota, reflexión, curvas de nivel) y
  científica (3D axonométrico, ondas 2D/3D, interferencia, cuerda vibrante de
  Fourier y simulación de pandemia por RK4/analítica).
- **S4 — WebGL real, sin librerías 3D.** Campos continuos (ondas, texturas,
  degradados) evaluados por píxel en un fragment shader; primitivas y curvas
  rasterizadas como polilíneas de 1 px en espacio de pantalla (equivalente al
  `setPixelColor` del original); 3D por proyección axonométrica propia.
- **S5 — Shell moderno.** Play/pausa, reinicio, velocidad, sliders de parámetros
  de onda, tablas de valores en HTML y exportación CSV, en lugar de los
  `QTableWidget` de 300 000 celdas y los archivos `.txt`.
- **S6 — Desviaciones documentadas.** Se corrigen bugs evidentes (asignación de
  `z` en `Segment3D`, índices de paleta negativos, `log` de valores no
  positivos, condición de borde de la cuerda), se completa la «Curva
  Interpolada» con Lagrange, se reubica la reflexión dentro del lienzo y se
  elimina el *frame skipping*. Todo queda anotado en el README.

## Tasks

| ID  | Spec | Ruta | Estado |
| --- | ---- | ---- | ------ |
| T1  | S1   | scaffold Vite + TS + Vitest, repo, ODD | hecho |
| T2  | S2,S4 | `src/core/viewport.ts`, `src/gl/*`, tests | hecho |
| T3  | S3,S5 | shell `src/ui/*`, `src/scenes/parcial1.ts` | hecho |
| T4  | S3   | `src/scenes/parcial2.ts` | hecho |
| T5  | S3,S4 | `src/primitives/waves.ts`, `src/scenes/parcial3.ts` | hecho |
| T6  | S3,S5 | `src/primitives/pandemics.ts`, tablas/CSV | hecho |
| T7  | S6   | README + verificación (tests, build, capturas) | hecho |
| T8  | S2   | plano centrado, layout responsive y capturas | hecho |

## Log

- **L1** — Pedido original del usuario (S1). Sesión del 2026-11-05.
- **L2** — Se descarga el repo original y se leen los 20 archivos: `mainwindow.cpp`
  (1 280 líneas), 12 cabeceras con las primitivas, el `.ui` con los 3 tabs y los
  26 botones.
- **L3** — Decisión: WebGL2 crudo (sin three.js) para conservar la semántica de
  «píxel» del original; campos por shader y primitivas por líneas de 1 px.
- **L4** — Verificación: 43 tests unitarios, `npm run build` y capturas headless
  de las escenas clave (1280×920, 1000×760 y móvil).
- **L5** — Feedback del usuario: «el plano no está centrado». Se centra el
  origen en el lienzo (30 px/unidad), se reajustan ondas, pandemia, reflexión y
  cuerda, y se alinea el encabezado con el bloque de contenido.
- **L6** — La cuerda de Fourier se veía como una línea vertical: se cambia
  f(x)=1.5x por el perfil triangular f(x)=1.5·min(x, l−x), que respeta las
  condiciones de borde, y se usan 40 armónicos con base espacial precomputada.
- **L7** — Captura del modal de tablas y verificación de los 28 registros, 43
  tests y bundle de producción.

- **L8** — RDD: `assess` del commit de docs = `passive`; UI, escenas y core =
  `under_budget`. Sin review obligatoria.
- **L9** — Verificación final: 43 tests, typecheck, build de producción (37.6 kB
  JS) y captura del bundle servido con `vite preview`.
