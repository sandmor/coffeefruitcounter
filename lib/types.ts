// Type definitions for the WASM module

export interface Detection {
    bbox: [number, number, number, number]; // [x_center, y_center, width, height] normalized to [0, 1]
    class_id: number;
    class_name: string;
    confidence: number;
}

export interface ClassCounts {
    dry: number;
    overripe: number;
    ripe: number;
    semi_ripe: number;
    unripe: number;
}

export interface DetectionResult {
    detections: Detection[];
    counts: ClassCounts;
    total: number;
    inference_time_ms: number;
}

export interface CoffeeCherryDetector {
    is_ready(): boolean;
    inference(input: Float32Array): Promise<DetectionResult>;
    set_backend_ndarray(): Promise<void>;
    set_backend_wgpu(): Promise<void>;
    get_img_size(): number;
    get_labels(): string[];
}

export interface CoffeeCherryDetectorConstructor {
    new(): CoffeeCherryDetector;
}

export interface WasmModule {
    default: () => Promise<void>;
    CoffeeCherryDetector: CoffeeCherryDetectorConstructor;
}

export type BackendType = 'webgpu' | 'ndarray';

export const CLASS_COLORS: Record<string, string> = {
    dry: '#8B4513',      // Saddle brown
    overripe: '#800020', // Burgundy
    ripe: '#DC143C',     // Crimson red
    semi_ripe: '#FFA500', // Orange
    unripe: '#228B22',   // Forest green
};

export const CLASS_BG_COLORS: Record<string, string> = {
    dry: 'bg-amber-800',
    overripe: 'bg-rose-900',
    ripe: 'bg-red-600',
    semi_ripe: 'bg-orange-500',
    unripe: 'bg-green-600',
};

export const CLASS_LABELS: Record<string, string> = {
    dry: 'Dry',
    overripe: 'Overripe',
    ripe: 'Ripe',
    semi_ripe: 'Semi-ripe',
    unripe: 'Unripe',
};

// Image size required by the model
export const IMG_SIZE = 640;
