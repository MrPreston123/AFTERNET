// Copies the llama.cpp WebAssembly runtime used by the local AI into public/.
import { mkdirSync, copyFileSync } from 'node:fs';
mkdirSync('public/wllama', { recursive: true });
copyFileSync('node_modules/@wllama/wllama/esm/wasm/wllama.wasm', 'public/wllama/wllama.wasm');
