"use client";

import { useCallback } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    onImageSelect: (dataUrl: string) => void;
    disabled?: boolean;
    className?: string;
}

export function ImageUpload({ onImageSelect, disabled, className }: ImageUploadProps) {
    const handleFileChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file && file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = e.target?.result as string;
                    onImageSelect(result);
                };
                reader.readAsDataURL(file);
            }
            // Reset input value to allow selecting the same file again
            event.target.value = "";
        },
        [onImageSelect]
    );

    const handleDrop = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            event.stopPropagation();

            if (disabled) return;

            const file = event.dataTransfer.files?.[0];
            if (file && file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = e.target?.result as string;
                    onImageSelect(result);
                };
                reader.readAsDataURL(file);
            }
        },
        [onImageSelect, disabled]
    );

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    }, []);

    return (
        <div
            className={cn(
                "relative flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-muted-foreground/50",
                disabled && "pointer-events-none opacity-50",
                className
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="rounded-full bg-muted p-4">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium">
                        Drag & drop an image here
                    </p>
                    <p className="text-xs text-muted-foreground">
                        or click to browse
                    </p>
                </div>
            </div>

            <Button variant="outline" disabled={disabled} asChild>
                <label className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    Select Image
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="sr-only"
                        disabled={disabled}
                    />
                </label>
            </Button>

            <p className="text-xs text-muted-foreground">
                Supports JPG, PNG, WebP images
            </p>
        </div>
    );
}
