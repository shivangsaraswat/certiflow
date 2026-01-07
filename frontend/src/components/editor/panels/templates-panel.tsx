'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Layout,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input'; // Removed Search
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTemplates, GetTemplatesParams } from '@/lib/api';
import type { Template } from '@/types';
import { useSession } from 'next-auth/react';

interface TemplatesPanelProps {
    onSelectTemplate: (templateId: string) => void;
}

export function TemplatesPanel({ onSelectTemplate }: TemplatesPanelProps) {
    const { data: session } = useSession();
    const userId = session?.user?.id;

    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // const [search, setSearch] = useState(''); // Removed
    const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
    const [activeStyle, setActiveStyle] = useState<string | undefined>(undefined);
    const [activeColor, setActiveColor] = useState<string | undefined>(undefined);
    const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');

    const fetchTemplates = useCallback(async () => {
        if (!userId) return;

        setIsLoading(true);
        try {
            const params: GetTemplatesParams = {
                // search: debouncedSearch, // Removed
                category: activeCategory,
                style: activeStyle,
                color: activeColor,
            };

            const res = await getTemplates(userId, params);
            if (res.success && res.data) {
                setTemplates(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, activeCategory, activeStyle, activeColor]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    // Client-side filtering for orientation (width > height)
    const filteredTemplates = templates.filter(t => {
        const isLandscape = t.width >= t.height;
        return orientation === 'landscape' ? isLandscape : !isLandscape;
    });

    const categories = ['Professional', 'Academic', 'Events', 'Corporate'];
    const styles = ['Modern', 'Classic', 'Minimal', 'Bold'];
    const colors = ['Blue', 'Gold', 'Green', 'Red', 'Black'];

    const clearFilters = () => {
        setActiveCategory(undefined);
        setActiveStyle(undefined);
        setActiveColor(undefined);
    };

    const hasFilters = activeCategory || activeStyle || activeColor;

    return (
        <div className="flex h-full flex-col bg-background">
            <div className="p-4 space-y-4 border-b">
                {/* 1. Orientation Tabs */}
                <Tabs
                    defaultValue="landscape"
                    value={orientation}
                    onValueChange={(val) => setOrientation(val as 'landscape' | 'portrait')}
                    className="w-full"
                >
                    <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="landscape">Landscape</TabsTrigger>
                        <TabsTrigger value="portrait">Portrait</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* 2. Compact Filter Pills */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Filters</span>
                        {hasFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-4 px-1 text-[10px] text-muted-foreground hover:text-foreground">
                                Clear
                            </Button>
                        )}
                    </div>

                    {/* Categories */}
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                        <Badge
                            variant="outline"
                            className="shrink-0 h-6 px-2 text-[10px] font-normal cursor-default border-dashed opacity-50"
                        >
                            Category:
                        </Badge>
                        {categories.map(cat => (
                            <Badge
                                key={cat}
                                variant={activeCategory === cat ? "default" : "secondary"}
                                className="shrink-0 cursor-pointer text-[10px] h-6 px-2.5 font-normal hover:bg-primary/20 transition-colors"
                                onClick={() => setActiveCategory(activeCategory === cat ? undefined : cat)}
                            >
                                {cat}
                            </Badge>
                        ))}
                    </div>

                    {/* Styles */}
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                        <Badge
                            variant="outline"
                            className="shrink-0 h-6 px-2 text-[10px] font-normal cursor-default border-dashed opacity-50"
                        >
                            Style:
                        </Badge>
                        {styles.map(style => (
                            <Badge
                                key={style}
                                variant={activeStyle === style ? "default" : "secondary"}
                                className="shrink-0 cursor-pointer text-[10px] h-6 px-2.5 font-normal hover:bg-primary/20 transition-colors"
                                onClick={() => setActiveStyle(activeStyle === style ? undefined : style)}
                            >
                                {style}
                            </Badge>
                        ))}
                    </div>

                    {/* Colors (Optional, maybe specific UI) */}
                    {/* {activeCategory || activeStyle ? ( // Only show colors if drilled down? Or always? Let's show simplified color row }
                         <div className="flex gap-1 overflow-x-auto scrollbar-none pt-1">
                            {colors.map(color => (
                                <div
                                    key={color}
                                    className={`h-4 w-4 rounded-full border cursor-pointer ${activeColor === color ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                                    style={{ backgroundColor: color.toLowerCase() }}
                                    onClick={() => setActiveColor(activeColor === color ? undefined : color)}
                                    title={color}
                                />
                            ))}
                        </div>
                    ) : null} */}
                </div>
            </div>

            <ScrollArea className="flex-1 p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* All Results */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Layout className="h-3.5 w-3.5" />
                                    {filteredTemplates.length} Templates
                                </div>
                            </div>

                            {filteredTemplates.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground text-sm">
                                    No templates found.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {filteredTemplates.map((template) => (
                                        <div
                                            key={template.id}
                                            className="group relative aspect-[1.414] cursor-pointer overflow-hidden rounded-lg border bg-muted transition-all hover:ring-2 hover:ring-primary shadow-sm hover:shadow-md"
                                            onClick={() => onSelectTemplate(template.id)}
                                        >
                                            {/* Preview Image (Thumbnail) */}
                                            {template.fileUrl ? (
                                                <img
                                                    src={`${template.fileUrl}?tr=w-300`} // Simple ImageKit transformation if applicable
                                                    alt={template.name}
                                                    className="h-full w-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs bg-zinc-100">
                                                    No Preview
                                                </div>
                                            )}

                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-4 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex flex-col justify-end">
                                                <span className="text-[10px] font-semibold line-clamp-1">{template.name}</span>
                                                {template.category && <span className="text-[9px] opacity-80">{template.category}</span>}
                                            </div>

                                            {/* Public Badge */}
                                            {template.isPublic && (
                                                <Badge className="absolute top-1 right-1 h-4 px-1 text-[9px] bg-blue-500/80 hover:bg-blue-600/80 border-none text-white">
                                                    Public
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
