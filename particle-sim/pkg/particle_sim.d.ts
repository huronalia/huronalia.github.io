/* tslint:disable */
/* eslint-disable */
export class ParticleSystem {
  free(): void;
  [Symbol.dispose](): void;
  constructor(count: number, canvas_width: number, canvas_height: number, history_length: number, convergence_threshold: number, convergence_fraction: number);
  set_gravity_wells(wells_data: Float32Array): void;
  update(delta_time: number, p: number, d: number, max_velocity: number): void;
  has_converged(): boolean;
  get_convergence_ratio(): number;
  get_positions(): number;
  get_velocities(): number;
  get_count(): number;
  resize_canvas(width: number, height: number): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_particlesystem_free: (a: number, b: number) => void;
  readonly particlesystem_new: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly particlesystem_set_gravity_wells: (a: number, b: number, c: number) => void;
  readonly particlesystem_update: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly particlesystem_has_converged: (a: number) => number;
  readonly particlesystem_get_convergence_ratio: (a: number) => number;
  readonly particlesystem_get_positions: (a: number) => number;
  readonly particlesystem_get_velocities: (a: number) => number;
  readonly particlesystem_get_count: (a: number) => number;
  readonly particlesystem_resize_canvas: (a: number, b: number, c: number) => void;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
