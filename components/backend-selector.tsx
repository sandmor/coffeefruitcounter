"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BackendType } from "@/lib/types";
import { checkWebGPU } from "@/lib/wasm-loader";
import { cn } from "@/lib/utils";
import { Cpu, Monitor, Zap } from "lucide-react";

interface BackendSelectorProps {
    currentBackend: BackendType | null;
    onSelect: (backend: BackendType) => void;
    disabled?: boolean;
    className?: string;
}

const backends: { id: BackendType; label: string; icon: React.ReactNode; description: string }[] = [
    {
        id: "webgpu",
        label: "WebGPU",
        icon: <Zap className="h-4 w-4" />,
        description: "GPU acceleration (fastest)",
    },
    {
        id: "ndarray",
        label: "CPU",
        icon: <Cpu className="h-4 w-4" />,
        description: "CPU optimized",
    },
];

export function BackendSelector({
    currentBackend,
    onSelect,
    disabled,
    className,
}: BackendSelectorProps) {
    const [webgpuAvailable, setWebgpuAvailable] = React.useState(false);

    React.useEffect(() => {
        checkWebGPU().then(setWebgpuAvailable);
    }, []);

    return (
        <div className={cn("space-y-2", className)}>
            <p className="text-sm font-medium">Compute Backend</p>
            <div className="flex flex-wrap gap-2">
                {backends.map((backend) => {
                    const isDisabled =
                        disabled || (backend.id === "webgpu" && !webgpuAvailable);
                    const isSelected = currentBackend === backend.id;

                    return (
                        <Button
                            key={backend.id}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            disabled={isDisabled}
                            onClick={() => onSelect(backend.id)}
                            className="flex items-center gap-2"
                            title={backend.description}
                        >
                            {backend.icon}
                            {backend.label}
                            {backend.id === "webgpu" && !webgpuAvailable && (
                                <Badge variant="secondary" className="ml-1 text-xs">
                                    N/A
                                </Badge>
                            )}
                        </Button>
                    );
                })}
            </div>
            {!webgpuAvailable && (
                <p className="text-xs text-muted-foreground">
                    WebGPU is not available in your browser. Using CPU backend.
                </p>
            )}
        </div>
    );
}
