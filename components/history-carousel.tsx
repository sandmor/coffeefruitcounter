"use client";

import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { HistoryItem } from "@/lib/store";
import { cn } from "@/lib/utils";
import { History, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

interface HistoryCarouselProps {
    history: HistoryItem[];
    currentImageId?: string;
    onSelect: (id: string) => void;
    onClear: () => void;
    className?: string;
}

export function HistoryCarousel({
    history,
    currentImageId,
    onSelect,
    onClear,
    className,
}: HistoryCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = 200;
            scrollRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    if (history.length === 0) {
        return (
            <Card className={cn("", className)}>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <History className="h-5 w-5" />
                        History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Analyzed images will appear here
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <History className="h-5 w-5" />
                    History ({history.length})
                </CardTitle>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onClear}
                    title="Clear history"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="relative">
                {/* Navigation buttons */}
                <Button
                    variant="outline"
                    size="icon-sm"
                    className="absolute left-0 top-1/2 z-10 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                    onClick={() => scroll("left")}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon-sm"
                    className="absolute right-0 top-1/2 z-10 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                    onClick={() => scroll("right")}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Carousel */}
                <div
                    ref={scrollRef}
                    className="flex gap-3 overflow-x-auto px-6 py-2 scrollbar-hide"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {history.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onSelect(item.id)}
                            className={cn(
                                "group relative flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all hover:border-primary",
                                currentImageId === item.id
                                    ? "border-primary ring-2 ring-primary/20"
                                    : "border-transparent"
                            )}
                        >
                            <img
                                src={item.imageDataUrl}
                                alt={`History ${item.id}`}
                                className="h-20 w-20 object-cover"
                            />
                            <Badge
                                variant="secondary"
                                className="absolute bottom-1 right-1 bg-background/80 text-xs backdrop-blur-sm"
                            >
                                {item.result.total}
                            </Badge>
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
