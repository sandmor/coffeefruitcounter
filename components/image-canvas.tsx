"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { DetectionResult, Detection } from "@/lib/types";
import { CLASS_COLORS, CLASS_LABELS } from "@/lib/types";
import { bboxToOriginal } from "@/lib/wasm-loader";
import { cn } from "@/lib/utils";

interface ImageCanvasProps {
    imageUrl: string | null;
    result: DetectionResult | null;
    className?: string;
}

export function ImageCanvas({ imageUrl, result, className }: ImageCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);

    const drawDetections = useCallback((
        ctx: CanvasRenderingContext2D,
        detections: Detection[],
        originalWidth: number,
        originalHeight: number,
        displayScale: number
    ) => {
        detections.forEach((detection) => {
            const { x, y, width, height } = bboxToOriginal(
                detection.bbox,
                originalWidth,
                originalHeight
            );

            // Scale to display size
            const dx = x * displayScale;
            const dy = y * displayScale;
            const dw = width * displayScale;
            const dh = height * displayScale;

            const color = CLASS_COLORS[detection.class_name] || "#FF0000";

            // Draw bounding box
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(dx, dy, dw, dh);

            // Draw label background
            const label = `${CLASS_LABELS[detection.class_name] || detection.class_name} ${(detection.confidence * 100).toFixed(0)}%`;
            ctx.font = "bold 14px sans-serif";
            const textMetrics = ctx.measureText(label);
            const textHeight = 18;
            const padding = 4;

            ctx.fillStyle = color;
            ctx.fillRect(
                dx,
                dy - textHeight - padding,
                textMetrics.width + padding * 2,
                textHeight + padding
            );

            // Draw label text
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(label, dx + padding, dy - padding - 2);
        });
    }, []);

    // Load image when URL changes
    useEffect(() => {
        if (!imageUrl) {
            setImage(null);
            return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => setImage(img);
        img.src = imageUrl;
    }, [imageUrl]);

    // Draw function
    const draw = useCallback(() => {
        if (!canvasRef.current || !containerRef.current || !image) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        if (containerWidth === 0 || containerHeight === 0) return;

        // Calculate scale to fit container while maintaining aspect ratio
        const scale = Math.min(containerWidth / image.width, containerHeight / image.height);
        const displayWidth = image.width * scale;
        const displayHeight = image.height * scale;

        // Set canvas size
        canvas.width = displayWidth;
        canvas.height = displayHeight;

        // Draw image
        ctx.drawImage(image, 0, 0, displayWidth, displayHeight);

        // Draw detections
        if (result?.detections) {
            drawDetections(ctx, result.detections, image.width, image.height, scale);
        }
    }, [image, result, drawDetections]);

    // Setup ResizeObserver
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver(() => {
            window.requestAnimationFrame(draw);
        });

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, [draw]);

    // Draw when image or result updates
    useEffect(() => {
        draw();
    }, [draw]);

    if (!imageUrl) {
        return (
            <div
                className={cn(
                    "flex items-center justify-center rounded-lg bg-muted/50 text-muted-foreground",
                    className
                )}
            >
                <p className="text-sm">No image selected</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={cn("relative flex items-center justify-center", className)}>
            <canvas ref={canvasRef} className="max-h-full max-w-full rounded-lg shadow-lg" />
        </div>
    );
}
