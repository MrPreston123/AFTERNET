'use client';
/**
 * Local AI engine shared by the website and the native apps.
 * Runs llama.cpp compiled to WebAssembly (wllama): uses the GPU through WebGPU when available,
 * otherwise the CPU, so it works on any modern device. Models download once and are cached on-device.
 */
import type { Wllama } from '@wllama/wllama';

export const MODELS = [
  { id: 'scout', name: 'Scout', size: '0.49 GB', bytes: 491_400_032, note: 'Fast, basic answers. Phones and older computers.', url: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf' },
  { id: 'ranger', name: 'Ranger', size: '0.81 GB', bytes: 807_694_464, note: 'Recommended. Clearer answers on most laptops.', url: 'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf' },
  { id: 'sage', name: 'Sage', size: '1.1 GB', bytes: 1_117_320_736, note: 'Best quality. Needs 4 GB+ free memory.', url: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf' },
] as const;
export type ModelId = (typeof MODELS)[number]['id'];

export type AIState = {
  status: 'idle' | 'downloading' | 'loading' | 'ready' | 'error';
  model: ModelId | null;
  progress: number;
  message: string;
  gpu: boolean;
  cached: Partial<Record<ModelId, boolean>>;
};

let state: AIState = { status: 'idle', model: null, progress: 0, message: '', gpu: false, cached: {} };
const subs = new Set<(s: AIState) => void>();
const set = (p: Partial<AIState>) => {
  state = { ...state, ...p };
  subs.forEach((f) => f(state));
};
export const aiState = () => state;
export function subscribeAI(f: (s: AIState) => void) {
  subs.add(f);
  return () => void subs.delete(f);
}

let wllama: Wllama | null = null;
let modPromise: Promise<typeof import('@wllama/wllama')> | null = null;
const mod = () => (modPromise ??= import('@wllama/wllama'));

async function instance() {
  if (wllama) return wllama;
  const { Wllama } = await mod();
  wllama = new Wllama({ default: '/wllama/wllama.wasm' }, { allowOffline: true, parallelDownloads: 4, suppressNativeLog: true, logger: { debug() {}, log() {}, warn: console.warn, error: console.error } as unknown as Console });
  return wllama;
}

/** Which models are already stored on this device. */
export async function refreshCached() {
  try {
    const w = await instance();
    const list = await w.modelManager.getModels();
    const cached: AIState['cached'] = {};
    for (const m of MODELS) cached[m.id] = list.some((x) => x.url === m.url && x.size > 0);
    const nav = navigator as Navigator & { gpu?: unknown };
    set({ cached, gpu: !!nav.gpu });
  } catch {}
}

/** Download only (for the Downloads screen). */
export async function downloadModel(id: ModelId) {
  const m = MODELS.find((x) => x.id === id)!;
  const w = await instance();
  set({ status: 'downloading', model: id, progress: 0, message: `Downloading ${m.name}…` });
  try {
    await w.modelManager.downloadModel(m.url, {
      progressCallback: ({ loaded, total }) => set({ progress: total ? loaded / total : 0, message: `Downloading ${m.name} · ${Math.round((loaded / 1e6))} / ${Math.round(total / 1e6)} MB` }),
    });
    set({ status: wllama?.isModelLoaded() ? 'ready' : 'idle', progress: 1, message: `${m.name} saved on this device` });
    await refreshCached();
  } catch (e) {
    set({ status: 'error', message: `Download failed: ${(e as Error).message}` });
  }
}

export async function deleteModel(id: ModelId) {
  const m = MODELS.find((x) => x.id === id)!;
  const w = await instance();
  if (state.model === id && w.isModelLoaded()) {
    await w.exit();
    wllama = null;
    set({ status: 'idle', model: null });
  }
  const list = await (await instance()).modelManager.getModels();
  for (const x of list) if (x.url === m.url) await x.remove();
  await refreshCached();
}

/** Load (downloading first if needed) and get ready to chat. */
export async function startModel(id: ModelId) {
  const m = MODELS.find((x) => x.id === id)!;
  let w = await instance();
  if (w.isModelLoaded()) {
    if (state.model === id) return set({ status: 'ready' });
    await w.exit();
    wllama = null;
    w = await instance();
  }
  set({ status: state.cached[id] ? 'loading' : 'downloading', model: id, progress: 0, message: state.cached[id] ? `Starting ${m.name}…` : `Downloading ${m.name}…` });
  const gpu = w.isSupportWebGPU();
  try {
    await w.loadModelFromUrl(m.url, {
      n_ctx: 4096,
      n_gpu_layers: gpu ? 999 : 0,
      progressCallback: ({ loaded, total }) => {
        const p = total ? loaded / total : 0;
        set({ status: p >= 1 ? 'loading' : 'downloading', progress: p, message: p >= 1 ? `Starting ${m.name}…` : `Downloading ${m.name} · ${Math.round(loaded / 1e6)} / ${Math.round(total / 1e6)} MB` });
      },
    });
    set({ status: 'ready', progress: 1, gpu, message: `${m.name} running on ${gpu ? 'GPU' : 'CPU'}` });
    try { localStorage.setItem('afternet-model', id); } catch {}
    await refreshCached();
  } catch (e) {
    // GPU init can fail on some drivers: retry on CPU.
    if (gpu) {
      try {
        await w.exit().catch(() => {});
        wllama = null;
        w = await instance();
        await w.loadModelFromUrl(m.url, { n_ctx: 4096, n_gpu_layers: 0 });
        set({ status: 'ready', progress: 1, gpu: false, message: `${m.name} running on CPU` });
        return;
      } catch {}
    }
    set({ status: 'error', message: `Couldn’t start ${m.name}: ${(e as Error).message}` });
  }
}

export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string };

export async function* chat(messages: ChatMsg[], signal?: AbortSignal) {
  const w = await instance();
  if (!w.isModelLoaded()) throw new Error('No model loaded');
  // llama-server reads repeat_penalty; wllama's typed name is penalty_repeat. Send both: small models loop without it.
  const sampling = { min_p: 0.05, penalty_repeat: 1.08, penalty_last_n: 128, repeat_penalty: 1.08, repeat_last_n: 128 } as Record<string, number>;
  const stream = await w.createChatCompletion({ messages, stream: true, max_tokens: 600, temperature: 0.2, top_p: 0.9, ...sampling, abortSignal: signal });
  for await (const chunk of stream) {
    const t = chunk.choices?.[0]?.delta?.content;
    if (t) yield t;
  }
}

export const lastModel = (): ModelId | null => {
  try {
    return (localStorage.getItem('afternet-model') as ModelId) || null;
  } catch {
    return null;
  }
};

// dev-only hook for debugging the engine from the console
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  (window as unknown as { __afnAI: unknown }).__afnAI = { instance, startModel, aiState };
}
