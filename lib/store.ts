import { create } from 'zustand';
import type { DetectionResult, BackendType } from './types';

// Define a simpler detector interface for the store
interface DetectorInstance {
    is_ready(): boolean;
    inference(input: Float32Array): Promise<DetectionResult>;
}

export interface HistoryItem {
    id: string;
    imageDataUrl: string;
    result: DetectionResult;
    timestamp: number;
}

interface AppState {
    // Model state
    detector: DetectorInstance | null;
    isModelLoading: boolean;
    modelLoadProgress: number;
    modelLoadMessage: string;
    currentBackend: BackendType | null;
    wasmReady: boolean;

    // Current image state
    currentImage: string | null;
    currentResult: DetectionResult | null;
    isProcessing: boolean;

    // History
    history: HistoryItem[];

    // Actions
    setDetector: (detector: DetectorInstance | null) => void;
    setIsModelLoading: (loading: boolean) => void;
    setModelLoadProgress: (progress: number, message: string) => void;
    setCurrentBackend: (backend: BackendType | null) => void;
    setWasmReady: (ready: boolean) => void;
    setCurrentImage: (image: string | null) => void;
    setCurrentResult: (result: DetectionResult | null) => void;
    setIsProcessing: (processing: boolean) => void;
    addToHistory: (item: HistoryItem) => void;
    selectHistoryItem: (id: string) => void;
    clearHistory: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    // Initial state
    detector: null,
    isModelLoading: false,
    modelLoadProgress: 0,
    modelLoadMessage: '',
    currentBackend: null,
    wasmReady: false,
    currentImage: null,
    currentResult: null,
    isProcessing: false,
    history: [],

    // Actions
    setDetector: (detector) => set({ detector }),
    setIsModelLoading: (isModelLoading) => set({ isModelLoading }),
    setModelLoadProgress: (progress, message) => set({ modelLoadProgress: progress, modelLoadMessage: message }),
    setCurrentBackend: (backend) => set({ currentBackend: backend }),
    setWasmReady: (ready) => set({ wasmReady: ready }),
    setCurrentImage: (image) => set({ currentImage: image }),
    setCurrentResult: (result) => set({ currentResult: result }),
    setIsProcessing: (processing) => set({ isProcessing: processing }),

    addToHistory: (item) => set((state) => ({
        history: [item, ...state.history].slice(0, 20) // Keep last 20 items
    })),

    selectHistoryItem: (id) => {
        const state = get();
        const item = state.history.find(h => h.id === id);
        if (item) {
            set({
                currentImage: item.imageDataUrl,
                currentResult: item.result,
            });
        }
    },

    clearHistory: () => set({ history: [] }),
}));
