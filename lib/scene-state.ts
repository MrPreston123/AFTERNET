/** Mutable state shared between the DOM scroll logic and the WebGL scene (read every frame, no React renders). */
export const sceneState = {
  /** 0 = internet fully online, 1 = every link is dead */
  collapse: 0,
  /** 0..1 the AFTERNET boot sequence */
  boot: 0,
  /** globe placement, eased by the scene */
  x: 0,
  y: -3.5,
  scale: 1.32,
  dim: 0,
  pointerX: 0,
  pointerY: 0,
};

export type ScenePreset = { x: number; y: number; scale: number; dim: number };

/** Where the globe sits while each section is on screen. */
export const PRESETS: Record<string, ScenePreset> = {
  hero: { x: 0, y: -3.5, scale: 1.32, dim: 0 },
  collapse: { x: 0, y: -0.05, scale: 0.92, dim: 0 },
  boot: { x: 0, y: 0, scale: 0.7, dim: 0.75 },
  modules: { x: 2.4, y: -0.3, scale: 0.85, dim: 0.35 },
  how: { x: -3.1, y: 0.4, scale: 0.8, dim: 0.7 },
  gear: { x: 2.3, y: 1.2, scale: 0.7, dim: 0.55 },
  token: { x: 0, y: -2.1, scale: 1.15, dim: 0.25 },
  final: { x: 0, y: -3.5, scale: 1.32, dim: 0.1 },
};
