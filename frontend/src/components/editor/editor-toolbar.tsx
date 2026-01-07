'use client';

import {
    ImagePlus,
    RotateCcw,
    RotateCw,
    Eye,
    ChevronDown,
    Layout
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

interface EditorToolbarProps {
    scale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFitToScreen: () => void;
    onAddBackground: () => void;
    onPreview: () => void;
}

export function EditorToolbar({
    scale,
    onZoomIn,
    onZoomOut,
    onFitToScreen, // Unused in this simplified version but part of interface
    onAddBackground,
    onPreview
}: EditorToolbarProps) {
    return (
        <div className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-4 z-20">
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 text-xs font-medium"
                    onClick={onAddBackground}
                >
                    <ImagePlus className="h-3.5 w-3.5" />
                    Add Background
                </Button>

                <Separator orientation="vertical" className="mx-2 h-6" />

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <RotateCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
                            <Layout className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>A4 Landscape</span>
                            <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>A4 Landscape (297 x 210mm)</DropdownMenuItem>
                        <DropdownMenuItem>A4 Portrait (210 x 297mm)</DropdownMenuItem>
                        <DropdownMenuItem>US Letter Landscape</DropdownMenuItem>
                        <DropdownMenuItem>US Letter Portrait</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Separator orientation="vertical" className="mx-2 h-6" />

                <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 gap-2 text-xs"
                    onClick={onPreview}
                >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                </Button>
            </div>
        </div>
    );
}
