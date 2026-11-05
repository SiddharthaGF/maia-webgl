/** Shell de la aplicación: registro de escenas, reproducción y parámetros. */

import { Plot } from '../core/plot';
import { Renderer } from '../gl/renderer';
import { SCENES, findScene, initialScene, scenesForTab } from '../scenes';
import {
  DEFAULT_PARAMS,
  TAB_LABELS,
  type Scene,
  type SceneContext,
  type SceneParams,
  type Tab,
} from '../scenes/types';
import { initTableModal, openTableModal } from './table';

type NumericParam = 'w' | 'v' | 'm' | 'speed';

function must<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Falta el elemento ${selector}`);
  return element;
}

const TABS: readonly Tab[] = [1, 2, 3];

export class App {
  private readonly plot = new Plot();
  private readonly canvas = must<HTMLCanvasElement>('#gl');
  private readonly errorBox = must<HTMLElement>('#gl-error');
  private readonly errorDetail = must<HTMLElement>('#gl-error-detail');
  private readonly tabsEl = must<HTMLElement>('#tabs');
  private readonly sceneListEl = must<HTMLElement>('#scene-list');
  private readonly sceneCountEl = must<HTMLElement>('#scene-count');
  private readonly sceneTitleEl = must<HTMLElement>('#scene-title');
  private readonly sceneDescEl = must<HTMLElement>('#scene-desc');
  private readonly sceneTabEl = must<HTMLElement>('#scene-tab');
  private readonly paramsEl = must<HTMLElement>('#params');
  private readonly playBtn = must<HTMLButtonElement>('#play');
  private readonly playLabel = must<HTMLElement>('#play-label');
  private readonly playGlyph = must<HTMLElement>('#play-glyph');
  private readonly resetBtn = must<HTMLButtonElement>('#reset');
  private readonly tableBtn = must<HTMLButtonElement>('#table-btn');
  private readonly timeEl = must<HTMLElement>('#time');
  private readonly fpsEl = must<HTMLElement>('#fps');

  private renderer: Renderer | null = null;
  private scene: Scene = SCENES[0]!;
  private params: SceneParams = { ...DEFAULT_PARAMS };
  private tab: Tab = 1;
  private listTab: Tab | null = null;
  private time = 0;
  private playing = true;
  private needsRender = true;
  private lastFrame = performance.now();
  private fpsFrames = 0;
  private fpsElapsed = 0;

  private readonly tabButtons = new Map<Tab, HTMLButtonElement>();
  private readonly sceneButtons = new Map<string, HTMLButtonElement>();

  constructor() {
    initTableModal();
    this.bindTransport();
    this.buildTabs();
    this.sceneCountEl.textContent = `${SCENES.length} demos`;

    try {
      this.renderer = new Renderer(this.canvas);
    } catch (error) {
      this.showGlError(error);
    }

    window.addEventListener('hashchange', () => this.syncFromHash());
    document.addEventListener('keydown', (event) => this.onKeydown(event));
    this.exposeDebugApi();

    this.selectScene(initialScene(window.location.hash), false);
    requestAnimationFrame(this.tick);
  }

  private showGlError(error: unknown): void {
    const detail = error instanceof Error ? error.message : String(error);
    this.errorDetail.textContent = detail;
    this.errorBox.hidden = false;
    this.canvas.style.visibility = 'hidden';
    this.playBtn.disabled = true;
    this.resetBtn.disabled = true;
    this.tableBtn.disabled = true;
  }

  private buildTabs(): void {
    for (const tab of TABS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tab';
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', 'false');
      button.textContent = TAB_LABELS[tab];
      button.addEventListener('click', () => {
        if (this.tab === tab) return;
        const first = scenesForTab(tab)[0];
        if (first) this.selectScene(first);
      });
      this.tabsEl.append(button);
      this.tabButtons.set(tab, button);
    }
  }

  private updateTabsState(): void {
    for (const [tab, button] of this.tabButtons) {
      button.setAttribute('aria-selected', String(tab === this.tab));
    }
  }

  private renderSceneList(): void {
    this.sceneListEl.replaceChildren();
    this.sceneButtons.clear();
    const scenes = scenesForTab(this.tab);
    scenes.forEach((scene, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'scene-button';
      button.dataset.scene = scene.id;

      const number = document.createElement('span');
      number.className = 'scene-index';
      number.textContent = String(index + 1).padStart(2, '0');

      const label = document.createElement('span');
      label.className = 'scene-label';
      label.textContent = scene.label;

      button.append(number, label);
      if (scene.animated) {
        const dot = document.createElement('span');
        dot.className = 'scene-dot';
        dot.title = 'Escena animada';
        button.append(dot);
      }

      button.addEventListener('click', () => this.selectScene(scene));
      button.setAttribute(
        'aria-current',
        String(scene.id === this.scene.id),
      );
      this.sceneListEl.append(button);
      this.sceneButtons.set(scene.id, button);
    });
    this.listTab = this.tab;
  }

  private updateSceneButtonsState(): void {
    for (const [id, button] of this.sceneButtons) {
      button.setAttribute('aria-current', String(id === this.scene.id));
    }
  }

  private selectScene(scene: Scene, updateHash = true): void {
    const tabChanged = this.tab !== scene.tab;
    this.scene = scene;
    this.tab = scene.tab;
    this.time = 0;
    this.params = { ...DEFAULT_PARAMS, ...scene.defaults };
    this.playing = Boolean(scene.animated);
    this.needsRender = true;
    this.lastFrame = performance.now();
    this.fpsFrames = 0;
    this.fpsElapsed = 0;

    this.updateTabsState();
    if (tabChanged || this.listTab !== this.tab) this.renderSceneList();
    this.updateSceneButtonsState();
    this.updateSceneUi();
    this.updatePlayButton();

    if (updateHash) {
      window.history.replaceState(null, '', `#/${scene.id}`);
    }
  }

  private updateSceneUi(): void {
    this.sceneTitleEl.textContent = this.scene.label;
    this.sceneDescEl.textContent = this.scene.description;
    this.sceneTabEl.textContent = TAB_LABELS[this.scene.tab];
    this.tableBtn.hidden = !this.scene.table;
    this.timeEl.textContent = '0.00';
    this.fpsEl.textContent = '—';
    this.playBtn.disabled = !this.scene.animated;
    this.buildParams();
  }

  private updatePlayButton(): void {
    if (!this.scene.animated) {
      this.playLabel.textContent = 'Estático';
      this.playGlyph.textContent = '·';
      this.playBtn.setAttribute('aria-label', 'La escena es estática');
      return;
    }
    this.playLabel.textContent = this.playing ? 'Pausa' : 'Reanudar';
    this.playGlyph.textContent = this.playing ? '❚❚' : '▶';
    this.playBtn.setAttribute(
      'aria-label',
      this.playing ? 'Pausar la animación' : 'Reanudar la animación',
    );
  }

  private buildParams(): void {
    this.paramsEl.replaceChildren();
    const controls = this.scene.controls ?? [];

    if (controls.includes('wave')) {
      this.addSlider('Amplitud', 'm', 0.1, 2, 0.05, (value) => value.toFixed(2));
      this.addSlider('Frecuencia', 'w', 0.2, 4, 0.1, (value) => value.toFixed(1));
      this.addSlider('Velocidad de fase', 'v', 0, 20, 0.1, (value) => value.toFixed(1));
    }

    if (controls.includes('texture')) {
      this.addTextureSelect();
    }

    if (this.scene.animated) {
      this.addSlider('Velocidad de la animación', 'speed', 0.1, 3, 0.1, (value) =>
        `${value.toFixed(1)}×`,
      );
    }

    if (this.paramsEl.childElementCount === 0) {
      const empty = document.createElement('p');
      empty.className = 'params-empty';
      empty.textContent =
        'Escena estática. Elegí otra demo o usá Reiniciar para volver al estado inicial.';
      this.paramsEl.append(empty);
    }
  }

  private addSlider(
    labelText: string,
    key: NumericParam,
    min: number,
    max: number,
    step: number,
    format: (value: number) => string,
  ): void {
    const label = document.createElement('label');
    label.className = 'param';

    const name = document.createElement('span');
    name.textContent = labelText;

    const output = document.createElement('output');
    output.textContent = format(this.params[key]);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(this.params[key]);
    input.setAttribute('aria-label', labelText);

    input.addEventListener('input', () => {
      this.params[key] = Number(input.value);
      output.textContent = format(this.params[key]);
      this.needsRender = true;
    });

    label.append(name, output, input);
    this.paramsEl.append(label);
  }

  private addTextureSelect(): void {
    const wrap = document.createElement('div');
    wrap.className = 'select-wrap';

    const label = document.createElement('span');
    label.textContent = 'Patrón de textura';

    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Patrón de textura');
    for (let i = 1; i <= 8; i++) {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = `Textura ${i}`;
      select.append(option);
    }
    select.value = String(this.params.texture);
    select.addEventListener('change', () => {
      this.params.texture = Number(select.value);
      this.needsRender = true;
    });

    wrap.append(label, select);
    this.paramsEl.append(wrap);
  }

  private bindTransport(): void {
    this.playBtn.addEventListener('click', () => this.togglePlay());
    this.resetBtn.addEventListener('click', () => this.reset());
    this.tableBtn.addEventListener('click', () => {
      const spec = this.scene.table?.({ t: this.time, params: this.params });
      if (spec) openTableModal(spec);
    });
  }

  private togglePlay(): void {
    if (!this.scene.animated) return;
    this.playing = !this.playing;
    this.needsRender = true;
    this.updatePlayButton();
  }

  private reset(): void {
    this.time = 0;
    this.playing = Boolean(this.scene.animated);
    this.needsRender = true;
    this.timeEl.textContent = '0.00';
    this.updatePlayButton();
  }

  private onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName ?? '';
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'BUTTON') {
      return;
    }
    if (event.code === 'Space') {
      event.preventDefault();
      this.togglePlay();
    } else if (event.key === 'r' || event.key === 'R') {
      this.reset();
    }
  }

  private syncFromHash(): void {
    const id = window.location.hash.replace(/^#\/?/, '').trim();
    const scene = findScene(id);
    if (scene && scene.id !== this.scene.id) this.selectScene(scene, false);
  }

  private tick = (now: number): void => {
    const dt = Math.min(Math.max(now - this.lastFrame, 0) / 1000, 0.05);
    this.lastFrame = now;

    if (this.renderer) {
      if (this.scene.animated && this.playing) {
        this.time += dt * this.params.speed;
        this.renderFrame();
        this.measureFps(dt);
      } else if (this.needsRender) {
        this.renderFrame();
        this.needsRender = false;
        this.fpsEl.textContent = '—';
      }
    }

    requestAnimationFrame(this.tick);
  };

  private measureFps(dt: number): void {
    this.fpsFrames++;
    this.fpsElapsed += dt;
    if (this.fpsElapsed >= 0.5) {
      this.fpsEl.textContent = String(Math.round(this.fpsFrames / this.fpsElapsed));
      this.fpsFrames = 0;
      this.fpsElapsed = 0;
    }
  }

  private renderFrame(): void {
    if (!this.renderer) return;
    const ctx: SceneContext = {
      plot: this.plot,
      field: null,
      t: this.time,
      params: this.params,
    };
    this.plot.reset();
    this.scene.render(ctx);
    this.renderer.draw(ctx.field, this.plot);
    this.timeEl.textContent = this.time.toFixed(2);
  }

  /** API mínima para capturas automatizadas (no forma parte de la UI). */
  private exposeDebugApi(): void {
    Object.defineProperty(window, 'maia', {
      value: {
        select: (id: string): boolean => {
          const scene = findScene(id);
          if (!scene) return false;
          this.selectScene(scene);
          return true;
        },
        scenes: (): string[] => SCENES.map((scene) => scene.id),
      },
      configurable: true,
    });
  }
}
