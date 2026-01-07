'use client';

import {
    Plus,
    User,
    Calendar,
    FileText,
    Settings,
    Grid,
    Search,
    CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SYSTEM_ATTRIBUTE_DEFS, DynamicAttribute } from '@/types';

interface AttributesPanelProps {
    attributes: DynamicAttribute[];
    onAddKeyAttribute: (key: keyof typeof SYSTEM_ATTRIBUTE_DEFS) => void;
    onAddCustomAttribute: () => void;
    onSelectAttribute: (id: string) => void;
}

export function AttributesPanel({
    attributes,
    onAddKeyAttribute,
    onAddCustomAttribute,
    onSelectAttribute
}: AttributesPanelProps) {
    const isAttributeUsed = (key: string) => {
        const def = SYSTEM_ATTRIBUTE_DEFS[key as keyof typeof SYSTEM_ATTRIBUTE_DEFS];
        if (!def) return false;
        // Check by ID as system attributes use fixed IDs
        return attributes.some(a => a.id === def.id);
    };

    return (
        <div className="flex h-full flex-col bg-background">
            <div className="border-b p-4 space-y-4">
                <Button className="w-full" onClick={onAddCustomAttribute}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Custom Attribute
                </Button>

                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search attributes..." className="pl-9" />
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {/* Recipient Group */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <User className="h-3.5 w-3.5" />
                            Recipient
                        </div>
                        <div className="space-y-2">
                            <AttributeItem
                                label="Recipient Name"
                                isUsed={isAttributeUsed('recipientName')}
                                onAdd={() => onAddKeyAttribute('recipientName')}
                            />
                            {/* <AttributeItem label="Recipient Email" isUsed={false} onAdd={() => {}} /> */}
                        </div>
                    </div>

                    <Separator />

                    {/* Credential Group */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <FileText className="h-3.5 w-3.5" />
                            Credential
                        </div>
                        <div className="space-y-2">
                            <AttributeItem
                                label="Credential UUID"
                                isUsed={isAttributeUsed('certificateId')}
                                onAdd={() => onAddKeyAttribute('certificateId')}
                            />
                            <AttributeItem
                                label="Issue Date"
                                isUsed={isAttributeUsed('generatedDate')}
                                onAdd={() => onAddKeyAttribute('generatedDate')}
                            />
                            <AttributeItem
                                label="QR Code"
                                isUsed={isAttributeUsed('qrCode')}
                                onAdd={() => onAddKeyAttribute('qrCode')}
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Issuer Group */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <Settings className="h-3.5 w-3.5" />
                            Issuer
                        </div>
                        <div className="space-y-2">
                            {/* Placeholders for future Issuer attributes */}
                            <AttributeItem label="Issuer Name" isUsed={false} onAdd={() => { }} disabled />
                            <AttributeItem label="Support Email" isUsed={false} onAdd={() => { }} disabled />
                        </div>
                    </div>

                    <Separator />

                    {/* Custom Group */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <Grid className="h-3.5 w-3.5" />
                            Custom Attributes
                        </div>
                        <div className="space-y-2">
                            {attributes.filter(a => !a.isSystem).map(attr => (
                                <div
                                    key={attr.id}
                                    className="flex items-center justify-between rounded-md border p-2 hover:bg-muted/50 cursor-pointer"
                                    onClick={() => onSelectAttribute(attr.id)}
                                >
                                    <span className="text-sm font-medium">{attr.name}</span>
                                    <Badge variant="secondary" className="text-[10px]">In Use</Badge>
                                </div>
                            ))}
                            {attributes.filter(a => !a.isSystem).length === 0 && (
                                <p className="text-xs text-muted-foreground italic pl-1">No custom attributes yet</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            variant="link"
                            className="h-auto p-0 text-xs text-blue-600"
                            onClick={() => alert("Enhanced attribute management coming soon!")}
                        >
                            Manage Attributes
                        </Button>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}

function AttributeItem({ label, isUsed, onAdd, disabled }: { label: string, isUsed: boolean, onAdd: () => void, disabled?: boolean }) {
    return (
        <div className="flex items-center justify-between group">
            <span className={`text-sm ${disabled ? 'text-muted-foreground/50' : 'text-foreground'}`}>{label}</span>
            {isUsed ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 gap-1 pl-1">
                    <CheckCircle2 className="h-3 w-3" />
                    In Use
                </Badge>
            ) : (
                <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                    onClick={onAdd}
                    disabled={disabled}
                >
                    Use
                </Button>
            )}
        </div>
    );
}
