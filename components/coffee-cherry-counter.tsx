"use client";

import { useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import type { BackendType } from "@/lib/types";
import { loadWasm, initializeDetector, runInference, checkWebGPU } from "@/lib/wasm-loader";
import { ImageUpload } from "@/components/image-upload";
import { ImageCanvas } from "@/components/image-canvas";
import { StatsDisplay } from "@/components/stats-display";
import { HistoryCarousel } from "@/components/history-carousel";
import { BackendSelector } from "@/components/backend-selector";
import { LoadingOverlay, ProcessingIndicator } from "@/components/loading-overlay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coffee, Github, RefreshCw } from "lucide-react";

export function CoffeeCherryCounter() {
    const {
        detector,
        isModelLoading,
        modelLoadProgress,
        modelLoadMessage,
        currentBackend,
        currentImage,
        currentResult,
        isProcessing,
        history,
        setDetector,
        setIsModelLoading,
        setModelLoadProgress,
        setCurrentBackend,
        setCurrentImage,
        setCurrentResult,
        setIsProcessing,
        addToHistory,
        selectHistoryItem,
        clearHistory,
    } = useAppStore();

    // Initialize WASM and model on backend selection
    const handleBackendSelect = useCallback(
        async (backend: BackendType) => {
            if (currentBackend === backend && detector) return;

            setIsModelLoading(true);
            setModelLoadProgress(0, "Starting...");

            try {
                await loadWasm((progress, message) => {
                    setModelLoadProgress(progress, message);
                });

                const newDetector = await initializeDetector(backend, (progress, message) => {
                    setModelLoadProgress(progress, message);
                });

                setDetector(newDetector);
                setCurrentBackend(backend);
            } catch (error) {
                console.error("Failed to initialize:", error);
                setModelLoadProgress(0, `Error: ${error instanceof Error ? error.message : "Unknown error"}`);
            } finally {
                setIsModelLoading(false);
            }
        },
        [currentBackend, detector, setDetector, setIsModelLoading, setModelLoadProgress, setCurrentBackend]
    );

    // Auto-initialize with best available backend
    useEffect(() => {
        const init = async () => {
            if (!detector && !isModelLoading) {
                const hasGPU = await checkWebGPU();
                const preferredBackend: BackendType = hasGPU ? "webgpu" : "ndarray";
                handleBackendSelect(preferredBackend);
            }
        };
        init();
    }, [detector, isModelLoading, handleBackendSelect]);

    // Handle image selection
    const handleImageSelect = useCallback(
        async (dataUrl: string) => {
            if (!detector || isProcessing) return;

            setCurrentImage(dataUrl);
            setCurrentResult(null);
            setIsProcessing(true);

            try {
                const result = await runInference(dataUrl);
                setCurrentResult(result);

                // Add to history
                addToHistory({
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    imageDataUrl: dataUrl,
                    result,
                    timestamp: Date.now(),
                });
            } catch (error) {
                console.error("Inference failed:", error);
            } finally {
                setIsProcessing(false);
            }
        },
        [detector, isProcessing, setCurrentImage, setCurrentResult, setIsProcessing, addToHistory]
    );

    // Handle history item selection
    const handleHistorySelect = useCallback(
        (id: string) => {
            selectHistoryItem(id);
        },
        [selectHistoryItem]
    );

    // Re-run inference on current image
    const handleReprocess = useCallback(async () => {
        if (currentImage && detector && !isProcessing) {
            setIsProcessing(true);
            try {
                const result = await runInference(currentImage);
                setCurrentResult(result);
            } catch (error) {
                console.error("Reprocess failed:", error);
            } finally {
                setIsProcessing(false);
            }
        }
    }, [currentImage, detector, isProcessing, setIsProcessing, setCurrentResult]);

    const isReady = detector && !isModelLoading;

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <LoadingOverlay
                isLoading={isModelLoading}
                progress={modelLoadProgress}
                message={modelLoadMessage}
            />

            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <Coffee className="h-8 w-8 text-primary" />
                        <div>
                            <h1 className="text-lg font-bold">Coffee Cherry Counter</h1>
                            <p className="text-xs text-muted-foreground">
                                AI-powered cherry detection
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {currentBackend && (
                            <Badge variant="outline" className="hidden sm:flex">
                                Backend: {currentBackend}
                            </Badge>
                        )}
                        <Button variant="ghost" size="icon" asChild>
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View on GitHub"
                            >
                                <Github className="h-5 w-5" />
                            </a>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6">
                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                    {/* Left Column - Image and Upload */}
                    <div className="space-y-6">
                        {/* Image Display */}
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">Image Analysis</CardTitle>
                                    <div className="flex items-center gap-2">
                                        <ProcessingIndicator isProcessing={isProcessing} />
                                        {currentImage && isReady && (
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={handleReprocess}
                                                disabled={isProcessing}
                                                title="Re-analyze"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {currentImage ? (
                                    <ImageCanvas
                                        imageUrl={currentImage}
                                        result={currentResult}
                                        className="h-[400px] sm:h-[500px]"
                                    />
                                ) : (
                                    <ImageUpload
                                        onImageSelect={handleImageSelect}
                                        disabled={!isReady || isProcessing}
                                        className="h-[400px] sm:h-[500px]"
                                    />
                                )}
                            </CardContent>
                        </Card>

                        {/* Upload another image (shown when image is selected) */}
                        {currentImage && (
                            <ImageUpload
                                onImageSelect={handleImageSelect}
                                disabled={!isReady || isProcessing}
                                className="h-32"
                            />
                        )}

                        {/* History Carousel */}
                        <HistoryCarousel
                            history={history}
                            currentImageId={history.find(h => h.imageDataUrl === currentImage)?.id}
                            onSelect={handleHistorySelect}
                            onClear={clearHistory}
                        />
                    </div>

                    {/* Right Column - Stats and Controls */}
                    <div className="space-y-6">
                        {/* Backend Selector */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Settings</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <BackendSelector
                                    currentBackend={currentBackend}
                                    onSelect={handleBackendSelect}
                                    disabled={isModelLoading || isProcessing}
                                />
                            </CardContent>
                        </Card>

                        {/* Stats Display */}
                        <StatsDisplay result={currentResult} />

                        {/* Info Card */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">About</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <p>
                                    This app uses a YOLOv11 model to detect and classify coffee cherries
                                    by their maturity state.
                                </p>
                                <div className="space-y-1">
                                    <p className="font-medium text-foreground">Maturity Classes:</p>
                                    <ul className="ml-4 list-disc space-y-0.5">
                                        <li><span className="text-red-600 font-medium">Ripe</span> - Ready for harvest</li>
                                        <li><span className="text-orange-500 font-medium">Semi-ripe</span> - Almost ready</li>
                                        <li><span className="text-green-600 font-medium">Unripe</span> - Needs more time</li>
                                        <li><span className="text-rose-900 font-medium">Overripe</span> - Past optimal</li>
                                        <li><span className="text-amber-800 font-medium">Dry</span> - Dried on tree</li>
                                    </ul>
                                </div>
                                <p className="text-xs">
                                    Powered by <a href="https://burn.dev" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Burn</a> ML framework running in WebAssembly.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t py-4 text-center text-xs text-muted-foreground">
                <p>
                    Coffee Cherry Counter • Built with Next.js, Burn, and WebAssembly
                </p>
            </footer>
        </div>
    );
}
