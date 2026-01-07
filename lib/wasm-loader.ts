import type { BackendType, CoffeeCherryDetector, WasmModule, DetectionResult } from './types';
import { IMG_SIZE } from './types';

let wasmModule: WasmModule | null = null;
let detector: CoffeeCherryDetector | null = null;

// Detect SIMD support
async function simdSupported(): Promise<boolean> {
    try {
        const { simd } = await import('wasm-feature-detect');
        const supported = await simd();
        // Disable SIMD for Safari due to compatibility issues
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        return supported && !isSafari;
    } catch {
        return false;
    }
}

// Check if WebGPU is available (basic check)
export function isWebGPUAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

// Robust async check for WebGPU availability
export async function checkWebGPU(): Promise<boolean> {
    if (!isWebGPUAvailable()) return false;
    try {
        const adapter = await navigator.gpu.requestAdapter();
        return !!adapter;
    } catch {
        return false;
    }
}

// Load the WASM module
export async function loadWasm(
    onProgress?: (progress: number, message: string) => void
): Promise<void> {
    if (wasmModule) return;

    onProgress?.(10, 'Checking SIMD support...');
    const useSIMD = await simdSupported();

    onProgress?.(20, `Loading WASM module (${useSIMD ? 'SIMD' : 'No SIMD'})...`);

    const variant = useSIMD ? 'simd' : 'no_simd';
    
    // Construct the remote base URL
    // Default to a known location or fail if not set in production
    const version = process.env.NEXT_PUBLIC_WASM_VERSION || 'latest';
    const baseUrl = process.env.NEXT_PUBLIC_WASM_BASE_URL 
        ? process.env.NEXT_PUBLIC_WASM_BASE_URL.replace(/\/$/, '') 
        : '';

    if (!baseUrl && process.env.NODE_ENV === 'production') {
        console.warn('NEXT_PUBLIC_WASM_BASE_URL is not set. WASM loading may fail.');
    }

    // Full URL to the JS entry point
    const jsUrl = `${baseUrl}/wasm/${version}/${variant}/yolo_wasm.js`;
    const wasmUrl = `${baseUrl}/wasm/${version}/${variant}/yolo_wasm_bg.wasm`;

    try {
        // Load the JS module from the remote URL
        // We assume the JS file is ES module compatible
        onProgress?.(30, `Fetching JS from ${jsUrl}...`);
        
        // Use a standard dynamic import with the full URL
        // @ts-ignore - Dynamic import with string allows loading remote modules
        const wasmImport = await import(/* webpackIgnore: true */ jsUrl);

        onProgress?.(50, 'Initializing WASM...');
        
        // The default export is the init function
        // We pass the full URL to the .wasm binary to ensure it loads correctly
        // regardless of where the JS file thinks it is.
        await wasmImport.default(wasmUrl);
        
        wasmModule = wasmImport as WasmModule;
        onProgress?.(60, 'WASM module loaded');
    } catch (error) {
        console.error('Failed to load WASM module:', error);
        throw new Error('Failed to load WASM module. Please ensure the WASM files are built.');
    }
}

// Define a simpler interface for the returned detector
interface DetectorInstance {
    is_ready(): boolean;
    inference(input: Float32Array): Promise<DetectionResult>;
}

// Initialize the detector with a specific backend
export async function initializeDetector(
    backend: BackendType,
    onProgress?: (progress: number, message: string) => void
): Promise<DetectorInstance> {
    if (!wasmModule) {
        throw new Error('WASM module not loaded');
    }

    onProgress?.(70, 'Creating detector instance...');
    detector = new wasmModule.CoffeeCherryDetector();

    onProgress?.(80, `Loading model with ${backend} backend...`);

    try {
        switch (backend) {
            case 'webgpu':
                // Pre-check: Ensure we can actually get an adapter before crashing WASM
                if (!navigator.gpu) {
                     throw new Error('WebGPU not supported in this browser');
                }
                const adapter = await navigator.gpu.requestAdapter();
                if (!adapter) {
                     throw new Error('No WebGPU adapter found');
                }
                await detector.set_backend_wgpu();
                break;
            case 'ndarray':
                await detector.set_backend_ndarray();
                break;
        }
    } catch (error) {
        console.error(`Failed to initialize ${backend} backend:`, error);
        // If GPU fails, try to fallback to CPU
        if (backend === 'webgpu') {
            onProgress?.(85, 'GPU failed, falling back to CPU...');
            await detector.set_backend_ndarray();
        } else {
            throw error;
        }
    }

    onProgress?.(100, 'Ready!');
    return detector as DetectorInstance;
}

// Get the current detector instance
export function getDetector(): CoffeeCherryDetector | null {
    return detector;
}

// Prepare image data for inference
export async function prepareImageData(imageDataUrl: string): Promise<Float32Array> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            // Create canvas for resizing
            const canvas = document.createElement('canvas');
            canvas.width = IMG_SIZE;
            canvas.height = IMG_SIZE;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            // Calculate scaling to maintain aspect ratio
            const scale = Math.min(IMG_SIZE / img.width, IMG_SIZE / img.height);
            const newWidth = img.width * scale;
            const newHeight = img.height * scale;
            const offsetX = (IMG_SIZE - newWidth) / 2;
            const offsetY = (IMG_SIZE - newHeight) / 2;

            // Fill with gray (letterbox)
            ctx.fillStyle = '#808080';
            ctx.fillRect(0, 0, IMG_SIZE, IMG_SIZE);

            // Draw the image centered
            ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);

            // Get image data
            const imageData = ctx.getImageData(0, 0, IMG_SIZE, IMG_SIZE);

            // Convert to channel-first format [C, H, W] and normalize to [0, 255]
            const flattenedArray = new Float32Array(3 * IMG_SIZE * IMG_SIZE);

            let kR = 0;
            let kG = IMG_SIZE * IMG_SIZE;
            let kB = 2 * IMG_SIZE * IMG_SIZE;

            for (let y = 0; y < IMG_SIZE; y++) {
                for (let x = 0; x < IMG_SIZE; x++) {
                    const index = (y * IMG_SIZE + x) * 4;
                    flattenedArray[kR++] = imageData.data[index];     // Red
                    flattenedArray[kG++] = imageData.data[index + 1]; // Green
                    flattenedArray[kB++] = imageData.data[index + 2]; // Blue
                }
            }

            resolve(flattenedArray);
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageDataUrl;
    });
}

// Run inference on an image
export async function runInference(imageDataUrl: string): Promise<DetectionResult> {
    if (!detector) {
        throw new Error('Detector not initialized');
    }

    const imageData = await prepareImageData(imageDataUrl);
    const result = await detector.inference(imageData);
    return result;
}

// Get scaling info for drawing bboxes on original image
export function getScaleInfo(originalWidth: number, originalHeight: number) {
    const scale = Math.min(IMG_SIZE / originalWidth, IMG_SIZE / originalHeight);
    const newWidth = originalWidth * scale;
    const newHeight = originalHeight * scale;
    const offsetX = (IMG_SIZE - newWidth) / 2;
    const offsetY = (IMG_SIZE - newHeight) / 2;

    return { scale, newWidth, newHeight, offsetX, offsetY };
}

// Convert normalized bbox to original image coordinates
export function bboxToOriginal(
    bbox: [number, number, number, number],
    originalWidth: number,
    originalHeight: number
): { x: number; y: number; width: number; height: number } {
    const { scale, offsetX, offsetY } = getScaleInfo(originalWidth, originalHeight);

    // Bbox is in normalized coordinates relative to IMG_SIZE
    const cx = bbox[0] * IMG_SIZE;
    const cy = bbox[1] * IMG_SIZE;
    const w = bbox[2] * IMG_SIZE;
    const h = bbox[3] * IMG_SIZE;

    // Convert to original image coordinates
    const x = (cx - w / 2 - offsetX) / scale;
    const y = (cy - h / 2 - offsetY) / scale;
    const width = w / scale;
    const height = h / scale;

    return { x, y, width, height };
}
