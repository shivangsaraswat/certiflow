'use client';

import {
    Bold,
    Italic,
    Underline,
    AlignLeft,
    AlignCenter,
    AlignRight,
    ChevronDown,
    Trash2,
    Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ATTRIBUTE_TYPES, AVAILABLE_FONTS, DynamicAttribute } from '@/types';

interface FormattingToolbarProps {
    attribute: DynamicAttribute | null;
    onChange: (updates: Partial<DynamicAttribute>) => void;
    onDelete: () => void;
}

export function FormattingToolbar({ attribute, onChange, onDelete }: FormattingToolbarProps) {
    if (!attribute) return null;

    const isText = attribute.type === 'text' || attribute.type === 'date';

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-lg border bg-background p-1.5 shadow-lg z-40 animate-in fade-in slide-in-from-bottom-2">
            {isText && (
                <>
                    <Select
                        value={attribute.fontFamily}
                        onValueChange={(value) => onChange({ fontFamily: value })}
                    >
                        <SelectTrigger className="h-8 w-[140px] border-none bg-transparent hover:bg-muted/50 focus:ring-0 text-xs">
                            <SelectValue placeholder="Font" />
                        </SelectTrigger>
                        <SelectContent>
                            {AVAILABLE_FONTS.map((font) => (
                                <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                                    {font.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Separator orientation="vertical" className="mx-1 h-6" />

                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => onChange({ fontSize: Math.max(8, (attribute.fontSize || 12) - 1) })}
                        >
                            -
                        </Button>
                        <Input
                            type="number"
                            className="h-8 w-12 border-none bg-transparent text-center text-xs p-0 focus-visible:ring-0"
                            value={attribute.fontSize}
                            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => onChange({ fontSize: (attribute.fontSize || 12) + 1 })}
                        >
                            +
                        </Button>
                    </div>

                    <Separator orientation="vertical" className="mx-1 h-6" />

                    <div className="flex items-center gap-0.5">
                        <Button
                            variant={attribute.fontWeight === 'bold' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onChange({ fontWeight: attribute.fontWeight === 'bold' ? 'normal' : 'bold' })}
                        >
                            <Bold className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            disabled // Italic not in types yet
                        >
                            <Italic className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            disabled // Underline not in types yet
                        >
                            <Underline className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    <Separator orientation="vertical" className="mx-1 h-6" />

                    <div className="flex items-center gap-0.5">
                        <Button
                            variant={attribute.align === 'left' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onChange({ align: 'left' })}
                        >
                            <AlignLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant={attribute.align === 'center' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onChange({ align: 'center' })}
                        >
                            <AlignCenter className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant={attribute.align === 'right' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onChange({ align: 'right' })}
                        >
                            <AlignRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    <Separator orientation="vertical" className="mx-1 h-6" />

                    <div className="flex items-center gap-1 px-1">
                        <div
                            className="h-5 w-5 rounded border shadow-sm cursor-pointer"
                            style={{ backgroundColor: attribute.color || '#000000' }}
                            onClick={() => {
                                // Simple color toggle for demo, planned full picker later
                                const colors = ['#000000', '#2563eb', '#dc2626', '#16a34a', '#d97706'];
                                const currIdx = colors.indexOf(attribute.color || '#000000');
                                const nextColor = colors[(currIdx + 1) % colors.length];
                                onChange({ color: nextColor });
                            }}
                            title="Click to cycle colors (Full picker coming soon)"
                        />
                    </div>
                </>
            )}

            <Separator orientation="vertical" className="mx-1 h-6" />

            <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={onDelete}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}
