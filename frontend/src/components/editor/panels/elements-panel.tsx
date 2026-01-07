'use client';

import { Square, Circle, Minus, Star, Triangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ElementsPanelProps {
    onAddElement: (type: 'rect' | 'circle' | 'line' | 'star' | 'triangle') => void;
}

export function ElementsPanel({ onAddElement }: ElementsPanelProps) {
    const elements = [
        { type: 'rect', label: 'Rectangle', icon: Square },
        { type: 'circle', label: 'Circle', icon: Circle },
        { type: 'line', label: 'Line', icon: Minus },
        { type: 'triangle', label: 'Triangle', icon: Triangle },
        { type: 'star', label: 'Star', icon: Star },
    ] as const;

    return (
        <div className="flex h-full flex-col bg-background">
            <div className="p-4 border-b">
                <h3 className="text-sm font-semibold mb-1">Shapes</h3>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="grid grid-cols-3 gap-3">
                    {elements.map((el) => (
                        <div key={el.type} className="flex flex-col items-center gap-2">
                            <Button
                                variant="outline"
                                className="h-20 w-full flex flex-col items-center justify-center gap-2 hover:bg-slate-100 transition-colors"
                                onClick={() => onAddElement(el.type)}
                            >
                                <el.icon className="h-8 w-8 text-primary/80" strokeWidth={1.5} />
                            </Button>
                            <span className="text-xs text-muted-foreground">{el.label}</span>
                        </div>
                    ))}
                </div>

                {/* Icons integration placeholder */}
                <div className="mt-8 pt-4 border-t">
                    <h3 className="text-sm font-semibold mb-3">Icons</h3>
                    <div className="text-xs text-muted-foreground bg-muted/20 p-4 rounded text-center">
                        Icon library integration coming soon.
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
