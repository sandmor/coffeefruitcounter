"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Coffee } from "lucide-react";
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
                "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
                className
            )}
        >
            <Card className="w-full max-w-md mx-4">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <Coffee className="h-12 w-12 text-primary animate-pulse" />
                            <Loader2 className="absolute inset-0 h-12 w-12 animate-spin text-primary/30" />
                        </div>
                        <div className="w-full space-y-2 text-center">
                            <Progress value={progress} className="h-2" />
                            <p className="text-sm text-muted-foreground">{message}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
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
