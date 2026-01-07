"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
    isLoading: boolean;
    progress: number;
    message: string;
    className?: string;
}

export function LoadingOverlay({
    isLoading,
    progress,
    message,
    className,
}: LoadingOverlayProps) {
    if (!isLoading) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
                className
            )}
        >
            <div className="flex w-full max-w-sm flex-col items-center gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="relative flex items-center justify-center">
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                    
                    {/* Hero Logo */}
                    <Logo className="relative h-20 w-20 animate-bounce duration-[2000ms]" />
                </div>

                <div className="w-full space-y-3 text-center">
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold tracking-tight">Initializing AI</h3>
                        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
                    </div>
                    
                    <Progress value={progress} className="h-1.5 w-full bg-primary/20" />
                    
                    <p className="text-xs font-mono text-muted-foreground/60">
                        {Math.round(progress)}% COMPLETE
                    </p>
                </div>
            </div>
        </div>
    );
}

interface ProcessingIndicatorProps {
    isProcessing: boolean;
    className?: string;
}

export function ProcessingIndicator({
    isProcessing,
    className,
}: ProcessingIndicatorProps) {
    if (!isProcessing) return null;

    return (
        <div
            className={cn(
                "flex items-center gap-2 text-sm text-muted-foreground",
                className
            )}
        >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing image...</span>
        </div>
    );
}
