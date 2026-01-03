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
import { Trash2, Type, Calendar, Signature } from 'lucide-react';
import type { DynamicAttribute } from '@/types';
import { AVAILABLE_FONTS, FONT_SIZES, ATTRIBUTE_TYPES } from '@/types';

interface PropertyPanelProps {
    attribute: DynamicAttribute | null;
    pageCount: number;
    onChange: (updates: Partial<DynamicAttribute>) => void;
    onDelete: () => void;
}

export function PropertyPanel({
    attribute,
    pageCount,
    onChange,
    onDelete,
}: PropertyPanelProps) {
    if (!attribute) {
        return (
            <Card className="w-80">
                <CardContent className="flex h-64 items-center justify-center text-muted-foreground">
                    <p className="text-center text-sm">
                        Select an attribute to edit its properties,
                        <br />
                        or click &quot;Add Attribute&quot; to create one.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const TypeIcon = attribute.type === 'date' ? Calendar : attribute.type === 'signature' ? Signature : Type;

    return (
        <Card className="w-80">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <TypeIcon className="h-5 w-5" />
                    Edit Attribute
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Basic Info */}
                <div className="space-y-3">
                    <div>
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                            id="name"
                            value={attribute.name}
                            onChange={(e) => onChange({ name: e.target.value })}
                            placeholder="e.g., Recipient Name"
                        />
                    </div>
                    <div>
                        <Label htmlFor="placeholder">Placeholder</Label>
                        <Input
                            id="placeholder"
                            value={attribute.placeholder}
                            onChange={(e) => onChange({ placeholder: e.target.value })}
                            placeholder="e.g., {Name}"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="required">Required Field</Label>
                        <Switch
                            id="required"
                            checked={attribute.required}
                            onCheckedChange={(checked) => onChange({ required: checked })}
                        />
                    </div>
                    <div>
                        <Label>Type</Label>
                        <Select
                            value={attribute.type}
                            onValueChange={(value: 'text' | 'date' | 'signature') => onChange({ type: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ATTRIBUTE_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Separator />

                {/* Position */}
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Position</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="x">X (points)</Label>
                            <Input
                                id="x"
                                type="number"
                                value={Math.round(attribute.x)}
                                onChange={(e) => onChange({ x: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="y">Y (points)</Label>
                            <Input
                                id="y"
                                type="number"
                                value={Math.round(attribute.y)}
                                onChange={(e) => onChange({ y: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    {pageCount > 1 && (
                        <div>
                            <Label>Page</Label>
                            <Select
                                value={String(attribute.page)}
                                onValueChange={(value) => onChange({ page: parseInt(value) })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: pageCount }, (_, i) => (
                                        <SelectItem key={i + 1} value={String(i + 1)}>
                                            Page {i + 1}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {attribute.type !== 'signature' && (
                    <>
                        <Separator />

                        {/* Text Styling */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground">Styling</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Font</Label>
                                    <Select
                                        value={attribute.fontFamily}
                                        onValueChange={(value) => onChange({ fontFamily: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {AVAILABLE_FONTS.map((font) => (
                                                <SelectItem key={font.value} value={font.value}>
                                                    {font.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Size</Label>
                                    <Select
                                        value={String(attribute.fontSize)}
                                        onValueChange={(value) => onChange({ fontSize: parseInt(value) })}
                                    >
                                        <SelectTrigger>
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
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="color">Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="color"
                                            type="color"
                                            value={attribute.color}
                                            onChange={(e) => onChange({ color: e.target.value })}
                                            className="h-10 w-14 p-1"
                                        />
                                        <Input
                                            value={attribute.color}
                                            onChange={(e) => onChange({ color: e.target.value })}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Weight</Label>
                                    <Select
                                        value={attribute.fontWeight}
                                        onValueChange={(value: 'normal' | 'bold') => onChange({ fontWeight: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="normal">Normal</SelectItem>
                                            <SelectItem value="bold">Bold</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label>Alignment</Label>
                                <Select
                                    value={attribute.align}
                                    onValueChange={(value: 'left' | 'center' | 'right') => onChange({ align: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="left">Left</SelectItem>
                                        <SelectItem value="center">Center</SelectItem>
                                        <SelectItem value="right">Right</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </>
                )}

                {attribute.type === 'signature' && (
                    <>
                        <Separator />

                        {/* Signature Size */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground">Size</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="width">Width (pt)</Label>
                                    <Input
                                        id="width"
                                        type="number"
                                        value={attribute.width || 120}
                                        onChange={(e) => onChange({ width: parseFloat(e.target.value) || 120 })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="height">Height (pt)</Label>
                                    <Input
                                        id="height"
                                        type="number"
                                        value={attribute.height || 60}
                                        onChange={(e) => onChange({ height: parseFloat(e.target.value) || 60 })}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <Separator />

                {/* Delete */}
                <Button
                    variant="destructive"
                    className="w-full"
                    onClick={onDelete}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Attribute
                </Button>
            </CardContent>
        </Card>
    );
}
