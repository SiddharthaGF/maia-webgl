/** Modal de tablas de valores y descarga de CSV. */

import type { TableSpec } from '../scenes/types';

let modal: HTMLElement | null = null;
let titleEl: HTMLElement | null = null;
let noteEl: HTMLElement | null = null;
let tableEl: HTMLTableElement | null = null;
let metaEl: HTMLElement | null = null;
let csvButton: HTMLButtonElement | null = null;
let closeButton: HTMLButtonElement | null = null;
let currentCsv: TableSpec['csv'] | null = null;
let lastFocus: HTMLElement | null = null;
let initialized = false;

function must<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Falta el elemento ${selector}`);
  return element;
}

export function initTableModal(): void {
  if (initialized) return;
  initialized = true;

  modal = must<HTMLElement>('#modal');
  titleEl = must<HTMLElement>('#modal-title');
  noteEl = must<HTMLElement>('#modal-note');
  tableEl = must<HTMLTableElement>('#modal-table');
  metaEl = must<HTMLElement>('#modal-meta');
  csvButton = must<HTMLButtonElement>('#modal-csv');
  closeButton = must<HTMLButtonElement>('#modal-close');

  closeButton.addEventListener('click', closeTableModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeTableModal();
  });
  csvButton.addEventListener('click', downloadCsv);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal && !modal.hidden) {
      event.preventDefault();
      closeTableModal();
    }
  });
}

export function openTableModal(spec: TableSpec): void {
  if (!modal || !titleEl || !noteEl || !tableEl || !metaEl) {
    throw new Error('El modal no está inicializado');
  }
  lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  currentCsv = spec.csv;

  titleEl.textContent = spec.title;
  noteEl.textContent = spec.note;

  const head = tableEl.tHead;
  const body = tableEl.tBodies[0];
  if (!head || !body) throw new Error('Tabla sin thead/tbody');
  head.replaceChildren();
  body.replaceChildren();

  const headerRow = document.createElement('tr');
  for (const column of spec.columns) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = column;
    headerRow.append(th);
  }
  head.append(headerRow);

  const fragment = document.createDocumentFragment();
  for (const row of spec.rows) {
    const tr = document.createElement('tr');
    for (const cell of row) {
      const td = document.createElement('td');
      td.textContent = String(cell);
      tr.append(td);
    }
    fragment.append(tr);
  }
  body.append(fragment);

  metaEl.textContent = `${spec.rows.length} filas × ${spec.columns.length} columnas · CSV completo`;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  closeButton?.focus();
}

export function closeTableModal(): void {
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = '';
  currentCsv = null;
  lastFocus?.focus();
}

function downloadCsv(): void {
  if (!currentCsv) return;
  // BOM para que Excel abra el archivo con acentos correctos.
  const blob = new Blob([`\uFEFF${currentCsv.content}`], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = currentCsv.filename;
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
