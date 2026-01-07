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
        <Card className="group relative overflow-hidden transition-all hover:shadow-md border-border/50 bg-card p-0">
            {/* Preview Area - No padding, direct edge-to-edge */}
            <Link href={`/templates/${template.id}`} className="block">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/20">
                    {!imageError ? (
                        <img
                            src={thumbnailUrl}
                            alt={template.name}
                            className="h-full w-full object-cover"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground/50">
                            <FileText className="h-10 w-10 stroke-1" />
                            <span className="text-xs font-medium tracking-wide">PDF Template</span>
                        </div>
                    )}

                    {/* Page count pill */}
                    <div className="absolute left-2 top-2">
                        <Badge variant="secondary" className="gap-1.5 bg-background/90 backdrop-blur-sm shadow-sm px-1.5 py-0 h-5 text-[10px] font-normal border-0">
                            <Layers className="h-3 w-3 text-muted-foreground" />
                            {template.pageCount}
                        </Badge>
                    </div>

                    {/* Dimensions pill */}
                    <div className="absolute right-2 top-2">
                        <Badge variant="outline" className="bg-background/90 backdrop-blur-sm border-0 shadow-sm px-1.5 py-0 h-5 text-[10px] font-mono text-muted-foreground">
                            {Math.round(template.width)}×{Math.round(template.height)}
                        </Badge>
                    </div>
                </div>
            </Link>

            {/* Content - Compact spacing */}
            <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-0.5">
                        <h3 className="truncate text-sm font-medium leading-tight">{template.name}</h3>
                        {template.description && (
                            <p className="line-clamp-1 text-[11px] text-muted-foreground">
                                {template.description}
                            </p>
                        )}
                        <p className="text-[10px] text-muted-foreground/60 pt-1">
                            Added {new Date(template.createdAt).toLocaleDateString()}
                        </p>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground -mr-1 -mt-1">
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
        </Card>
    );
}
