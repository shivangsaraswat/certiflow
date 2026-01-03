'use client';

/**
 * Property Panel
 * Side panel for editing selected attribute properties
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, Type, Calendar, Signature, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import type { DynamicAttribute } from '@/types';
import { AVAILABLE_FONTS, FONT_SIZES, ATTRIBUTE_TYPES } from '@/types';
import { cn } from '@/lib/utils';

interface PropertyPanelProps {
    attribute: DynamicAttribute | null;
    attributes?: DynamicAttribute[];
    pageCount: number;
    pdfDimensions?: { width: number; height: number };
    onChange: (updates: Partial<DynamicAttribute>) => void;
    onDelete: () => void;
    onSelect?: (id: string) => void;
}

export function PropertyPanel({
    attribute,
    attributes = [],
    pageCount,
    pdfDimensions,
    onChange,
    onDelete,
    onSelect,
}: PropertyPanelProps) {
    if (!attribute) {
        return (
            <Card className="flex h-full w-80 flex-col overflow-hidden border-l border-y-0 border-r-0 rounded-none shadow-none">
                <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="text-lg font-semibold">Template Info</CardTitle>
                </CardHeader>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Dimensions Info */}
                    <div className="rounded-lg border bg-card p-3 shadow-sm space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Dimensions</span>
                            <span className="font-mono">{pdfDimensions ? `${Math.round(pdfDimensions.width)} × ${Math.round(pdfDimensions.height)} pt` : '-'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Pages</span>
                            <span>{pageCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total Fields</span>
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{attributes.length}</span>
                        </div>
                    </div>

                    <Separator />

                    {/* Attributes List */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Placed Attributes</h4>
                        {attributes.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No attributes placed yet.
                                <br />
                                Click "Add Attribute" below.
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                {attributes.map((attr) => (
                                    <div
                                        key={attr.id}
                                        onClick={() => onSelect?.(attr.id)}
                                        className="flex cursor-pointer items-center justify-between rounded-md border bg-card px-3 py-2 text-sm transition-colors hover:border-primary hover:shadow-sm"
                                    >
                                        <div className="flex items-center gap-2">
                                            {attr.type === 'signature' ? (
                                                <Signature className="h-3.5 w-3.5 text-muted-foreground" />
                                            ) : attr.type === 'date' ? (
                                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                            ) : (
                                                <Type className="h-3.5 w-3.5 text-muted-foreground" />
                                            )}
                                            <span className="font-medium truncate max-w-[120px]">{attr.name}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">Pg {attr.page}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        );
    }

    const TypeIcon = attribute.type === 'date' ? Calendar : attribute.type === 'signature' ? Signature : Type;

    return (
        <div className="flex h-full w-80 flex-col bg-background">
            <div className="border-b px-4 py-3 bg-muted/20">
                <h3 className="flex items-center gap-2 font-semibold text-sm">
                    <TypeIcon className="h-4 w-4 text-primary" />
                    Edit Attribute
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-muted">
                <div className="space-y-5">
                    {/* Basic Info */}
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">Display Name</Label>
                            <Input
                                id="name"
                                value={attribute.name}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    // Auto-generate placeholder: strip spaces for a clean variable tag
                                    const generated = `{${val.replace(/\s+/g, '')}}`;
                                    onChange({ name: val, placeholder: generated });
                                }}
                                placeholder="Recipient Name"
                                className="h-8 text-sm"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="placeholder" className="text-xs font-medium text-muted-foreground">Placeholder Tag</Label>
                            <div className="relative">
                                <span className="absolute left-2.5 top-2 text-muted-foreground/60 text-xs font-mono">{'{'}</span>
                                <Input
                                    id="placeholder"
                                    value={attribute.placeholder.replace(/^\{|\}$/g, '')}
                                    onChange={(e) => onChange({ placeholder: `{${e.target.value}}` })}
                                    className="h-8 pl-5 font-mono text-sm"
                                />
                                <span className="absolute right-2.5 top-2 text-muted-foreground/60 text-xs font-mono">{'}'}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between py-1">
                            <Label htmlFor="required" className="text-xs font-medium cursor-pointer">Required</Label>
                            <Switch
                                id="required"
                                checked={attribute.required}
                                onCheckedChange={(checked) => onChange({ required: checked })}
                                className="scale-90"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground">Type</Label>
                            <Select
                                value={attribute.type}
                                onValueChange={(value: 'text' | 'date' | 'signature') => onChange({ type: value })}
                            >
                                <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ATTRIBUTE_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            <div className="flex items-center gap-2 text-sm">
                                                {type.value === 'signature' ? <Signature className="h-3 w-3" /> : type.value === 'date' ? <Calendar className="h-3 w-3" /> : <Type className="h-3 w-3" />}
                                                {type.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Separator />

                    {/* Position */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-foreground">Position</h4>
                            {pageCount > 1 && (
                                <div className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Page {attribute.page}</div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label htmlFor="x" className="text-[10px] text-muted-foreground uppercase tracking-wide">X Axis</Label>
                                <Input
                                    id="x"
                                    type="number"
                                    value={Math.round(attribute.x)}
                                    onChange={(e) => onChange({ x: parseFloat(e.target.value) || 0 })}
                                    className="h-8 tabular-nums text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="y" className="text-[10px] text-muted-foreground uppercase tracking-wide">Y Axis</Label>
                                <Input
                                    id="y"
                                    type="number"
                                    value={Math.round(attribute.y)}
                                    onChange={(e) => onChange({ y: parseFloat(e.target.value) || 0 })}
                                    className="h-8 tabular-nums text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {attribute.type !== 'signature' && (
                        <>
                            <Separator />

                            {/* Typography */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-semibold text-foreground">Typography</h4>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Font Family</Label>
                                        <Select
                                            value={attribute.fontFamily}
                                            onValueChange={(value) => onChange({ fontFamily: value })}
                                        >
                                            <SelectTrigger className="h-8 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {AVAILABLE_FONTS.map((font) => (
                                                    <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                                                        {font.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Size</Label>
                                            <Select
                                                value={String(attribute.fontSize)}
                                                onValueChange={(value) => onChange({ fontSize: parseInt(value) })}
                                            >
                                                <SelectTrigger className="h-8 text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {FONT_SIZES.map((size) => (
                                                        <SelectItem key={size} value={String(size)}>
                                                            {size}pt
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Weight</Label>
                                            <Select
                                                value={attribute.fontWeight}
                                                onValueChange={(value: 'normal' | 'bold') => onChange({ fontWeight: value })}
                                            >
                                                <SelectTrigger className="h-8 text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="normal">Normal</SelectItem>
                                                    <SelectItem value="bold" className="font-bold">Bold</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Appearance</Label>
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 flex-1 items-center gap-2 rounded-md border bg-card px-2">
                                                <input
                                                    type="color"
                                                    value={attribute.color}
                                                    onChange={(e) => onChange({ color: e.target.value })}
                                                    className="h-4 w-4 cursor-pointer rounded-sm border-0 p-0"
                                                />
                                                <span className="text-xs font-mono text-muted-foreground">{attribute.color}</span>
                                            </div>
                                            <div className="flex h-8 rounded-md border shadow-sm items-center bg-card">
                                                {['left', 'center', 'right'].map((align) => (
                                                    <button
                                                        key={align}
                                                        onClick={() => onChange({ align: align as any })}
                                                        className={cn(
                                                            "flex h-full w-8 items-center justify-center border-r last:border-r-0 hover:bg-muted transition-colors",
                                                            attribute.align === align ? "bg-muted text-primary" : "text-muted-foreground"
                                                        )}
                                                        title={`Align ${align}`}
                                                    >
                                                        {align === 'left' && <AlignLeft className="h-3.5 w-3.5" />}
                                                        {align === 'center' && <AlignCenter className="h-3.5 w-3.5" />}
                                                        {align === 'right' && <AlignRight className="h-3.5 w-3.5" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {attribute.type === 'signature' && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label htmlFor="width" className="text-[10px] text-muted-foreground uppercase tracking-wide">Width</Label>
                                    <Input
                                        id="width"
                                        type="number"
                                        value={attribute.width || 120}
                                        onChange={(e) => onChange({ width: parseFloat(e.target.value) || 120 })}
                                        className="h-8 tabular-nums text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="height" className="text-[10px] text-muted-foreground uppercase tracking-wide">Height</Label>
                                    <Input
                                        id="height"
                                        type="number"
                                        value={attribute.height || 60}
                                        onChange={(e) => onChange({ height: parseFloat(e.target.value) || 60 })}
                                        className="h-8 tabular-nums text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-2">
                        <Button
                            variant="destructive"
                            className="w-full h-8 text-sm"
                            onClick={onDelete}
                        >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
