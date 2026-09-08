import { isRef, onBeforeUnmount, reactive, ref, watch, type Ref } from 'vue';
import type { RememberToolInput } from '@/settings';

const LOCAL_STORAGE_KEY = 'codys-dev-tools:tool-state';
const PERSIST_DEBOUNCE_MS = 400;

export type ToolStateFields = Record<string, Ref<unknown> | object>;
type ToolStateStore = Record<string, Record<string, unknown>>;

export const toolStateMode = ref<RememberToolInput>('never');
export const isToolStateReady = ref(false);

const sessionState = reactive<ToolStateStore>({});
const foreverState = reactive<ToolStateStore>({});

let saveDebounceHandle: ReturnType<typeof setTimeout> | null = null;
let runningInElectron = false;

export function takeSnapshot(fields: ToolStateFields): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    snapshot[key] = isRef(value) ? value.value : { ...(value as object) };
  }
  return JSON.parse(JSON.stringify(snapshot));
}

export function applySnapshot(fields: ToolStateFields, snapshot: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(fields)) {
    if (!(key in snapshot)) continue;

    if (isRef(value)) {
      value.value = snapshot[key];
    } else if (typeof value === 'object' && value !== null && typeof snapshot[key] === 'object' && snapshot[key] !== null) {
      Object.assign(value, snapshot[key]);
    }
  }
}

async function readForeverStateFromDisk(isElectron: boolean): Promise<ToolStateStore> {
  if (isElectron) {
    try {
      const state = await window.codyDevTools!.loadToolState();
      return typeof state === 'object' && state !== null ? state : {};
    } catch {
      return {};
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function scheduleForeverStateWrite(): void {
  if (saveDebounceHandle) clearTimeout(saveDebounceHandle);
  saveDebounceHandle = setTimeout(() => {
    saveDebounceHandle = null;
    void writeForeverStateToDisk(runningInElectron);
  }, PERSIST_DEBOUNCE_MS);
}

async function writeForeverStateToDisk(isElectron: boolean): Promise<void> {
  const snapshot = JSON.parse(JSON.stringify(foreverState)) as ToolStateStore;

  if (isElectron) {
    try {
      await window.codyDevTools!.saveToolState(snapshot);
    } catch {
      // Best-effort persistence; a failed write just means the state won't survive a restart.
    }
    return;
  }

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Storage unavailable (private browsing, disabled, quota) — state just won't persist.
  }
}

async function clearForeverState(isElectron: boolean): Promise<void> {
  if (saveDebounceHandle) {
    clearTimeout(saveDebounceHandle);
    saveDebounceHandle = null;
  }

  for (const key of Object.keys(foreverState)) delete foreverState[key];

  if (isElectron) {
    try {
      await window.codyDevTools!.clearToolState();
    } catch {
      // Best-effort; nothing further to do if the clear fails.
    }
    return;
  }

  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {
    // Storage unavailable — nothing to clear.
  }
}

function clearSessionState(): void {
  for (const key of Object.keys(sessionState)) delete sessionState[key];
}

export async function initToolState(isElectron: boolean): Promise<void> {
  runningInElectron = isElectron;
  const loaded = await readForeverStateFromDisk(isElectron);
  Object.assign(foreverState, loaded);
  isToolStateReady.value = true;
}

export async function setRememberToolInputMode(mode: RememberToolInput, isElectron: boolean): Promise<void> {
  const previousMode = toolStateMode.value;

  if (previousMode === 'forever' && mode !== 'forever') {
    await clearForeverState(isElectron);
  }

  if (mode === 'never') {
    clearSessionState();
  }

  toolStateMode.value = mode;
}

export async function clearAllToolState(isElectron: boolean): Promise<void> {
  clearSessionState();
  await clearForeverState(isElectron);
}

export function hasStoredToolState(): boolean {
  return Object.keys(sessionState).length > 0 || Object.keys(foreverState).length > 0;
}

/** Resets the module-level singleton state between tests; not for app runtime use. */
export function resetToolStateForTests(): void {
  if (saveDebounceHandle) {
    clearTimeout(saveDebounceHandle);
    saveDebounceHandle = null;
  }
  runningInElectron = false;
  toolStateMode.value = 'never';
  isToolStateReady.value = false;
  clearSessionState();
  for (const key of Object.keys(foreverState)) delete foreverState[key];
}

export function usePersistedToolState(toolId: string, fields: ToolStateFields): void {
  function activeStore(): ToolStateStore | null {
    if (toolStateMode.value === 'session') return sessionState;
    if (toolStateMode.value === 'forever') return foreverState;
    return null;
  }

  function hydrate(): void {
    const store = activeStore();
    const snapshot = store?.[toolId];
    if (snapshot) applySnapshot(fields, snapshot);
  }

  function persist(snapshot: Record<string, unknown>): void {
    const mode = toolStateMode.value;
    if (mode === 'never') return;

    if (mode === 'session') {
      sessionState[toolId] = snapshot;
      return;
    }

    foreverState[toolId] = snapshot;
    scheduleForeverStateWrite();
  }

  if (isToolStateReady.value) hydrate();
  const stopReadyWatch = watch(isToolStateReady, (ready) => {
    if (ready) hydrate();
  });

  const stopStateWatch = watch(() => takeSnapshot(fields), persist, { deep: true });

  onBeforeUnmount(() => {
    stopReadyWatch();
    stopStateWatch();
  });
}
