"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DetectionResult } from "@/lib/types";
import { CLASS_LABELS, CLASS_BG_COLORS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { Timer, Hash } from "lucide-react";

interface StatsDisplayProps {
    result: DetectionResult | null;
    className?: string;
}

export function StatsDisplay({ result, className }: StatsDisplayProps) {
    if (!result) {
        return (
            <Card className={cn("", className)}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Logo className="h-5 w-5" />
                        Detection Statistics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Upload an image to see detection statistics
                    </p>
                </CardContent>
            </Card>
        );
    }

    const { counts, total, inference_time_ms } = result;

    const classData = [
        { key: "ripe", count: counts.ripe, label: CLASS_LABELS.ripe, color: CLASS_BG_COLORS.ripe },
        { key: "semi_ripe", count: counts.semi_ripe, label: CLASS_LABELS.semi_ripe, color: CLASS_BG_COLORS.semi_ripe },
        { key: "unripe", count: counts.unripe, label: CLASS_LABELS.unripe, color: CLASS_BG_COLORS.unripe },
        { key: "overripe", count: counts.overripe, label: CLASS_LABELS.overripe, color: CLASS_BG_COLORS.overripe },
        { key: "dry", count: counts.dry, label: CLASS_LABELS.dry, color: CLASS_BG_COLORS.dry },
    ];

    return (
        <Card className={cn("", className)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Logo className="h-5 w-5" />
                    Detection Statistics
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Total count */}
                <div className="flex items-center justify-between rounded-lg bg-primary/10 p-3">
                    <div className="flex items-center gap-2">
                        <Hash className="h-5 w-5 text-primary" />
                        <span className="font-medium">Total Cherries</span>
                    </div>
                    <span className="text-2xl font-bold text-primary">{total}</span>
                </div>

                {/* Per-class counts */}
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">By Maturity</p>
                    <div className="grid grid-cols-1 gap-2">
                        {classData.map(({ key, count, label, color }) => (
                            <div
                                key={key}
                                className="flex items-center justify-between rounded-md border p-2"
                            >
                                <div className="flex items-center gap-2">
                                    <div className={cn("h-3 w-3 rounded-full", color)} />
                                    <span className="text-sm">{label}</span>
                                </div>
                                <Badge variant="secondary" className="tabular-nums">
                                    {count}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Inference time */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Timer className="h-3 w-3" />
                    <span>Inference time: {inference_time_ms.toFixed(0)}ms</span>
                </div>
            </CardContent>
        </Card>
    );
}
