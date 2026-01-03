'use client';

/**
 * Template Card Component
 * Displays a PDF template preview with actions
 */

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
    const previewUrl = getViewUrl('templates', template.filename);

    return (
        <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
            {/* Preview - PDF Icon since we can't easily preview PDFs */}
            <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileText className="h-12 w-12" />
                    <span className="text-sm font-medium">PDF Template</span>
                </div>

                {/* Page count badge */}
                <div className="absolute left-3 top-3">
                    <Badge variant="secondary" className="gap-1">
                        <Layers className="h-3 w-3" />
                        {template.pageCount} {template.pageCount === 1 ? 'page' : 'pages'}
                    </Badge>
                </div>

                {/* Overlay Actions */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100">
                    <Badge variant="secondary" className="bg-white/90 text-black dark:bg-black/80 dark:text-white">
                        {Math.round(template.width)} × {Math.round(template.height)} pt
                    </Badge>
                    <Link href={`/generate?template=${template.id}`}>
                        <Button size="sm" className="gap-1">
                            Use Template
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Info */}
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold">{template.name}</h3>
                        {template.description && (
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {template.description}
                            </p>
                        )}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/templates/${template.id}`} className="flex items-center gap-2">
                                    <Edit className="h-4 w-4" />
                                    Edit Positions
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    View PDF
                                </a>
                            </DropdownMenuItem>
                            {onDelete && (
                                <DropdownMenuItem
                                    onClick={() => onDelete(template.id)}
                                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>

            {/* Footer */}
            <CardFooter className="border-t px-4 py-3">
                <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        PDF
                    </span>
                    <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                </div>
            </CardFooter>
        </Card>
    );
}
