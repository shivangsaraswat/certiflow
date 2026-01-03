'use client';

/**
 * Template Card Component
 * Displays a PDF template preview with actions
 */

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Trash2, Edit, Eye, FileText, Layers } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Template } from '@/types';
import { getViewUrl } from '@/lib/api';

interface TemplateCardProps {
    template: Template;
    onDelete?: (id: string) => void;
}

export function TemplateCard({ template, onDelete }: TemplateCardProps) {
    const [imageError, setImageError] = useState(false);
    const previewUrl = getViewUrl('templates', template.filename);
    const thumbnailUrl = getViewUrl('templates', template.filename, true);

    return (
        <Card className="group relative overflow-hidden transition-all hover:shadow-md border-border/50 bg-card">
            {/* Preview Area */}
            <div className="relative flex aspect-[4/3] items-center justify-center bg-muted/20 border-b border-border/50 group-hover:bg-muted/30 transition-colors overflow-hidden">
                {!imageError ? (
                    <img
                        src={thumbnailUrl}
                        alt={template.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="flex flex-col items-center gap-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                        <FileText className="h-10 w-10 stroke-1" />
                        <span className="text-xs font-medium tracking-wide">PDF Template</span>
                    </div>
                )}

                {/* Page count pill */}
                <div className="absolute left-3 top-3">
                    <Badge variant="secondary" className="gap-1.5 bg-background/80 backdrop-blur-sm border shadow-sm px-2 py-0.5 font-normal">
                        <Layers className="h-3 w-3 text-muted-foreground" />
                        {template.pageCount}
                    </Badge>
                </div>

                {/* Dimensions pill */}
                <div className="absolute right-3 top-3">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border shadow-sm px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {Math.round(template.width)}×{Math.round(template.height)}
                    </Badge>
                </div>

                {/* Overlay Action */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 backdrop-blur-[1px] transition-all duration-200 group-hover:opacity-100 dark:bg-white/5">
                    <Link href={`/generate?template=${template.id}`}>
                        <Button size="sm" className="h-9 px-4 font-medium shadow-sm" variant="default">
                            Select Template
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Content */}
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="truncate font-medium leading-none tracking-tight">{template.name}</h3>
                        {template.description && (
                            <p className="line-clamp-1 text-xs text-muted-foreground">
                                {template.description}
                            </p>
                        )}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground -mr-2">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem asChild>
                                <Link href={`/templates/${template.id}`} className="flex items-center cursor-pointer">
                                    <Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                    <span>Edit</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer">
                                    <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                    <span>Preview</span>
                                </a>
                            </DropdownMenuItem>
                            {onDelete && (
                                <>
                                    <div className="h-px bg-border my-1" />
                                    <DropdownMenuItem
                                        onClick={() => onDelete(template.id)}
                                        className="text-destructive focus:text-destructive cursor-pointer"
                                    >
                                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>

            {/* Minimal Footer */}
            <CardFooter className="px-4 pb-4 pt-0">
                <div className="flex w-full items-center gap-2 text-[10px] text-muted-foreground/60">
                    <span>Added {new Date(template.createdAt).toLocaleDateString()}</span>
                </div>
            </CardFooter>
        </Card>
    );
}
