'use client';

import { Lock, Unlock, Eye, EyeOff, GripVertical, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DynamicAttribute } from '@/types';
import { cn } from '@/lib/utils';

interface LayersPanelProps {
    attributes: DynamicAttribute[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onUpdate: (id: string, updates: Partial<DynamicAttribute>) => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onDelete: (id: string) => void;
}

export function LayersPanel({
    attributes,
    selectedId,
    onSelect,
    onUpdate,
    onReorder,
    onDelete
}: LayersPanelProps) {
    // Reverse attributes for display so top layer is at top of list
    const reversedAttributes = [...attributes].reverse();

    const handleMove = (e: React.MouseEvent, currentIndex: number, direction: 'up' | 'down') => {
        e.stopPropagation();
        // Index in reversed array needs to be mapped to original array index
        // attributes = [A, B, C] (C is top)
        // reversed = [C, B, A] (C is index 0)

        // If we move C (index 0) 'down' in list, it swaps with B.
        // In original array: C is index 2. B is index 1.
        // Moving C down means swapping index 2 with 1.

        const originalIndex = attributes.length - 1 - currentIndex;
        const targetOriginalIndex = direction === 'up'
            ? originalIndex + 1 // Moving up in display means moving towards end of array (higher Z)
            : originalIndex - 1; // Moving down in display means moving towards start (lower Z)

        if (targetOriginalIndex < 0 || targetOriginalIndex >= attributes.length) return;

        onReorder(originalIndex, targetOriginalIndex);
    };

    return (
        <div className="flex h-full flex-col bg-background">
            <div className="p-4 border-b">
                <h3 className="text-sm font-semibold mb-1">Layers</h3>
                <p className="text-xs text-muted-foreground">Manage object order and visibility</p>
            </div>

            <ScrollArea className="flex-1">
                {reversedAttributes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                        No layers yet
                    </div>
                ) : (
                    <div className="divide-y">
                        {reversedAttributes.map((attr, index) => (
                            <div
                                key={attr.id}
                                className={cn(
                                    "flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors cursor-pointer group",
                                    selectedId === attr.id && "bg-muted border-l-2 border-l-primary pl-[10px]"
                                )}
                                onClick={() => onSelect(attr.id)}
                            >
                                {/* Icons based on type */}
                                <div className="text-xs font-medium truncate flex-1 flex flex-col">
                                    <span>{attr.name}</span>
                                    <span className="text-[10px] text-muted-foreground capitalize">{attr.type}</span>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onUpdate(attr.id, { locked: !attr.locked });
                                        }}
                                        title={attr.locked ? "Unlock" : "Lock"}
                                    >
                                        {attr.locked ? <Lock className="h-3 w-3 text-orange-500" /> : <Unlock className="h-3 w-3 text-muted-foreground" />}
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onUpdate(attr.id, { hidden: !attr.hidden });
                                        }}
                                        title={attr.hidden ? "Show" : "Hide"}
                                    >
                                        {attr.hidden ? <EyeOff className="h-3 w-3 text-muted-foreground" /> : <Eye className="h-3 w-3 text-muted-foreground" />}
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => handleMove(e, index, 'down')}
                                        disabled={index === reversedAttributes.length - 1}
                                        title="Move Backward"
                                    >
                                        <ChevronDown className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => handleMove(e, index, 'up')}
                                        disabled={index === 0}
                                        title="Move Forward"
                                    >
                                        <ChevronUp className="h-3 w-3" />
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(attr.id);
                                        }}
                                        title="Delete"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
