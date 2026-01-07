// Ambient definitions for the WASM module
// This allows the build to pass without the generated pkg directory present.

declare module "wasm-pkg" {
    export class CoffeeCherryDetector {
        free(): void;
        constructor();
        is_ready(): boolean;
        inference(input: Float32Array): Promise<any>;
        set_backend_ndarray(): Promise<void>;
        set_backend_wgpu(): Promise<void>;
    }

    export default function init(module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
}

type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly CoffeeCherryDetector: typeof CoffeeCherryDetector;
}

declare class CoffeeCherryDetector {
    free(): void;
    constructor();
    is_ready(): boolean;
    inference(input: Float32Array): Promise<any>;
    set_backend_ndarray(): Promise<void>;
    set_backend_wgpu(): Promise<void>;
}
